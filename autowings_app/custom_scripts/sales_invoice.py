# import frappe

# def before_submit(doc, method):
#     """
#     Before Submit:
#     - Validate chassis numbers for serialized items
#     - Create VSM and RTO Registration
#     - Ensure only one vehicle item (excluding service items) for RTO Registration
#     """

#     if doc.update_stock:
#         for item in doc.get("items"):
#             has_serial_no = frappe.db.get_value("Item", item.item_code, "has_serial_no")

#             if has_serial_no:
#                 chassis_list = [
#                     vin.chassis_number for vin in doc.get("custom_vehicle_details") 
#                     if vin.item == item.item_code and vin.chassis_number
#                 ]

#                 if len(chassis_list) < int(item.qty):
#                     frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")

#                 item.serial_no = "\n".join(chassis_list)

#         doc.custom_vehicle_details = [
#             vin for vin in doc.get("custom_vehicle_details") 
#             if frappe.db.get_value("Item", vin.item, "has_serial_no")
#         ]

#     # **🔹 Ignore service items like RTO Charges when checking vehicle count**
#     vehicle_items = [item for item in doc.items if item.custom_is_vehicle and item.item_group != "Services"]

#     if doc.custom_rto_registration:
#         if len(vehicle_items) != 1 or vehicle_items[0].qty != 1:
#             vehicle_item_names = ", ".join([f"{item.item_code} ({item.item_name})" for item in vehicle_items])
#             frappe.throw(
#                 f"This invoice contains multiple vehicle items:\n"
#                 f"{vehicle_item_names}.\n"
#                 "Please ensure that only one vehicle is selected and it has 'Is Vehicle' checked.\n"
#                 "Remove extra vehicles or create a separate invoice for RTO Registration."
#             )


#         rto_doc_name = create_rto_registration(doc, vehicle_items[0])

#     if doc.custom_is_finance:
#         add_service_item(doc, "Finance")
#     if doc.custom_insurance:
#         add_service_item(doc, "Insurance")

#     vsm_doc_names = create_vehicle_sales_master(doc)

#     for vsm_doc_name in vsm_doc_names:
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.save()

#     if rto_doc_name:
#         rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#         rto_doc.vsm_id = ", ".join(vsm_doc_names)
#         rto_doc.save()


# @frappe.whitelist()
# def create_rto_registration(doc, vehicle_item):
#     """Creates RTO Registration and returns the document name."""

#     existing_rto = frappe.get_all("RTO Registration", filters={"sales_invoice": doc.name}, fields=["name"])
#     if existing_rto:
#         return existing_rto[0]["name"]

#     rto_office = doc.custom_rto_office or ""
#     registration_charge = next((i.rate for i in doc.items if i.item_group == "Services"), 0)

#     rto_doc = frappe.get_doc({
#         "doctype": "RTO Registration",
#         "customer": doc.customer,
#         "sales_invoice": doc.name,
#         "rto_office": rto_office,
#         "registration_charge": registration_charge,
#         "registration_status": "Pending"
#     })
#     rto_doc.insert()
#     frappe.db.commit()
#     return rto_doc.name

# @frappe.whitelist()
# def add_service_item(doc, service_type):
#     """Adds Finance or Insurance service items to Sales Invoice."""

#     service_item_code = f"SERVICE-{service_type}"
#     existing_item = next((i for i in doc.items if i.item_code == service_item_code), None)

#     if not existing_item:
#         item_details = frappe.get_value("Item", {"item_code": service_item_code}, ["item_name", "standard_rate", "income_account"], as_dict=True)
#         if not item_details:
#             frappe.throw(f"Service Item '{service_type}' not found in the system.")

#         doc.append("items", {
#             "item_code": service_item_code,
#             "item_name": item_details["item_name"],
#             "rate": item_details["standard_rate"],
#             "amount": item_details["standard_rate"],
#             "qty": 1,
#             "uom": "Nos",
#             "income_account": item_details.get("income_account", "Sales - AD"),
#             "cost_center": doc.cost_center
#         })

# @frappe.whitelist()
# def create_vehicle_sales_master(doc):
#     """Creates Vehicle Sales Master (VSM) for eligible vehicle items."""

#     vsm_doc_names = []
#     existing_vsm_items = frappe.get_all(
#         "Vehicle Sales Master",
#         filters={"sales_invoice": doc.name},
#         fields=["item"]
#     )

#     existing_items = {vsm["item"] for vsm in existing_vsm_items}

#     for item in doc.items:
#         if not item.custom_is_vehicle:
#             continue  

#         if item.item_code in existing_items:
#             continue  

#         vehicle_details = [
#             vin for vin in doc.custom_vehicle_details 
#             if vin.item == item.item_code and vin.chassis_number
#         ]

#         if doc.update_stock and len(vehicle_details) < int(item.qty):
#             frappe.throw(f"Not enough chassis numbers in Sales Invoice for item {item.item_code}.")

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

# ------------------------2

# import frappe

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
#                     vin.chassis_number for vin in doc.get("custom_vehicle_details") 
#                     if vin.item == item.item_code and vin.chassis_number
#                 ]
#                 if len(chassis_list) < int(item.qty):
#                     frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")
#                 item.serial_no = "\n".join(chassis_list)

#         doc.custom_vehicle_details = [
#             vin for vin in doc.get("custom_vehicle_details") 
#             if frappe.db.get_value("Item", vin.item, "has_serial_no")
#         ]

#     # Get all vehicle items
#     vehicle_items = [item for item in doc.items if item.custom_is_vehicle]

#     if len(vehicle_items) != 1:
#         frappe.throw(
#             "Only one vehicle item is allowed in a Sales Invoice for RTO Registration, Insurance, and Finance. "
#             "If you need to sell multiple vehicles, do not check these options and create separate documents."
#         )

#     # **1️⃣ Create RTO Registration before VSM**
#     rto_doc_name = None
#     if doc.custom_rto_registration:
#         rto_doc_name = create_rto_registration(doc, vehicle_items[0])

#     # **2️⃣ Create Vehicle Sales Master (VSM)**
#     vsm_doc_names = create_vehicle_sales_master(doc)

#     # **3️⃣ Update RTO Registration with VSM ID**
#     if rto_doc_name:
#         rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#         rto_doc.vsm_id = ", ".join(vsm_doc_names)  # ✅ Set VSM ID
#         rto_doc.save()

#     # **4️⃣ Create Vehicle Insurance**
#     insurance_doc_name = None
#     if doc.custom_insurance:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_names)

#     # **5️⃣ Create Vehicle Finance**
#     finance_doc_name = None
#     if doc.custom_is_finance:
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_names)

#     # **6️⃣ Link all created docs to VSM**
#     for vsm_doc_name in vsm_doc_names:
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         if rto_doc_name:
#             vsm_doc.rto_registration_id = rto_doc_name
#         if insurance_doc_name:
#             vsm_doc.insurance_id = insurance_doc_name
#         if finance_doc_name:
#             vsm_doc.finance_id = finance_doc_name
#         vsm_doc.save()

import frappe

def before_submit(doc, method):
    """
    Before Submit:
    - Validate chassis numbers for serialized items
    - Ensure only one vehicle item (custom_is_vehicle = 1)
    - Create Vehicle Sales Master (VSM)
    - Create RTO Registration if applicable
    - Create Vehicle Insurance if applicable
    - Create Vehicle Finance if applicable
    """

    if doc.update_stock:
        for item in doc.get("items"):
            has_serial_no = frappe.db.get_value("Item", item.item_code, "has_serial_no")
            if has_serial_no:
                chassis_list = [
                    vin.chassis_number for vin in doc.get("custom_vin") 
                    if vin.item == item.item_code and vin.chassis_number
                ]
                if len(chassis_list) < int(item.qty):
                    frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")
                item.serial_no = "\n".join(chassis_list)

        doc.custom_vin = [
            vin for vin in doc.get("custom_vin") 
            if frappe.db.get_value("Item", vin.item, "has_serial_no")
        ]

    # 🔹 **Check if at least one vehicle item exists**
    vehicle_items = [item for item in doc.items if item.custom_is_vehicle]

    if not vehicle_items:
        # ✅ **No vehicle present → Skip RTO, Insurance, Finance & Allow Sales Invoice**
        return  

    # 🚫 **Restrict multiple vehicle sales in a single Sales Invoice**
    if len(vehicle_items) > 1:
        frappe.throw(
            "Only one vehicle item is allowed in a Sales Invoice for RTO Registration, Insurance, and Finance. "
            "If you need to sell multiple vehicles, do not check these options and create separate documents."
        )

    # ✅ **Proceed with document creation since a vehicle item exists**
    rto_doc_name = None
    if doc.custom_rto_registration:
        rto_doc_name = create_rto_registration(doc, vehicle_items[0])

    vsm_doc_names = create_vehicle_sales_master(doc)

    if rto_doc_name:
        rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
        rto_doc.vsm_id = ", ".join(vsm_doc_names)  # ✅ Link VSM ID
        rto_doc.save()

    insurance_doc_name = None
    if doc.custom_insurance:
        insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_names)

    finance_doc_name = None
    if doc.custom_is_finance:
        finance_doc_name = create_vehicle_finance(doc, vsm_doc_names)

    for vsm_doc_name in vsm_doc_names:
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
        if rto_doc_name:
            vsm_doc.rto_registration_id = rto_doc_name
        if insurance_doc_name:
            vsm_doc.insurance_id = insurance_doc_name
        if finance_doc_name:
            vsm_doc.finance_id = finance_doc_name
        vsm_doc.save()


@frappe.whitelist()
def create_vehicle_sales_master(doc):
    """Creates Vehicle Sales Master (VSM) for the vehicle item in the Sales Invoice."""
    vsm_doc_names = []

    existing_vsm_items = frappe.get_all("Vehicle Sales Master", filters={"sales_invoice": doc.name}, fields=["item"])
    existing_items = {vsm["item"] for vsm in existing_vsm_items}

    for item in doc.items:
        if not item.custom_is_vehicle or item.item_code in existing_items:
            continue  

        vehicle_details = [
            vin for vin in doc.custom_vin 
            if vin.item == item.item_code and vin.chassis_number
        ]

        if doc.update_stock and len(vehicle_details) < int(item.qty):
            frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")

        for index in range(int(item.qty)):
            vsm_doc = frappe.get_doc({
                "doctype": "Vehicle Sales Master",
                "customer": doc.customer,
                "item": item.item_code,
                "sales_invoice": doc.name,
                "rto_registration": doc.custom_rto_registration,
                "is_finance": doc.custom_is_finance,
                "is_insurance": doc.custom_insurance,
                "is_delivered": 1 if doc.update_stock else 0
            })

            if doc.update_stock and index < len(vehicle_details):
                vin_data = vehicle_details[index]
                vsm_doc.chassis_number = vin_data.chassis_number
                vsm_doc.engine_number = vin_data.engine_number
                vsm_doc.vehicle_color = vin_data.vehicle_color
                vsm_doc.manufacturing_date = vin_data.manufacturing_date

            vsm_doc.insert()
            frappe.db.commit()
            vsm_doc_names.append(vsm_doc.name)

    return vsm_doc_names

@frappe.whitelist()
def create_rto_registration(doc, vehicle_item):
    """Creates RTO Registration document."""
    existing_rto = frappe.get_all("RTO Registration", filters={"sales_invoice": doc.name}, fields=["name"])
    if existing_rto:
        return existing_rto[0]["name"]

    rto_doc = frappe.get_doc({
        "doctype": "RTO Registration",
        "customer": doc.customer,
        "sales_invoice": doc.name,
        "rto_office": doc.custom_rto_office or "",
        "registration_charge": next((i.rate for i in doc.items if i.item_code == doc.custom_rto_charge_item), 0),
        "registration_status": "Pending"
    })
    rto_doc.insert()
    frappe.db.commit()
    return rto_doc.name

@frappe.whitelist()
def create_vehicle_insurance(doc, vsm_doc_names):
    """Creates a Vehicle Insurance document if applicable."""
    if not doc.custom_insurance or not doc.custom_insurance_provider or not doc.custom_insurance_policy:
        return None

    existing_insurance = frappe.get_all("Vehicle Insurance", filters={"vsm_id": ["in", vsm_doc_names]}, fields=["name"])
    if existing_insurance:
        return existing_insurance[0]["name"]

    insurance_doc = frappe.get_doc({
        "doctype": "Vehicle Insurance",
        "customer": doc.customer,
        "vsm_id": ", ".join(vsm_doc_names),
        "insurance_provider": doc.custom_insurance_provider,
        "policy_name": doc.custom_insurance_policy,
        "insurance_amount": next((i.rate for i in doc.items if i.item_code == doc.custom_insurance_charge_item), 0),
        "insurance_status": "Applied"
    })
    insurance_doc.insert()
    frappe.db.commit()
    return insurance_doc.name


@frappe.whitelist()
def create_vehicle_finance(doc, vsm_doc_names):
    """Creates a Vehicle Finance document if applicable."""
    if not doc.custom_is_finance or not doc.custom_finance_provider or not doc.custom_loan_amount:
        return None

    existing_finance = frappe.get_all("Vehicle Finance", filters={"vsm_id": ["in", vsm_doc_names]}, fields=["name"])
    if existing_finance:
        return existing_finance[0]["name"]

    finance_doc = frappe.get_doc({
        "doctype": "Vehicle Finance",
        "customer": doc.customer,
        "vsm_id": ", ".join(vsm_doc_names),
        "finance_provider": doc.custom_finance_provider,
        "loan_amount": doc.custom_loan_amount,
        "finance_status": "Pending"
    })
    finance_doc.insert()
    frappe.db.commit()
    return finance_doc.name

# import frappe

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
#                     vin.chassis_number for vin in doc.get("custom_vehicle_details") 
#                     if vin.item == item.item_code and vin.chassis_number
#                 ]
#                 if len(chassis_list) < int(item.qty):
#                     frappe.throw(f"Not enough chassis numbers for item {item.item_code}.")
#                 item.serial_no = "\n".join(chassis_list)

#         doc.custom_vehicle_details = [
#             vin for vin in doc.get("custom_vehicle_details") 
#             if frappe.db.get_value("Item", vin.item, "has_serial_no")
#         ]

#     # Get all vehicle items
#     vehicle_items = [item for item in doc.items if item.custom_is_vehicle]

#     if len(vehicle_items) != 1:
#         frappe.throw(
#             "Only one vehicle item is allowed in a Sales Invoice for RTO Registration, Insurance, and Finance. "
#             "If you need to sell multiple vehicles, do not check these options and create separate documents."
#         )

#     # Create VSM
#     vsm_doc_names = create_vehicle_sales_master(doc)

#     # Create RTO Registration
#     rto_doc_name = None
#     if doc.custom_rto_registration:
#         rto_doc_name = create_rto_registration(doc, vehicle_items[0])

#     # Create Vehicle Insurance
#     insurance_doc_name = None
#     if doc.custom_insurance:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_names)

#     # Create Vehicle Finance
#     finance_doc_name = None
#     if doc.custom_is_finance:
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_names)

#     # Link created documents to VSM
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
#             vin for vin in doc.custom_vehicle_details 
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
