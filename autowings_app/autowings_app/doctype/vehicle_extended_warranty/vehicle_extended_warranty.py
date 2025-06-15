# # Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# # For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class VehicleExtendedWarranty(Document):
# 	pass

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, date_diff

class VehicleExtendedWarranty(Document):
    pass

@frappe.whitelist()
def create_vehicle_extended_warranty_from_sales_invoice(sales_invoice, extended_warranty_provider, extended_warranty_amount, customer, vsm_id, chassis_number):
    """
    Creates a Vehicle Extended Warranty document, associated Journal Entry, and updates Vehicle Sales Master.
    - Validates Sales Invoice, fetches customer, vsm_id, chassis_number, and posting_date from Sales Invoice.
    - Creates a Vehicle Extended Warranty document with provided extended_warranty_provider, extended_warranty_amount, and default statuses.
    - Creates a draft Journal Entry with Sales Invoice's posting date.
    - Updates Vehicle Sales Master and Sales Invoice with extended warranty details.
    - Logs activity in extended_warranty_activity child table using RTO Activity Log.
    - Returns the name of the created Vehicle Extended Warranty document.
    """
    try:
        # Validate inputs
        if not sales_invoice:
            frappe.throw(_("Please select a valid Sales Invoice."))
        if not extended_warranty_provider:
            frappe.throw(_("Please select an Extended Warranty Provider."))
        if not extended_warranty_amount or float(extended_warranty_amount) <= 0:
            frappe.throw(_("Please enter a valid Extended Warranty Amount greater than 0."))
        if not customer:
            frappe.throw(_("Customer is required."))
        if not vsm_id:
            frappe.throw(_("Vehicle Sales Master ID is required."))
        if not chassis_number:
            frappe.throw(_("Chassis Number is required."))

        # Validate Sales Invoice
        sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
        if sales_doc.docstatus != 1:
            frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

        # Validate Vehicle Sales Master
        vsm_doc_name = sales_doc.get("custom_vsm_id")
        if vsm_doc_name != vsm_id or not frappe.db.exists("Vehicle Sales Master", vsm_id):
            frappe.throw(_("Vehicle Sales Master {0} does not match Sales Invoice {1}.").format(vsm_id, sales_invoice))
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_id)
        if vsm_doc.docstatus == 2:
            frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_id))

        # Check if Vehicle Extended Warranty already exists
        warranty_doc_name = frappe.db.get_value("Vehicle Extended Warranty", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
        if warranty_doc_name:
            frappe.throw(_("Vehicle Extended Warranty {0} already exists for Sales Invoice {1}.").format(warranty_doc_name, sales_invoice))

        # Validate chassis_number from custom_vin
        vin_entries = sales_doc.get("custom_vin", [])
        if not vin_entries:
            frappe.throw(_("No VIN details found in Sales Invoice {0}.").format(sales_invoice))
        elif len(vin_entries) > 1:
            frappe.throw(_("Multiple VIN entries found in Sales Invoice {0}. Please specify a Chassis Number.").format(sales_invoice))
        if vin_entries[0].chassis_number != chassis_number:
            frappe.throw(_("Chassis Number {0} does not match Sales Invoice {1}'s VIN details.").format(chassis_number, sales_invoice))

        # Validate customer
        if sales_doc.customer != customer:
            frappe.throw(_("Customer {0} does not match Sales Invoice {1}'s customer.").format(customer, sales_invoice))

        # Validate extended_warranty_provider
        if not frappe.db.exists("Supplier", {"name": extended_warranty_provider, "supplier_group": "Extended Warranty Group"}):
            frappe.throw(_("Extended Warranty Provider {0} must be a Supplier in the 'Extended Warranty Group' group.").format(extended_warranty_provider))

        # Get company and abbreviation
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        # Validate accounts
        accounts_to_validate = [f"{extended_warranty_provider} Payable", "Debtors"]
        accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
            accounts=accounts_to_validate, company=company
        )
        if not accounts_valid:
            frappe.throw(_("One or more accounts ({0} Payable, Debtors) do not exist for company {1}.").format(extended_warranty_provider, company))

        # Validate posting date
        journal_posting_date = sales_doc.posting_date
        if date_diff(journal_posting_date, getdate()) > 0:
            frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(journal_posting_date))

        # Create Vehicle Extended Warranty document
        warranty_doc = frappe.get_doc({
            "doctype": "Vehicle Extended Warranty",
            "customer": customer,
            "customer_name": sales_doc.customer_name,
            "sales_invoice": sales_invoice,
            "vsm_id": vsm_id,
            "extended_warranty_provider": extended_warranty_provider,
            "extended_warranty_amount": float(extended_warranty_amount),
            "chassis_number": chassis_number,
            "warranty_status": "Pending",
            "journal_status": "Draft",
            "payment_status": "Due",
            "status": "Due Update"
        })
        warranty_doc.insert(ignore_permissions=True)
        warranty_doc_name = warranty_doc.name

        # Create draft Journal Entry
        je_warranty = frappe.new_doc("Journal Entry")
        je_warranty.voucher_type = "Journal Entry"
        je_warranty.company = company
        je_warranty.posting_date = journal_posting_date
        je_warranty.title = f"EW - {customer} - {extended_warranty_provider}"
        je_warranty.remark = f"Extended Warranty charge of ₹{extended_warranty_amount} for Sales Invoice {sales_invoice} paid to {extended_warranty_provider}."
        je_warranty.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": customer,
            "debit_in_account_currency": float(extended_warranty_amount),
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}",
            "against_account": extended_warranty_provider
        })
        je_warranty.append("accounts", {
            "account": f"{extended_warranty_provider} Payable - {company_abbr}",
            "party_type": "Supplier",
            "party": extended_warranty_provider,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": float(extended_warranty_amount),
            "cost_center": f"Main - {company_abbr}",
            "against_account": customer
        })
        je_warranty.insert(ignore_permissions=True)
        je_warranty_name = je_warranty.name

        # Update journal_entry_id in Vehicle Extended Warranty
        warranty_doc.journal_entry_id = je_warranty_name
        warranty_doc.save(ignore_permissions=True)

        # Update Vehicle Sales Master
        vsm_doc.is_extended_warranty = 1
        vsm_doc.extended_warranty_id = warranty_doc_name
        vsm_doc.extended_warranty_provider = extended_warranty_provider
        vsm_doc.extended_warranty_amount = float(extended_warranty_amount)
        vsm_doc.warranty_status = "Pending"
        vsm_doc.save(ignore_permissions=True)

        # Update Sales Invoice
        sales_doc.db_set("custom_extended_warranty_provider", extended_warranty_provider, update_modified=False)
        sales_doc.db_set("custom_extended_warranty_amount", float(extended_warranty_amount), update_modified=False)

        # Log activity in extended_warranty_activity child table using RTO Activity Log
        activity_log = {
            "doctype": "RTO Activity Log",
            "activity": "Vehicle Extended Warranty Created",
            "status": "Created",
            "user": frappe.session.user,
            "update_on": now_datetime(),
            "remarks": f"Vehicle Extended Warranty created for Sales Invoice {sales_invoice} with extended warranty amount ₹{extended_warranty_amount}.",
            "parent": warranty_doc_name,
            "parentfield": "extended_warranty_activity",
            "parenttype": "Vehicle Extended Warranty"
        }
        frappe.get_doc(activity_log).insert(ignore_permissions=True)

        frappe.db.commit()
        return warranty_doc_name

    except Exception as e:
        frappe.db.rollback()
        error_message = str(e)
        frappe.log_error(f"Failed to create Vehicle Extended Warranty for Sales Invoice {sales_invoice}: {error_message}")
        if "warranty_doc_name" in locals():
            try:
                activity_log = {
                    "doctype": "RTO Activity Log",
                    "activity": "Vehicle Extended Warranty Creation Failed",
                    "status": "Failed",
                    "user": frappe.session.user,
                    "update_on": now_datetime(),
                    "remarks": f"Failed to create Vehicle Extended Warranty: {error_message}",
                    "parent": warranty_doc_name,
                    "parentfield": "extended_warranty_activity",
                    "parenttype": "Vehicle Extended Warranty"
                }
                frappe.get_doc(activity_log).insert(ignore_permissions=True)
                frappe.db.commit()
            except Exception as log_error:
                frappe.log_error(f"Failed to log activity for Vehicle Extended Warranty {warranty_doc_name}: {str(log_error)}")
        frappe.throw(_("Failed to create Vehicle Extended Warranty: {0}").format(error_message))