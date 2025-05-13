# import frappe

# def get_autowings_settings():
#     """Fetch company and abbr from Autowings Settings single doctype."""
#     settings = frappe.get_single("Autowings Settings")
#     return {
#         "company": settings.company or "Autowings",
#         "abbr": settings.abbr or ""
#     }

import frappe
import json
from frappe import _

def get_autowings_settings():
    """Fetch company and abbr from Autowings Settings single doctype."""
    settings = frappe.get_single("Autowings Settings")
    if not settings.company or not settings.abbr:
        frappe.throw(_("Company and abbreviation must be set in Autowings Settings."))
    return {
        "company": settings.company,
        "abbr": settings.abbr
    }

@frappe.whitelist()
def get_company_abbr():
    """Fetch company abbreviation from Autowings Settings for client-side use."""
    return get_autowings_settings()["abbr"]

@frappe.whitelist()
def create_account(account_name, company, parent_account, account_type):
    """Create an account if it does not exist."""
    if not frappe.db.exists("Account", {"account_name": account_name, "company": company}):
        account = frappe.new_doc("Account")
        account.account_name = account_name
        account.company = company
        account.parent_account = parent_account
        account.account_type = account_type
        account.root_type = "Asset" if account_type == "Receivable" else "Liability"
        account.report_type = "Balance Sheet"
        account.account_currency = "INR"
        account.is_group = 0
        account.insert(ignore_permissions=True)
        frappe.log_error(f"Created account: {account_name} for company: {company}", "Account Creation")
    return True

@frappe.whitelist()
def validate_accounts(accounts, company):
    """Validate if the provided accounts exist for the given company, creating them if necessary."""
    try:
        # Parse accounts if received as a JSON string
        if isinstance(accounts, str):
            accounts = json.loads(accounts)
        # Ensure accounts is a list
        if not isinstance(accounts, list):
            frappe.throw(_("Accounts must be provided as a list."))
        settings = get_autowings_settings()
        for account in accounts:
            # Create account if it doesn't exist
            if "Debtors" in account:
                create_account(account, company, f"Current Assets - {settings['abbr']}", "Receivable")
            else:
                create_account(account, company, f"Current Liabilities - {settings['abbr']}", "Payable")
            # Verify account existence
            if not frappe.db.exists("Account", {"account_name": account, "company": company}):
                frappe.throw(_("Account '{0}' does not exist for company '{1}'.").format(account, company))
        return True
    except json.JSONDecodeError:
        frappe.throw(_("Invalid JSON format for accounts."))
    except Exception as e:
        frappe.throw(_("Error validating accounts: {0}").format(str(e)))


# role based custom button visibility

import frappe
from frappe import _

# // Function to restrict custom buttons based on roles. _______(((use this in js file)))
# function restrict_custom_buttons_by_role(frm) {
#     // Store the original add_custom_button method
#     const original_add_custom_button = frm.add_custom_button;

#     // Override add_custom_button
#     frm.add_custom_button = function(label, callback, group) {
#         // Check role-based visibility
#         frappe.call({
#             method: 'autowings_app.custom_scripts.utils.can_show_button',
#             args: {
#                 link_doc: frm.doc.doctype,
#                 button_name: label
#             },
#             callback: function(r) {
#                 if (r.message) {
#                     // User is authorized; call the original method
#                     original_add_custom_button.call(frm, label, callback, group);
#                 }
#             },
#             error: function(err) {
#                 frappe.msgprint({
#                     title: __('Error'),
#                     message: __('Error checking button visibility for ') + label + ': ' + err.message,
#                     indicator: 'red'
#                 });
#             }
#         });
#     };
# }

@frappe.whitelist()
def can_show_button(link_doc, button_name):
    try:
        roles = frappe.get_all(
            'Adi Workflow Button Roles',
            filters={
                'link_doc': link_doc,
                'button_name': button_name
            },
            fields=['role']
        )
        if roles:
            user_roles = frappe.get_roles(frappe.session.user)
            return any(role.role in user_roles for role in roles)
        else:
            return 'Sales User' in frappe.get_roles(frappe.session.user)
    except Exception as e:
        frappe.log_error(f"Error checking button visibility for {link_doc}/{button_name}: {str(e)}")
        return False
    
    # -__________________________________------