
import frappe

# def before_submit(doc, method):
#     """
#     Before Submit:
#     - Validate chassis numbers for serialized items
#     - Ensure only one vehicle item (custom_is_vehicle = 1)
#     - Create Vehicle Sales Master (VSM)
#     - Create RTO Registration if applicable
#     - Create Vehicle Insurance if applicable
#     - Create Vehicle Finance if applicable
#     """

#     if doc.update_stock:
#         for item in doc.get("items"):
#             has_serial_no = frappe.db.get_value("Item", item.item_code, "has_serial_no")
#             if has_serial_no:
#                 chassis_list = [
#                     vin.chassis_number for vin in doc.get("custom_vin") 
#                     if vin.item == item.item_code and vin.chassis_number
#                 ]
#                 if len(chassis_list) < int(item.qty):
#                     frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")
#                 item.serial_no = "\n".join(chassis_list)

#         doc.custom_vin = [
#             vin for vin in doc.get("custom_vin") 
#             if frappe.db.get_value("Item", vin.item, "has_serial_no")
#         ]

#     # 🔹 **Check if at least one vehicle item exists**
#     vehicle_items = [item for item in doc.items if item.custom_is_vehicle]

#     if not vehicle_items:
#         # ✅ **No vehicle present → Skip RTO, Insurance, Finance & Allow Sales Invoice**
#         return  

#     # 🚫 **Restrict multiple vehicle sales in a single Sales Invoice**
#     if len(vehicle_items) > 1:
#         frappe.throw(
#             "Only one vehicle item is allowed in a Sales Invoice for RTO Registration, Insurance, and Finance. "
#             "If you need to sell multiple vehicles, do not check these options and create separate documents."
#         )

#     # ✅ **Proceed with document creation since a vehicle item exists**
#     rto_doc_name = None
#     if doc.custom_rto_registration:
#         rto_doc_name = create_rto_registration(doc, vehicle_items[0])

#     vsm_doc_names = create_vehicle_sales_master(doc)

#     if rto_doc_name:
#         rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#         rto_doc.vsm_id = ", ".join(vsm_doc_names)  # ✅ Link VSM ID
#         rto_doc.save()

#     insurance_doc_name = None
#     if doc.custom_insurance:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_names)

#     finance_doc_name = None
#     if doc.custom_is_finance:
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_names)

#     for vsm_doc_name in vsm_doc_names:
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         if rto_doc_name:
#             vsm_doc.rto_registration_id = rto_doc_name
#         if insurance_doc_name:
#             vsm_doc.insurance_id = insurance_doc_name
#         if finance_doc_name:
#             vsm_doc.finance_id = finance_doc_name
#         vsm_doc.save()


# @frappe.whitelist()
# def create_vehicle_sales_master(doc):
#     """Creates Vehicle Sales Master (VSM) for the vehicle item in the Sales Invoice."""
#     vsm_doc_names = []

#     existing_vsm_items = frappe.get_all("Vehicle Sales Master", filters={"sales_invoice": doc.name}, fields=["item"])
#     existing_items = {vsm["item"] for vsm in existing_vsm_items}

#     for item in doc.items:
#         if not item.custom_is_vehicle or item.item_code in existing_items:
#             continue  

#         vehicle_details = [
#             vin for vin in doc.custom_vin 
#             if vin.item == item.item_code and vin.chassis_number
#         ]

#         if doc.update_stock and len(vehicle_details) < int(item.qty):
#             frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")

#         for index in range(int(item.qty)):
#             vsm_doc = frappe.get_doc({
#                 "doctype": "Vehicle Sales Master",
#                 "customer": doc.customer,
#                 "item": item.item_code,
#                 "sales_invoice": doc.name,
#                 "rto_registration": doc.custom_rto_registration,
#                 "is_finance": doc.custom_is_finance,
#                 "is_insurance": doc.custom_insurance,
#                 "is_delivered": 1 if doc.update_stock else 0
#             })

#             if doc.update_stock and index < len(vehicle_details):
#                 vin_data = vehicle_details[index]
#                 vsm_doc.chassis_number = vin_data.chassis_number
#                 vsm_doc.engine_number = vin_data.engine_number
#                 vsm_doc.vehicle_color = vin_data.vehicle_color
#                 vsm_doc.manufacturing_date = vin_data.manufacturing_date

#             vsm_doc.insert()
#             frappe.db.commit()
#             vsm_doc_names.append(vsm_doc.name)

#     return vsm_doc_names

# @frappe.whitelist()
# def create_rto_registration(doc, vehicle_item):
#     """Creates RTO Registration document."""
#     existing_rto = frappe.get_all("RTO Registration", filters={"sales_invoice": doc.name}, fields=["name"])
#     if existing_rto:
#         return existing_rto[0]["name"]

#     rto_doc = frappe.get_doc({
#         "doctype": "RTO Registration",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "rto_office": doc.custom_rto_office or "",
#         "registration_charge": next((i.rate for i in doc.items if i.item_code == doc.custom_rto_charge_item), 0),
#         "registration_status": "Pending"
#     })
#     rto_doc.insert()
#     frappe.db.commit()
#     return rto_doc.name

# @frappe.whitelist()
# def create_vehicle_insurance(doc, vsm_doc_names):
#     """Creates a Vehicle Insurance document if applicable."""
#     if not doc.custom_insurance or not doc.custom_insurance_provider or not doc.custom_insurance_policy:
#         return None

#     existing_insurance = frappe.get_all("Vehicle Insurance", filters={"vsm_id": ["in", vsm_doc_names]}, fields=["name"])
#     if existing_insurance:
#         return existing_insurance[0]["name"]

#     insurance_doc = frappe.get_doc({
#         "doctype": "Vehicle Insurance",
#         "customer": doc.customer,
#         "vsm_id": ", ".join(vsm_doc_names),
#         "insurance_provider": doc.custom_insurance_provider,
#         "policy_name": doc.custom_insurance_policy,
#         "insurance_amount": next((i.rate for i in doc.items if i.item_code == doc.custom_insurance_charge_item), 0),
#         "insurance_status": "Applied"
#     })
#     insurance_doc.insert()
#     frappe.db.commit()
#     return insurance_doc.name


# @frappe.whitelist()
# def create_vehicle_finance(doc, vsm_doc_names):
#     """Creates a Vehicle Finance document if applicable."""
#     if not doc.custom_is_finance or not doc.custom_finance_provider or not doc.custom_loan_amount:
#         return None

#     existing_finance = frappe.get_all("Vehicle Finance", filters={"vsm_id": ["in", vsm_doc_names]}, fields=["name"])
#     if existing_finance:
#         return existing_finance[0]["name"]

#     finance_doc = frappe.get_doc({
#         "doctype": "Vehicle Finance",
#         "customer": doc.customer,
#         "vsm_id": ", ".join(vsm_doc_names),
#         "finance_provider": doc.custom_finance_provider,
#         "loan_amount": doc.custom_loan_amount,
#         "finance_status": "Pending"
#     })
#     finance_doc.insert()
#     frappe.db.commit()
#     return finance_doc.name

# get all policy
@frappe.whitelist()
def get_insurance_policies(provider):
    """Fetch insurance policies for the selected provider from the standalone Insurance Policy Doctype."""
    policies = frappe.get_all(
        "Insurance Policy",
        filters={"insurance_provider": provider},  # Now filtering from standalone Doctype
        fields=["name", "policy_name"]
    )
    return policies

import frappe

def before_submit(doc, method):
    """
    Before Submit Hook for Sales Invoice:
    - Ensure `custom_sale_type` is selected.
    - If Vehicle Sale, enforce mandatory `custom_vin` details before submission.
    - Restrict multiple items and multiple quantity for Vehicle Sales.
    - Create VSM, RTO, Insurance, Finance Documents.
    - Update Serial No with VSM ID.
    """

    # ✅ Ensure `custom_sale_type` is set
    if not doc.custom_sale_type:
        frappe.throw("Sale Type (`custom_sale_type`) is required.")

    # ✅ If Spare, skip all vehicle processes
    if doc.custom_sale_type == "Spare":
        return  

    # ✅ Ensure only 1 item and qty == 1 in Vehicle Sale
    if len(doc.items) > 1:
        frappe.throw("Only one item is allowed in the Items table for Vehicle sales.")
    
    if doc.items[0].qty > 1:
        frappe.throw("Quantity must be 1 for a Vehicle sale.")

    # ✅ Ensure `custom_vin` is populated for Vehicle Sales when `update_stock` is checked
    if doc.update_stock:
        if not doc.custom_vin:
            frappe.throw("Chassis Number details are required in VIN table.")

        # ✅ Validate each VIN entry for mandatory fields
        for vin in doc.custom_vin:
            if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
                frappe.throw(
                    f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
                )

    # ✅ Create Vehicle Sales Master (VSM)
    vsm_doc_name = create_vehicle_sales_master(doc)

    # ✅ Create RTO Registration if applicable
    rto_doc_name = None
    if doc.custom_rto_office and doc.custom_registration_charge:
        rto_doc_name = create_rto_registration(doc, vsm_doc_name)

    # ✅ Create Vehicle Insurance if applicable
    insurance_doc_name = None
    if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
        insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_name)

    # ✅ Create Vehicle Finance if applicable
    finance_doc_name = None
    if doc.custom_finance_provider and doc.custom_finance_amount:
        finance_doc_name = create_vehicle_finance(doc, vsm_doc_name)

    # ✅ Update Serial No doctype with VSM ID
    if doc.update_stock:
        update_serial_no_with_vsm(doc, vsm_doc_name)
        update_customer_vsm(doc, vsm_doc_name)


    # ✅ Update VSM Document with RTO, Insurance & Finance IDs
    vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
    vsm_doc.is_delivered = 1 if doc.update_stock else 0
    
    if rto_doc_name:
        vsm_doc.rto_registration = 1
        vsm_doc.rto_registration_id = rto_doc_name
        vsm_doc.rto_office = doc.custom_rto_office
        vsm_doc.registration_status = "Pending"

    if insurance_doc_name:
        vsm_doc.is_insurance = 1
        vsm_doc.insurance_id = insurance_doc_name
        vsm_doc.insurance_provider = doc.custom_insurance_provider
        vsm_doc.insurance_status = "Applied"

    if finance_doc_name:
        vsm_doc.is_finance = 1
        vsm_doc.finance_id = finance_doc_name
        vsm_doc.finance_provider = doc.custom_finance_provider
        vsm_doc.loan_amount = doc.custom_finance_amount
        vsm_doc.loan_status = "Pending"

    vsm_doc.save()


def update_serial_no_with_vsm(doc, vsm_doc_name):
    """Update Serial No doctype with VSM ID when `update_stock` is checked."""
    for vin in doc.get("custom_vin"):
        if frappe.db.exists("Serial No", vin.chassis_number):
            serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
            serial_no_doc.custom_vsm_id = vsm_doc_name
            serial_no_doc.save()

import frappe

def update_customer_vsm(doc, vsm_doc_name):
    """
    Update the Customer doctype's `custom_vin` child table with VSM ID.
    - If chassis number exists, update the `vsm_id`.
    - If chassis number does not exist, append a new row.
    """
    
    # ✅ Ensure the document has a customer linked
    if not doc.customer:
        frappe.throw("Customer is required to update VSM ID in Customer doctype.")
    
    # ✅ Fetch the Customer document
    customer_doc = frappe.get_doc("Customer", doc.customer)

    # ✅ Loop through all VINs in `custom_vin` from Sales Invoice
    for vin in doc.get("custom_vin"):
        # Check if chassis_number already exists in Customer's `custom_vin`
        existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)
        
        if existing_vin:
            # ✅ Update the VSM ID for existing chassis number
            existing_vin.vsm_id = vsm_doc_name
        else:
            # ✅ Append new VIN entry in Customer's `custom_vin` table
            customer_doc.append("custom_vin", {
                "chassis_number": vin.chassis_number,
                "vsm_id": vsm_doc_name
            })
    
    # ✅ Save the Customer document
    customer_doc.save(ignore_permissions=True)
    frappe.msgprint(f"VSM ID updated for Customer: {customer_doc.name}")


def create_vehicle_sales_master(doc):
    """Creates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
    
    # ✅ Ensure VIN table has at least one entry
    if not doc.custom_vin:
        frappe.throw("Chassis Number details are required in VIN table.")

    vin = doc.custom_vin[0]  # Only one vehicle is allowed

    vsm_doc = frappe.get_doc({
        "doctype": "Vehicle Sales Master",
        "customer": doc.customer,
        "sales_invoice": doc.name,
        "chassis_number": vin.chassis_number,
        "engine_number": vin.engine_number,
        "vehicle_color": vin.vehicle_color,
        "manufacturing_date": vin.manufacturing_date,
        "is_delivered": 1 if doc.update_stock else 0
    })
    vsm_doc.insert()
    frappe.db.commit()
    return vsm_doc.name


def create_rto_registration(doc, vsm_doc_name):
    """Creates an RTO Registration document if applicable."""
    rto_doc = frappe.get_doc({
        "doctype": "RTO Registration",
        "customer": doc.customer,
        "sales_invoice": doc.name,
        "vsm_id": vsm_doc_name,
        "rto_office": doc.custom_rto_office,
        "registration_charge": doc.custom_registration_charge,
        "registration_status": "Pending"
    })
    rto_doc.insert()
    frappe.db.commit()
    return rto_doc.name


def create_vehicle_insurance(doc, vsm_doc_name):
    """Creates a Vehicle Insurance document if applicable."""
    insurance_doc = frappe.get_doc({
        "doctype": "Vehicle Insurance",
        "customer": doc.customer,
        "sales_invoice": doc.name,
        "vsm_id": vsm_doc_name,
        "insurance_provider": doc.custom_insurance_provider,
        "policy_name": doc.custom_insurance_policy,
        "insurance_amount": doc.custom_insurance_amount,
        "insurance_status": "Applied"
    })
    insurance_doc.insert()
    frappe.db.commit()
    return insurance_doc.name


def create_vehicle_finance(doc, vsm_doc_name):
    """Creates a Vehicle Finance document if applicable."""
    finance_doc = frappe.get_doc({
        "doctype": "Vehicle Finance",
        "customer": doc.customer,
        "sales_invoice": doc.name,
        "vsm_id": vsm_doc_name,
        "finance_provider": doc.custom_finance_provider,
        "loan_amount": doc.custom_finance_amount,
        "finance_status": "Pending"
    })
    finance_doc.insert()
    frappe.db.commit()
    return finance_doc.name
