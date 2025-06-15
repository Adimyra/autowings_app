

# import frappe

# @frappe.whitelist()
# def get_unified_account_query(doctype, txt, searchfield, start, page_len, filters):
#     result = []

#     # ✅ Customers: Search by name OR customer_name
#     customers = frappe.db.sql("""
#         SELECT name, customer_name, customer_group
#         FROM `tabCustomer`
#         WHERE name LIKE %(txt)s OR customer_name LIKE %(txt)s
#         LIMIT 5
#     """, {"txt": f"%{txt}%"}, as_dict=True)

#     for c in customers:
#         label = f"Customer: {c.customer_name or c.name}"
#         description = f"ID: {c.name} | Group: {c.customer_group}"
#         result.append([label, None, description])

#     # ✅ Suppliers
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters={"name": ["like", f"%{txt}%"]},
#         fields=["name", "supplier_group"],
#         limit=5
#     )
#     for s in suppliers:
#         result.append([f"Supplier: {s.name}", None, f"Group: {s.supplier_group}"])

#     # ✅ Accounts
#     accounts = frappe.get_all(
#         "Account",
#         filters={"name": ["like", f"%{txt}%"]},
#         fields=["name", "parent_account"],
#         limit=5
#     )
#     for a in accounts:
#         result.append([f"Account: {a.name}", None, f"Parent: {a.parent_account or 'None'}"])

#     return result or []


import frappe

@frappe.whitelist()
def get_unified_account_query(doctype, txt, searchfield, start, page_len, filters):
    result = []

    # ✅ Customers: Search by name OR customer_name
    customers = frappe.db.sql("""
        SELECT name, customer_name, customer_group
        FROM `tabCustomer`
        WHERE name LIKE %(txt)s OR customer_name LIKE %(txt)s
        LIMIT 5
    """, {"txt": f"%{txt}%"}, as_dict=True)

    for c in customers:
        label = f"Customer: {c.customer_name or c.name}"
        description = f"ID: {c.name} | Group: {c.customer_group}"
        result.append([label, None, description])

    # ✅ Suppliers
    suppliers = frappe.get_all(
        "Supplier",
        filters={"name": ["like", f"%{txt}%"]},
        fields=["name", "supplier_group"],
        limit=5
    )
    for s in suppliers:
        result.append([f"Supplier: {s.name}", None, f"Group: {s.supplier_group}"])

    # ✅ Accounts
    accounts = frappe.get_all(
        "Account",
        filters={"name": ["like", f"%{txt}%"]},
        fields=["name", "parent_account"],
        limit=5
    )
    for a in accounts:
        result.append([f"Account: {a.name}", None, f"Parent: {a.parent_account or 'None'}"])

    # ✅ Serial No: Search by customer_name, customer_id, mobile_number, chassis_number, rto_registration_id
    serial_nos = frappe.db.sql("""
        SELECT name, custom_customer_id, custom_customer_name, custom_chassis_number, 
               custom_registration_number, custom_mobile_number
        FROM `tabSerial No`
        WHERE custom_customer_id LIKE %(txt)s 
           OR custom_customer_name LIKE %(txt)s 
           OR custom_chassis_number LIKE %(txt)s 
           OR custom_registration_number LIKE %(txt)s 
           OR custom_mobile_number LIKE %(txt)s
        LIMIT 5
    """, {"txt": f"%{txt}%"}, as_dict=True)

    for sn in serial_nos:
        label = f"Serial No: {sn.name}"
        description = (f"Customer: {sn.custom_customer_name or 'N/A'} | "
                      f"Customer ID: {sn.custom_customer_id or 'N/A'} | "
                      f"Chassis: {sn.custom_chassis_number or 'N/A'} | "
                      f"Registration No: {sn.custom_registration_number or 'N/A'} | "
                      f"Mobile: {sn.custom_mobile_number or 'N/A'}")
        result.append([label, None, description])

    return result or []