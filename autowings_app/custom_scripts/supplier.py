
# import frappe
# from frappe import _

# def on_supplier_save(doc, method):
#     """Create an Account when a Supplier with supplier_group in specified groups is saved."""
#     valid_groups = ["Misc Group", "RSA Group", "Extended Warranty Group", "Insurance", "RTO"]
#     if doc.supplier_group in valid_groups:
#         # Check if an account already exists to avoid duplicates
#         account_exists = frappe.db.exists("Account", {"account_name": f"{doc.supplier_name} Payable", "company": "Autowings"})
#         if not account_exists:
#             # Create new account
#             account = frappe.new_doc("Account")
#             account.account_name = f"{doc.supplier_name} Payable"
#             account.company = "Autowings"
#             account.parent_account = "Current Liabilities - A"
#             account.account_type = "Payable"
#             account.root_type = "Liability"
#             account.report_type = "Balance Sheet"
#             account.account_currency = "INR"
#             account.is_group = 0
#             account.disabled = 0
#             account.freeze_account = "No"
#             account.insert(ignore_permissions=True)
#             frappe.msgprint(_("Account '{0}' created for Supplier '{1}'.").format(account.name, doc.supplier_name))

# def on_supplier_trash(doc, method):
#     """Delete the associated Account when a Supplier with supplier_group in specified groups is deleted."""
#     valid_groups = ["Misc Group", "RSA Group", "Extended Warranty Group", "Insurance", "RTO"]
#     if doc.supplier_group in valid_groups:
#         # Find the account with the matching name
#         account_name = f"{doc.supplier_name} Payable"
#         account = frappe.db.get_value("Account", {"account_name": account_name, "company": "Autowings"}, "name")
#         if account:
#             frappe.delete_doc("Account", account, ignore_permissions=True)
#             frappe.msgprint(_("Account '{0}' deleted for Supplier '{1}'.").format(account_name, doc.supplier_name))

import frappe
from frappe import _
from autowings_app.custom_scripts.utils import get_autowings_settings

def on_supplier_save(doc, method):
    """Create an Account when a Supplier with supplier_group in specified groups is saved."""
    valid_groups = ["Misc Group", "RSA Group", "Extended Warranty Group", "Insurance", "RTO"]
    if doc.supplier_group in valid_groups:
        # Get company and abbr from Autowings Settings
        settings = get_autowings_settings()
        company = settings["company"]
        company_abbr = settings["abbr"]
        
        # Check if an account already exists to avoid duplicates
        account_exists = frappe.db.exists("Account", {"account_name": f"{doc.supplier_name} Payable", "company": company})
        if not account_exists:
            # Create new account
            account = frappe.new_doc("Account")
            account.account_name = f"{doc.supplier_name} Payable"
            account.company = company
            account.parent_account = f"Current Liabilities - {company_abbr}"
            account.account_type = "Payable"
            account.root_type = "Liability"
            account.report_type = "Balance Sheet"
            account.account_currency = "INR"
            account.is_group = 0
            account.disabled = 0
            account.freeze_account = "No"
            account.insert(ignore_permissions=True)
            frappe.msgprint(_("Account '{0}' created for Supplier '{1}'.").format(account.name, doc.supplier_name))

def on_supplier_trash(doc, method):
    """Delete the associated Account when a Supplier with supplier_group in specified groups is deleted."""
    valid_groups = ["Misc Group", "RSA Group", "Extended Warranty Group", "Insurance", "RTO"]
    if doc.supplier_group in valid_groups:
        # Get company from Autowings Settings
        settings = get_autowings_settings()
        company = settings["company"]
        
        # Find the account with the matching name
        account_name = f"{doc.supplier_name} Payable"
        account = frappe.db.get_value("Account", {"account_name": account_name, "company": company}, "name")
        if account:
            frappe.delete_doc("Account", account, ignore_permissions=True)
            frappe.msgprint(_("Account '{0}' deleted for Supplier '{1}'.").format(account_name, doc.supplier_name))