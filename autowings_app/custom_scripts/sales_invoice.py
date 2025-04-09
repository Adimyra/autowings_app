import frappe

@frappe.whitelist()
def get_insurance_policies(provider):
    """Fetch insurance policies for the selected provider from the standalone Insurance Policy Doctype."""
    policies = frappe.get_all(
        "Insurance Policy",
        filters={"insurance_provider": provider},
        fields=["name", "policy_name"]
    )
    return policies

def before_submit(doc, method):
    """
    Before Submit Hook for Sales Invoice:
    - Ensure `custom_sale_type` is selected.
    - If Vehicle Sale, enforce mandatory `custom_vin` details before submission.
    - Restrict multiple items and multiple quantity for Vehicle Sales.
    - Create VSM, RTO, Insurance, Finance Documents.
    - Update Serial No with VSM ID.
    - If Spare or Other, skip vehicle processes and uncheck update_stock.
    """
    # ✅ Ensure `custom_sale_type` is set
    if not doc.custom_sale_type:
        frappe.throw("Sale Type (`custom_sale_type`) is required.")

    # ✅ If Spare or Other, uncheck update_stock and skip vehicle processes
    if doc.custom_sale_type in ["Spare", "Other"]:
        doc.update_stock = 0
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

        # ✅ Validate each VIN entry for mandatory fields and match with items
        vin_item_codes = {vin.item for vin in doc.custom_vin}
        item_codes = {item.item_code for item in doc.items}
        if not vin_item_codes.issubset(item_codes):
            frappe.throw("VIN entries must correspond to items in the Items table.")

        for vin in doc.custom_vin:
            if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
                frappe.throw(
                    f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
                )

    # ✅ Update `serial_no` in Items Table from `custom_vin`
    update_items_with_chassis_numbers(doc)

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

def update_items_with_chassis_numbers(doc):
    """
    Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers.
    """
    item_chassis_map = {}

    # ✅ Group chassis numbers by item code
    for vin in doc.custom_vin:
        if vin.item not in item_chassis_map:
            item_chassis_map[vin.item] = []
        item_chassis_map[vin.item].append(vin.chassis_number)

    # ✅ Update items table
    for item in doc.items:
        if item.item_code in item_chassis_map:
            item.serial_no = "\n".join(item_chassis_map[item.item_code])  # Assign chassis numbers to serial_no field

def update_serial_no_with_vsm(doc, vsm_doc_name):
    """Update Serial No doctype with VSM ID when `update_stock` is checked."""
    for vin in doc.get("custom_vin"):
        if frappe.db.exists("Serial No", vin.chassis_number):
            serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
            serial_no_doc.custom_vsm_id = vsm_doc_name
            serial_no_doc.save()

def update_customer_vsm(doc, vsm_doc_name):
    """
    Update the Customer doctype's `custom_vin` child table with VSM ID.
    - If chassis number exists, update the `vsm_id`.
    - If chassis number does not exist, append a new row.
    """
    if not doc.customer:
        frappe.throw("Customer is required to update VSM ID in Customer doctype.")
    
    customer_doc = frappe.get_doc("Customer", doc.customer)

    for vin in doc.get("custom_vin"):
        existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)
        
        if existing_vin:
            existing_vin.vsm_id = vsm_doc_name
        else:
            customer_doc.append("custom_vin", {
                "chassis_number": vin.chassis_number,
                "vsm_id": vsm_doc_name
            })
    
    customer_doc.save(ignore_permissions=True)

def create_vehicle_sales_master(doc):
    """Creates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
    try:
        if not doc.custom_vin:
            frappe.throw("Chassis Number details are required in VIN table.")
        vin = doc.custom_vin[0]
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
    except frappe.DuplicateEntryError:
        frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
    except Exception as e:
        frappe.log_error(f"Error creating VSM: {str(e)}")
        raise

def create_rto_registration(doc, vsm_doc_name):
    """Creates an RTO Registration document if applicable."""
    try:
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
    except Exception as e:
        frappe.log_error(f"Error creating RTO Registration: {str(e)}")
        raise

def create_vehicle_insurance(doc, vsm_doc_name):
    """Creates a Vehicle Insurance document if applicable."""
    try:
        policies = get_insurance_policies(doc.custom_insurance_provider)
        if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
            frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
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
    except Exception as e:
        frappe.log_error(f"Error creating Vehicle Insurance: {str(e)}")
        raise

def create_vehicle_finance(doc, vsm_doc_name):
    """Creates a Vehicle Finance document if applicable."""
    try:
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
    except Exception as e:
        frappe.log_error(f"Error creating Vehicle Finance: {str(e)}")
        raise

# autowings_app/autowings_app/custom_scripts/sales_invoice.py
# autowings_app/autowings_app/custom_scripts/sales_invoice.py

# import frappe
# from frappe import throw, msgprint, log_error

# @frappe.whitelist()
# def get_insurance_policies(provider):
#     """Fetch insurance policies for the selected provider from the standalone Insurance Policy Doctype."""
#     policies = frappe.get_all(
#         "Insurance Policy",
#         filters={"insurance_provider": provider},  # Now filtering from standalone Doctype
#         fields=["name", "policy_name"]
#     )
#     return policies

# def before_submit(doc, method):
#     """
#     Before Submit Hook for Sales Invoice:
#     - Ensure `custom_sale_type` is selected.
#     - If Vehicle Sale, enforce mandatory `custom_vin` details before submission.
#     - Restrict multiple items and multiple quantity for Vehicle Sales.
#     - Create VSM, RTO, Insurance, Finance Documents.
#     - Update Serial No with VSM ID.
#     """

#     # ✅ Ensure `custom_sale_type` is set
#     if not doc.custom_sale_type:
#         frappe.throw("Sale Type (`custom_sale_type`) is required.")

#     # ✅ If Spare, skip all vehicle processes
#     if doc.custom_sale_type == "Spare":
#         return  

#     # ✅ Ensure only 1 item and qty == 1 in Vehicle Sale
#     if len(doc.items) > 1:
#         frappe.throw("Only one item is allowed in the Items table for Vehicle sales.")
    
#     if doc.items[0].qty > 1:
#         frappe.throw("Quantity must be 1 for a Vehicle sale.")

#     # ✅ Ensure `custom_vin` is populated for Vehicle Sales when `update_stock` is checked
#     if doc.update_stock:
#         if not doc.custom_vin:
#             frappe.throw("Chassis Number details are required in VIN table.")

#         # ✅ Validate each VIN entry for mandatory fields
#         for vin in doc.custom_vin:
#             if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
#                 frappe.throw(
#                     f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
#                 )

#     # ✅ Update `serial_no` in Items Table from `custom_vin`
#     update_items_with_chassis_numbers(doc)

#     # ✅ Create Vehicle Sales Master (VSM)
#     vsm_doc_name = create_vehicle_sales_master(doc)

#     # ✅ Create RTO Registration if applicable
#     rto_doc_name = None
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc_name = create_rto_registration(doc, vsm_doc_name)

#     # ✅ Create Vehicle Insurance if applicable
#     insurance_doc_name = None
#     if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_name)

#     # ✅ Create Vehicle Finance if applicable
#     finance_doc_name = None
#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         # Validate that custom_finance_provider exists as a Supplier
#         if not frappe.db.exists("Supplier", doc.custom_finance_provider):
#             frappe.throw(f"Supplier {doc.custom_finance_provider} not found. Please create it under Selling > Supplier.")
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_name)

#     # ✅ Update Serial No doctype with VSM ID
#     if doc.update_stock:
#         update_serial_no_with_vsm(doc, vsm_doc_name)
#         update_customer_vsm(doc, vsm_doc_name)

#     # ✅ Update VSM Document with RTO, Insurance & Finance IDs
#     vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#     vsm_doc.is_delivered = 1 if doc.update_stock else 0
    
#     if rto_doc_name:
#         vsm_doc.rto_registration = 1
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.rto_office = doc.custom_rto_office
#         vsm_doc.registration_status = "Pending"

#     if insurance_doc_name:
#         vsm_doc.is_insurance = 1
#         vsm_doc.insurance_id = insurance_doc_name
#         vsm_doc.insurance_provider = doc.custom_insurance_provider
#         vsm_doc.insurance_status = "Applied"

#     if finance_doc_name:
#         vsm_doc.is_finance = 1
#         vsm_doc.finance_id = finance_doc_name
#         vsm_doc.finance_provider = doc.custom_finance_provider  # Use the original value
#         vsm_doc.loan_amount = doc.custom_finance_amount
#         vsm_doc.loan_status = "Pending"

#     # Debug the finance_provider value before saving
#     log_error(f"VSM finance_provider value: {vsm_doc.finance_provider}", "Finance Provider Debug")
    
#     vsm_doc.save()

# def update_items_with_chassis_numbers(doc):
#     """
#     Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers.
#     """
#     item_chassis_map = {}

#     # ✅ Group chassis numbers by item code
#     for vin in doc.custom_vin:
#         if vin.item not in item_chassis_map:
#             item_chassis_map[vin.item] = []
#         item_chassis_map[vin.item].append(vin.chassis_number)

#     # ✅ Update items table
#     for item in doc.items:
#         if item.item_code in item_chassis_map:
#             item.serial_no = "\n".join(item_chassis_map[item.item_code])  # Assign chassis numbers to serial_no field

# def update_serial_no_with_vsm(doc, vsm_doc_name):
#     """Update Serial No doctype with VSM ID when `update_stock` is checked."""
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
#             serial_no_doc.custom_vsm_id = vsm_doc_name
#             serial_no_doc.save()

# def update_customer_vsm(doc, vsm_doc_name):
#     """
#     Update the Customer doctype's `custom_vin` child table with VSM ID.
#     - If chassis number exists, update the `vsm_id`.
#     - If chassis number does not exist, append a new row.
#     """
    
#     # ✅ Ensure the document has a customer linked
#     if not doc.customer:
#         frappe.throw("Customer is required to update VSM ID in Customer doctype.")
    
#     # ✅ Fetch the Customer document
#     customer_doc = frappe.get_doc("Customer", doc.customer)

#     # ✅ Loop through all VINs in `custom_vin` from Sales Invoice
#     for vin in doc.get("custom_vin"):
#         # Check if chassis_number already exists in Customer's `custom_vin`
#         existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)
        
#         if existing_vin:
#             # ✅ Update the VSM ID for existing chassis number
#             existing_vin.vsm_id = vsm_doc_name
#         else:
#             # ✅ Append new VIN entry in Customer's `custom_vin` table
#             customer_doc.append("custom_vin", {
#                 "chassis_number": vin.chassis_number,
#                 "vsm_id": vsm_doc_name
#             })
    
#     # ✅ Save the Customer document
#     customer_doc.save(ignore_permissions=True)

# def create_vehicle_sales_master(doc):
#     """Creates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
    
#     # ✅ Ensure VIN table has at least one entry
#     if not doc.custom_vin:
#         frappe.throw("Chassis Number details are required in VIN table.")

#     vin = doc.custom_vin[0]  # Only one vehicle is allowed

#     vsm_doc = frappe.get_doc({
#         "doctype": "Vehicle Sales Master",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "chassis_number": vin.chassis_number,
#         "engine_number": vin.engine_number,
#         "vehicle_color": vin.vehicle_color,
#         "manufacturing_date": vin.manufacturing_date,
#         "is_delivered": 1 if doc.update_stock else 0
#     })
#     vsm_doc.insert()
#     frappe.db.commit()
#     return vsm_doc.name

# def create_rto_registration(doc, vsm_doc_name):
#     """Creates an RTO Registration document if applicable."""
#     rto_doc = frappe.get_doc({
#         "doctype": "RTO Registration",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "vsm_id": vsm_doc_name,
#         "rto_office": doc.custom_rto_office,
#         "registration_charge": doc.custom_registration_charge,
#         "registration_status": "Pending"
#     })
#     rto_doc.insert()
#     frappe.db.commit()
#     return rto_doc.name

# def create_vehicle_insurance(doc, vsm_doc_name):
#     """Creates a Vehicle Insurance document if applicable."""
#     insurance_doc = frappe.get_doc({
#         "doctype": "Vehicle Insurance",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "vsm_id": vsm_doc_name,
#         "insurance_provider": doc.custom_insurance_provider,
#         "policy_name": doc.custom_insurance_policy,
#         "insurance_amount": doc.custom_insurance_amount,
#         "insurance_status": "Applied"
#     })
#     insurance_doc.insert()
#     frappe.db.commit()
#     return insurance_doc.name

# def create_vehicle_finance(doc, vsm_doc_name):
#     """Creates a Vehicle Finance document if applicable."""
#     # Validate that custom_finance_provider exists as a Supplier
#     if doc.custom_finance_provider and not frappe.db.exists("Supplier", doc.custom_finance_provider):
#         frappe.throw(f"Supplier {doc.custom_finance_provider} not found. Please create it under Selling > Supplier.")

#     finance_doc = frappe.get_doc({
#         "doctype": "Vehicle Finance",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "vsm_id": vsm_doc_name,
#         "finance_provider": doc.custom_finance_provider,
#         "loan_amount": doc.custom_finance_amount,
#         "finance_status": "Pending"
#     })
#     finance_doc.insert()
#     frappe.db.commit()
#     return finance_doc.name