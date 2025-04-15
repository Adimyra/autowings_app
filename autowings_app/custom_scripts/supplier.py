# def set_insurance_provider(doc, method):
#     # Only proceed if supplier_group is "Insurance"
#     if doc.supplier_group == "Insurance":
#         # Check if insurance_policy child table exists and has rows
#         if doc.get("insurance_policy"):
#             for policy in doc.insurance_policy:
#                 # Set insurance_provider to supplier_name if not already set
#                 if not policy.insurance_provider:
#                     policy.insurance_provider = doc.name

import frappe
from frappe import _

def on_supplier_save(doc, method):
    """Create an Account when a Supplier with supplier_group = 'Misc Group' is saved."""
    if doc.supplier_group == "Misc Group":
        # Check if an account already exists to avoid duplicates
        account_exists = frappe.db.exists("Account", {"account_name": f"{doc.supplier_name} Payable", "company": "Autowings"})
        if not account_exists:
            # Create new account
            account = frappe.new_doc("Account")
            account.account_name = f"{doc.supplier_name} Payable"
            account.company = "Autowings"
            account.parent_account = "Current Liabilities - A"
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
    """Delete the associated Account when a Supplier with supplier_group = 'Misc Group' is deleted."""
    if doc.supplier_group == "Misc Group":
        # Find the account with the matching name
        account_name = f"{doc.supplier_name} Payable"
        account = frappe.db.get_value("Account", {"account_name": account_name, "company": "Autowings"}, "name")
        if account:
            frappe.delete_doc("Account", account, ignore_permissions=True)
            frappe.msgprint(_("Account '{0}' deleted for Supplier '{1}'.").format(account_name, doc.supplier_name))