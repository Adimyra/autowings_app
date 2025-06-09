# import frappe

# @frappe.whitelist()
# def search_accounts(query, company):
#     frappe.log_error(f"search_accounts called with query={query}, company={company}")  # Debug log
#     # Fetch company abbreviation (though not used in search, kept for consistency)
#     company_abbr = frappe.get_value("Company", company, "abbr") or "A"
    
#     # Prepare the search term
#     search_term = f"%{query}%" if query else "%"
    
#     # Fetch matching Customers, Suppliers, and Accounts
#     customers = frappe.get_all(
#         "Customer",
#         filters=[["name", "like", search_term]],
#         fields=["name as value", "concat(name, ' (Customer)') as description", "'Customer' as doctype"]
#     )
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters=[["name", "like", search_term]],
#         fields=["name as value", "concat(name, ' (Supplier)') as description", "'Supplier' as doctype"]
#     )
#     accounts = frappe.get_all(
#         "Account",
#         filters=[["name", "like", search_term], ["company", "=", company]],
#         fields=["name as value", "concat(name, ' (Account)') as description", "'Account' as doctype"]
#     )
    
#     # Combine and return the results
#     results = customers + suppliers + accounts
#     frappe.log_error(f"Returning {len(results)} results: {results}")  # Debug log
#     return results

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

    return result or []

# import frappe

# @frappe.whitelist()
# def get_unified_account_query(doctype, txt, searchfield, start, page_len, filters):
#     result = []

#     # Customers with Customer Group (shown in description)
#     customers = frappe.get_all(
#         "Customer",
#         filters={"name": ["like", f"%{txt}%"]},
        
#         fields=["name", "customer_group"],
#         limit=5
#     )
#     for c in customers:
#         result.append([f"Customer: {c.name}", None, f"Group: {c.customer_group}"])

#     # Suppliers with Supplier Type
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters={"name": ["like", f"%{txt}%"]},
#         fields=["name", "supplier_group"],
#         limit=5
#     )
#     for s in suppliers:
#         result.append([f"Supplier: {s.name}", None, f"Group: {s.supplier_group}"])

#     # Accounts with Parent Account
#     accounts = frappe.get_all(
#         "Account",
#         filters={"name": ["like", f"%{txt}%"]},
#         fields=["name", "parent_account"],
#         limit=5
#     )
#     for a in accounts:
#         result.append([f"Account: {a.name}", None, f"Parent: {a.parent_account}"])

#     return result



# import frappe

# @frappe.whitelist()
# def get_unified_account_query(doctype, txt, searchfield, start, page_len, filters):
#     customers = frappe.get_all("Customer", filters={"name": ["like", f"%{txt}%"]}, pluck="name", limit=5)
#     suppliers = frappe.get_all("Supplier", filters={"name": ["like", f"%{txt}%"]}, pluck="name", limit=5)
#     accounts = frappe.get_all("Account", filters={"name": ["like", f"%{txt}%"]}, pluck="name", limit=5)

#     result = []
#     result += [[f"Customer: {name}"] for name in customers]
#     result += [[f"Supplier: {name}"] for name in suppliers]
#     result += [[f"Account: {name}"] for name in accounts]

#     return result or []
