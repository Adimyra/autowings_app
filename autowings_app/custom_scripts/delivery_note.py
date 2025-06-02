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

# -------------------------------

import frappe

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
    - Create Serial No Documents if required
    - Auto-update Vehicle Sales Master (VSM) upon submission
    """

    for item in doc.get("items"):
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
                vsm_doc.is_delivered = 1  # Mark as delivered
                vsm_doc.delivery_note = dn_doc.name  # Save Delivery Note document name in VSM


                vsm_doc.save()
                frappe.db.commit()

    # frappe.msgprint("Vehicle Sales Master has been updated successfully.")
    return "Success"



# .....
