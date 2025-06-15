# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class VehicleInsurance(Document):
# 	pass

# import frappe
# from frappe.model.document import Document

# class VehicleInsurance(Document):
#     pass

# @frappe.whitelist()
# def create_vehicle_insurance(sales_invoice):
#     sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

#     insurance_doc = frappe.get_doc({
#         "doctype": "Vehicle Insurance",
#         "customer": sales_doc.customer,
#         "vehicle_sale": sales_doc.name,
#         "insurance_provider": sales_doc.insurance_provider,
#         "insurance_policy_number": sales_doc.insurance_policy_number,
#         "insurance_status": "Active"
#     })
    
#     insurance_doc.insert()
#     return insurance_doc.name

# already have -------------



# import frappe
# from frappe.model.document import Document

# class VehicleInsurance(Document):
#     pass

# @frappe.whitelist()
# def create_vehicle_insurance(sales_invoice, insurance_provider):
#     """
#     Create Vehicle Insurance from Sales Invoice
#     """
#     sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

#     insurance_doc = frappe.get_doc({
#         "doctype": "Vehicle Insurance",
#         "customer": sales_doc.customer,
#         "vehicle_sale": sales_doc.name,
#         "insurance_provider": insurance_provider,  # Provider selected as input
#         # "insurance_policy_number": sales_doc.insurance_policy_number,
#         "insurance_status": "Applied"
#     })
    
#     insurance_doc.insert()
    
#     frappe.msgprint(f"Vehicle Insurance {insurance_doc.name} Created Successfully")
#     return insurance_doc.name


import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, date_diff

class VehicleInsurance(Document):
    pass

@frappe.whitelist()
def create_vehicle_insurance_from_sales_invoice(sales_invoice, insurance_provider, insurance_amount, customer, vsm_id, chassis_number):
    """
    Creates a Vehicle Insurance document, associated Journal Entry, and updates Vehicle Sales Master.
    - Validates Sales Invoice, fetches customer, vsm_id, chassis_number, and posting_date from Sales Invoice.
    - Creates a Vehicle Insurance document with provided insurance_provider, insurance_amount, and default statuses.
    - Creates a draft Journal Entry with Sales Invoice's posting date.
    - Updates Vehicle Sales Master and Sales Invoice with insurance details.
    - Logs activity in insurance_activity child table using RTO Activity Log.
    - Returns the name of the created Vehicle Insurance document.
    """
    try:
        # Validate inputs
        if not sales_invoice:
            frappe.throw(_("Please select a valid Sales Invoice."))
        if not insurance_provider:
            frappe.throw(_("Please select an Insurance Provider."))
        if not insurance_amount or float(insurance_amount) <= 0:
            frappe.throw(_("Please enter a valid Insurance Amount greater than 0."))
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

        # Check if Vehicle Insurance already exists
        insurance_doc_name = frappe.db.get_value("Vehicle Insurance", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
        if insurance_doc_name:
            frappe.throw(_("Vehicle Insurance {0} already exists for Sales Invoice {1}.").format(insurance_doc_name, sales_invoice))

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

        # Validate insurance_provider
        if not frappe.db.exists("Supplier", {"name": insurance_provider, "supplier_group": "Insurance"}):
            frappe.throw(_("Insurance Provider {0} must be a Supplier in the 'Insurance' group.").format(insurance_provider))

        # Get company and abbreviation
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        # Validate accounts
        accounts_to_validate = [f"{insurance_provider} Payable", "Debtors"]
        accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
            accounts=accounts_to_validate, company=company
        )
        if not accounts_valid:
            frappe.throw(_("One or more accounts ({0} Payable, Debtors) do not exist for company {1}.").format(insurance_provider, company))

        # Validate posting date
        journal_posting_date = sales_doc.posting_date
        if date_diff(journal_posting_date, getdate()) > 0:
            frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(journal_posting_date))

        # Create Vehicle Insurance document
        insurance_doc = frappe.get_doc({
            "doctype": "Vehicle Insurance",
            "customer": customer,
            "customer_name": sales_doc.customer_name,
            "sales_invoice": sales_invoice,
            "vsm_id": vsm_id,
            "insurance_provider": insurance_provider,
            "insurance_amount": float(insurance_amount),
            "chassis_number": chassis_number,
            "insurance_status": "Pending",
            "journal_status": "Draft",
            "payment_status": "Due",
            "status": "Due Update"
        })
        insurance_doc.insert(ignore_permissions=True)
        insurance_doc_name = insurance_doc.name

        # Create draft Journal Entry
        je_insurance = frappe.new_doc("Journal Entry")
        je_insurance.voucher_type = "Journal Entry"
        je_insurance.company = company
        je_insurance.posting_date = journal_posting_date
        je_insurance.title = f"Ins - {customer} - {insurance_provider}"
        je_insurance.remark = f"Insurance charge of ₹{insurance_amount} for Sales Invoice {sales_invoice} paid to {insurance_provider}."
        je_insurance.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": customer,
            "debit_in_account_currency": float(insurance_amount),
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}",
            "against_account": insurance_provider
        })
        je_insurance.append("accounts", {
            "account": f"{insurance_provider} Payable - {company_abbr}",
            "party_type": "Supplier",
            "party": insurance_provider,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": float(insurance_amount),
            "cost_center": f"Main - {company_abbr}",
            "against_account": customer
        })
        je_insurance.insert(ignore_permissions=True)
        je_insurance_name = je_insurance.name

        # Update journal_entry_id in Vehicle Insurance
        insurance_doc.journal_entry_id = je_insurance_name
        insurance_doc.save(ignore_permissions=True)

        # Update Vehicle Sales Master
        vsm_doc.is_insured = 1
        vsm_doc.insurance_id = insurance_doc_name
        vsm_doc.insurance_provider = insurance_provider
        vsm_doc.insurance_amount = float(insurance_amount)
        vsm_doc.insurance_status = "Pending"
        vsm_doc.save(ignore_permissions=True)

        # Update Sales Invoice
        sales_doc.db_set("custom_insurance_provider", insurance_provider, update_modified=False)
        sales_doc.db_set("custom_insurance_amount", float(insurance_amount), update_modified=False)

        # Log activity in insurance_activity child table using RTO Activity Log
        activity_log = {
            "doctype": "RTO Activity Log",
            "activity": "Vehicle Insurance Created",
            "status": "Created",
            "user": frappe.session.user,
            "update_on": now_datetime(),
            "remarks": f"Vehicle Insurance created for Sales Invoice {sales_invoice} with insurance amount ₹{insurance_amount}.",
            "parent": insurance_doc_name,
            "parentfield": "insurance_activity",
            "parenttype": "Vehicle Insurance"
        }
        frappe.get_doc(activity_log).insert(ignore_permissions=True)

        frappe.db.commit()
        return insurance_doc_name

    except Exception as e:
        frappe.db.rollback()
        error_message = str(e)
        frappe.log_error(f"Failed to create Vehicle Insurance for Sales Invoice {sales_invoice}: {error_message}")
        if "insurance_doc_name" in locals():
            try:
                activity_log = {
                    "doctype": "RTO Activity Log",
                    "activity": "Vehicle Insurance Creation Failed",
                    "status": "Failed",
                    "user": frappe.session.user,
                    "update_on": now_datetime(),
                    "remarks": f"Failed to create Vehicle Insurance: {error_message}",
                    "parent": insurance_doc_name,
                    "parentfield": "insurance_activity",
                    "parenttype": "Vehicle Insurance"
                }
                frappe.get_doc(activity_log).insert(ignore_permissions=True)
                frappe.db.commit()
            except Exception as log_error:
                frappe.log_error(f"Failed to log activity for Vehicle Insurance {insurance_doc_name}: {str(log_error)}")
        frappe.throw(_("Failed to create Vehicle Insurance: {0}").format(error_message))