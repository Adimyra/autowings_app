# import frappe
# from frappe import _

# def on_customer_save(doc, method):
#     """Create an Account when a Customer with customer_group 'Financer' is saved."""
#     valid_groups = ["Financer"]
#     if doc.customer_group in valid_groups:
#         # Check if an account already exists to avoid duplicates
#         account_exists = frappe.db.exists("Account", {"account_name": f"{doc.customer_name} Receivable", "company": "Autowings"})
#         if not account_exists:
#             # Create new account
#             account = frappe.new_doc("Account")
#             account.account_name = f"{doc.customer_name} Receivable"
#             account.company = "Autowings"
#             account.parent_account = "Current Assets - A"
#             account.account_type = "Receivable"
#             account.root_type = "Asset"
#             account.report_type = "Balance Sheet"
#             account.account_currency = "INR"
#             account.is_group = 0
#             account.disabled = 0
#             account.freeze_account = "No"
#             account.insert(ignore_permissions=True)
#             frappe.msgprint(_("Account '{0}' created for Customer '{1}'.").format(account.name, doc.customer_name))

# def on_customer_trash(doc, method):
#     """Delete the associated Account when a Customer with customer_group 'Financer' is deleted."""
#     valid_groups = ["Financer"]
#     if doc.customer_group in valid_groups:
#         # Find the account with the matching name
#         account_name = f"{doc.customer_name} Receivable"
#         account = frappe.db.get_value("Account", {"account_name": account_name, "company": "Autowings"}, "name")
#         if account:
#             frappe.delete_doc("Account", account, ignore_permissions=True)
#             frappe.msgprint(_("Account '{0}' deleted for Customer '{1}'.").format(account_name, doc.customer_name))

import frappe
from frappe import _
from autowings_app.custom_scripts.utils import get_autowings_settings

def on_customer_save(doc, method):
    """Create an Account when a Customer with customer_group 'Financer' is saved and set default company."""
    # Set default company if not already set
    if not doc.get("company"):
        settings = get_autowings_settings()
        doc.company = settings["company"]
    
    valid_groups = ["Financer"]
    if doc.customer_group in valid_groups:
        # Get company and abbr from Autowings Settings
        settings = get_autowings_settings()
        company = settings["company"]
        company_abbr = settings["abbr"]
        
        # Check if an account already exists to avoid duplicates
        account_exists = frappe.db.exists("Account", {"account_name": f"{doc.customer_name} Receivable", "company": company})
        if not account_exists:
            # Create new account
            account = frappe.new_doc("Account")
            account.account_name = f"{doc.customer_name} Receivable"
            account.company = company
            account.parent_account = f"Current Assets - {company_abbr}"
            account.account_type = "Receivable"
            account.root_type = "Asset"
            account.report_type = "Balance Sheet"
            account.account_currency = "INR"
            account.is_group = 0
            account.disabled = 0
            account.freeze_account = "No"
            account.insert(ignore_permissions=True)
            frappe.msgprint(_("Account '{0}' created for Customer '{1}'.").format(account.name, doc.customer_name))

def on_customer_trash(doc, method):
    """Delete the associated Account when a Customer with customer_group 'Financer' is deleted."""
    valid_groups = ["Financer"]
    if doc.customer_group in valid_groups:
        # Get company from Autowings Settings
        settings = get_autowings_settings()
        company = settings["company"]
        
        # Find the account with the matching name
        account_name = f"{doc.customer_name} Receivable"
        account = frappe.db.get_value("Account", {"account_name": account_name, "company": company}, "name")
        if account:
            frappe.delete_doc("Account", account, ignore_permissions=True)
            frappe.msgprint(_("Account '{0}' deleted for Customer '{1}'.").format(account_name, doc.customer_name))