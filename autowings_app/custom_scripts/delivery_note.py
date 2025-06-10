# import frappe

# def before_save(doc, method):
#     """ 
#     Automatically add rows in 'custom_vin' child table 
#     for items that require Serial Numbers based on quantity.
#     """
#     existing_vins = {vin.item: vin for vin in doc.get("custom_vin")}
    
#     for item in doc.get("items"):
#         is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

#         if is_serialized:
#             qty = int(item.qty)
#             existing_count = len([vin for vin in doc.get("custom_vin") if vin.item == item.item_code])

#             if existing_count < qty:
#                 for _ in range(qty - existing_count):
#                     doc.append("custom_vin", {"item": item.item_code})


# def before_submit(doc, method):
#     """ 
#     Before Submit: 
#     - Ensure Serial No field is populated for serialized items
#     - Create Serial No Documents if required
#     """
#     for item in doc.get("items"):
#         is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

#         if is_serialized:
#             chassis_list = [
#                 vin.chassis_number for vin in doc.get("custom_vin") 
#                 if vin.item == item.item_code and vin.chassis_number
#             ]

#             if not chassis_list:
#                 frappe.throw(f"Missing chassis numbers for item {item.item_code}. Please enter them in 'custom_vin'.")

#             item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers


# @frappe.whitelist()
# def update_vehicle_sales_master_from_delivery_note(delivery_note):
#     """Updates Vehicle Sales Master (VSM) with chassis details from Delivery Note."""

#     dn_doc = frappe.get_doc("Delivery Note", delivery_note)

#     for item in dn_doc.items:
#         vsm_entries = frappe.get_all(
#             "Vehicle Sales Master",
#             filters={"sales_invoice": item.against_sales_invoice, "item": item.item_code},
#             fields=["name"]
#         )

#         # Fetch all matching chassis details from 'custom_vin' (Delivery Note)
#         vehicle_details = [
#             vin for vin in dn_doc.custom_vin 
#             if vin.item == item.item_code and vin.chassis_number
#         ]

#         if len(vehicle_details) < len(vsm_entries):
#             frappe.throw(f"Not enough chassis numbers in Delivery Note for item {item.item_code}.")

#         for index, vsm in enumerate(vsm_entries):
#             vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm["name"])
            
#             if index < len(vehicle_details):
#                 vin_data = vehicle_details[index]
#                 vsm_doc.chassis_number = vin_data.chassis_number
#                 vsm_doc.engine_number = vin_data.engine_number
#                 vsm_doc.vehicle_color = vin_data.vehicle_color
#                 vsm_doc.manufacturing_date = vin_data.manufacturing_date
#                 vsm_doc.is_delivered = 1  # Mark as delivered

#                 vsm_doc.save()
#                 frappe.db.commit()

#     return "Success"

# # -------------------------------

import frappe
from frappe.model.document import Document
from frappe import _

def before_save(doc, method):
    """ 
    Automatically add rows in 'custom_vin' child table 
    for items that require Serial Numbers based on quantity.
    """
    existing_vins = {vin.item: vin for vin in doc.get("custom_vin")}
    
    for item in doc.get("items"):
        is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

        if is_serialized:
            qty = int(item.qty)
            existing_count = len([vin for vin in doc.get("custom_vin") if vin.item == item.item_code])

            if existing_count < qty:
                for _ in range(qty - existing_count):
                    doc.append("custom_vin", {"item": item.item_code})

def before_submit(doc, method):
    """ 
    Before Submit:
    - Ensure Serial No field is populated for serialized items
    - Auto-update Vehicle Sales Master (VSM) upon submission
    """
    for item in doc.items:
        is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

        if is_serialized:
            chassis_list = [
                vin.chassis_number for vin in doc.get("custom_vin") 
                if vin.item == item.item_code and vin.chassis_number
            ]

            if not chassis_list:
                frappe.throw(f"Missing chassis numbers for item {item.item_code}. Please enter them in 'custom_vin'.")

            item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers

    # Automatically update Vehicle Sales Master (VSM) after submitting Delivery Note
    update_vehicle_sales_master_from_delivery_note(doc.name)

def on_submit(doc, method):
    """ 
    On Submit:
    - For regular Delivery Note: Append items to AW Job Card's items table
    - For return Delivery Note: Reduce quantities in items table and append to return_items table
    """
    if doc.custom_job_card_id:
        # Fetch the corresponding AW Job Card
        job_card = frappe.get_doc("AW Job Card", doc.custom_job_card_id)
        
        # Check if Job Card is submitted
        if job_card.docstatus == 1:
            frappe.throw(_("Cannot modify items in submitted Job Card {0}").format(job_card.name))
        
        if doc.is_return:
            # Handle return Delivery Note
            for dn_item in doc.items:
                # Find matching item in Job Card's items table
                for jc_item in job_card.items:
                    if jc_item.item_code == dn_item.item_code and jc_item.delivery_note_id == doc.return_against:
                        # Reduce quantities (negative qty in return Delivery Note)
                        new_qty = jc_item.required_qty + dn_item.qty  # qty is negative
                        if new_qty < 0:
                            frappe.throw(_(
                                "Cannot reduce quantity for item {0} in Job Card {1} below 0 (current: {2}, reduction: {3})"
                            ).format(jc_item.item_code, job_card.name, jc_item.required_qty, dn_item.qty))
                        jc_item.required_qty = new_qty
                        jc_item.transferred_qty = new_qty
                
                # Append to return_items table
                job_card.append("return_items", {
                    "item_code": dn_item.item_code,
                    "item_name": dn_item.item_name,
                    "item_group": dn_item.item_group,
                    "stock_uom": dn_item.stock_uom,
                    "required_qty": abs(dn_item.qty),  # Store positive qty
                    "transferred_qty": abs(dn_item.qty),
                    "allow_alternative_item": 0
                })
        else:
            # Handle regular Delivery Note
            for dn_item in doc.items:
                job_card.append("items", {
                    "item_code": dn_item.item_code,
                    "item_name": dn_item.item_name,
                    "source_warehouse": dn_item.warehouse,
                    "required_qty": dn_item.qty,
                    "stock_uom": dn_item.stock_uom,
                    "item_group": dn_item.item_group,
                    "delivery_note_id": doc.name,
                    "transferred_qty": dn_item.qty,
                    "allow_alternative_item": 0
                })
        
        # Save the Job Card
        job_card.save()
        frappe.db.commit()
        action = "Updated return items" if doc.is_return else "Appended items"
        frappe.msgprint(f"{action} in Job Card {doc.custom_job_card_id} from Delivery Note {doc.name}")

def on_cancel(doc, method):
    """ 
    On Cancel:
    - Remove items from AW Job Card's items table matching the Delivery Note's delivery_note_id
    """
    if doc.custom_job_card_id:
        # Fetch the corresponding AW Job Card
        job_card = frappe.get_doc("AW Job Card", doc.custom_job_card_id)
        
        # Check if Job Card is submitted
        if job_card.docstatus == 1:
            frappe.throw(_("Cannot modify items in submitted Job Card {0}").format(job_card.name))
        
        # Remove items matching the Delivery Note ID
        job_card.items = [item for item in job_card.items if item.delivery_note_id != doc.name]
        
        # Save the Job Card
        job_card.save()
        frappe.db.commit()
        frappe.msgprint(f"Removed items from Job Card {doc.custom_job_card_id} for cancelled Delivery Note {doc.name}")

@frappe.whitelist()
def update_vehicle_sales_master_from_delivery_note(delivery_note):
    """Updates Vehicle Sales Master (VSM) with chassis details from Delivery Note."""
    dn_doc = frappe.get_doc("Delivery Note", delivery_note)

    for item in dn_doc.items:
        vsm_entries = frappe.get_all(
            "Vehicle Sales Master",
            filters={"sales_invoice": item.against_sales_invoice, "item": item.item_code},
            fields=["name"]
        )

        # Fetch all matching chassis details from 'custom_vin' (Delivery Note)
        vehicle_details = [
            vin for vin in dn_doc.custom_vin 
            if vin.item == item.item_code and vin.chassis_number
        ]

        if len(vehicle_details) < len(vsm_entries):
            frappe.throw(f"Not enough chassis numbers in Delivery Note for item {item.item_code}.")

        for index, vsm in enumerate(vsm_entries):
            vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm["name"])
            
            if index < len(vehicle_details):
                vin_data = vehicle_details[index]
                vsm_doc.chassis_number = vin_data.chassis_number
                vsm_doc.engine_number = vin_data.engine_number
                vsm_doc.vehicle_color = vin_data.vehicle_color
                vsm_doc.manufacturing_date = vin_data.manufacturing_date
                vsm_doc.is_delivered = 1 if not dn_doc.is_return else 0  # Mark as delivered or not
                vsm_doc.delivery_note = dn_doc.name  # Save Delivery Note document name in VSM

                vsm_doc.save()
                frappe.db.commit()

    return "Success"
# import frappe

# def before_save(doc, method):
#     """ 
#     Automatically add rows in 'custom_vin' child table 
#     for items that require Serial Numbers based on quantity.
#     """
#     existing_vins = {vin.item: vin for vin in doc.get("custom_vin")}
    
#     for item in doc.get("items"):
#         is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

#         if is_serialized:
#             qty = int(item.qty)
#             existing_count = len([vin for vin in doc.get("custom_vin") if vin.item == item.item_code])

#             if existing_count < qty:
#                 for _ in range(qty - existing_count):
#                     doc.append("custom_vin", {"item": item.item_code})


# def before_submit(doc, method):
#     """ 
#     Before Submit:
#     - Ensure Serial No field is populated for serialized items
#     - Create Serial No Documents if required
#     - Auto-update Vehicle Sales Master (VSM) upon submission
#     """

#     for item in doc.get("items"):
#         is_serialized = frappe.db.get_value("Item", item.item_code, "has_serial_no")

#         if is_serialized:
#             chassis_list = [
#                 vin.chassis_number for vin in doc.get("custom_vin") 
#                 if vin.item == item.item_code and vin.chassis_number
#             ]

#             if not chassis_list:
#                 frappe.throw(f"Missing chassis numbers for item {item.item_code}. Please enter them in 'custom_vin'.")

#             item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers

#     # Automatically update Vehicle Sales Master (VSM) after submitting Delivery Note
#     update_vehicle_sales_master_from_delivery_note(doc.name)


# @frappe.whitelist()
# def update_vehicle_sales_master_from_delivery_note(delivery_note):
#     """Updates Vehicle Sales Master (VSM) with chassis details from Delivery Note."""

#     dn_doc = frappe.get_doc("Delivery Note", delivery_note)

#     for item in dn_doc.items:
#         vsm_entries = frappe.get_all(
#             "Vehicle Sales Master",
#             filters={"sales_invoice": item.against_sales_invoice, "item": item.item_code},
#             fields=["name"]
#         )

#         # Fetch all matching chassis details from 'custom_vin' (Delivery Note)
#         vehicle_details = [
#             vin for vin in dn_doc.custom_vin 
#             if vin.item == item.item_code and vin.chassis_number
#         ]

#         if len(vehicle_details) < len(vsm_entries):
#             frappe.throw(f"Not enough chassis numbers in Delivery Note for item {item.item_code}.")

#         for index, vsm in enumerate(vsm_entries):
#             vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm["name"])
            
#             if index < len(vehicle_details):
#                 vin_data = vehicle_details[index]
#                 vsm_doc.chassis_number = vin_data.chassis_number
#                 vsm_doc.engine_number = vin_data.engine_number
#                 vsm_doc.vehicle_color = vin_data.vehicle_color
#                 vsm_doc.manufacturing_date = vin_data.manufacturing_date
#                 vsm_doc.is_delivered = 1  # Mark as delivered
#                 vsm_doc.delivery_note = dn_doc.name  # Save Delivery Note document name in VSM


#                 vsm_doc.save()
#                 frappe.db.commit()

#     # frappe.msgprint("Vehicle Sales Master has been updated successfully.")
#     return "Success"



# # .....

# import frappe
# from frappe.model.document import Document
# from frappe import _

# def on_submit(doc, method):
#     # Check if custom_job_card_id exists in the Delivery Note
#     if doc.custom_job_card_id:
#         # Fetch the corresponding AW Job Card
#         job_card = frappe.get_doc("AW Job Card", doc.custom_job_card_id)
        
#         # Check if Job Card is submitted
#         if job_card.docstatus == 1:
#             frappe.throw(_("Cannot modify items in submitted Job Card {0}").format(job_card.name))
        
#         # Create a dictionary of existing Job Card items
#         job_card_items = {item.item_code: item for item in job_card.items}
        
#         # Update existing items or append new ones
#         for dn_item in doc.items:
#             if dn_item.item_code in job_card_items:
#                 # Update existing item
#                 job_card_item = job_card_items[dn_item.item_code]
#                 if job_card_item.required_qty > dn_item.qty:
#                     frappe.throw(_("Cannot reduce quantity for item {0} from {1} to {2} in Job Card {3}")
#                                  .format(dn_item.item_code, job_card_item.required_qty, dn_item.qty, job_card.name))
#                 job_card_item.delivery_note_id = doc.name
#                 job_card_item.source_warehouse = dn_item.warehouse
#                 job_card_item.item_name = dn_item.item_name
#                 job_card_item.item_group = dn_item.item_group
#                 job_card_item.stock_uom = dn_item.stock_uom
#                 job_card_item.transferred_qty = dn_item.qty
#             else:
#                 # Append new item
#                 job_card.append("items", {
#                     "item_code": dn_item.item_code,
#                     "item_name": dn_item.item_name,
#                     "source_warehouse": dn_item.warehouse,
#                     "required_qty": dn_item.qty,
#                     "stock_uom": dn_item.stock_uom,
#                     "item_group": dn_item.item_group,
#                     "delivery_note_id": doc.name,
#                     "transferred_qty": dn_item.qty,
#                     "allow_alternative_item": 0
#                 })
        
#         # Save the Job Card
#         job_card.save()
#         frappe.db.commit()
#         frappe.msgprint(f"Updated items in Job Card {doc.custom_job_card_id} from Delivery Note {doc.name}")