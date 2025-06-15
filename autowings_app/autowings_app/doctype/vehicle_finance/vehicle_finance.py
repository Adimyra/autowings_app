# import frappe
# from frappe import _
# from frappe.model.document import Document
# from frappe.utils import getdate, now_datetime, date_diff

# class VehicleFinance(Document):
#     pass

# @frappe.whitelist()
# def create_vehicle_finance_from_sales_invoice(sales_invoice, loan_type, finance_provider, loan_amount, chassis_number=None):
#     """
#     Creates a Vehicle Finance document, associated Journal Entry, and updates Vehicle Sales Master.
#     - Validates the Sales Invoice, Vehicle Sales Master, and Finance Provider.
#     - Fetches chassis_number from Sales Invoice's custom_vin if not provided.
#     - Creates a Vehicle Finance document with provided finance_provider, loan_amount, and default statuses.
#     - Uses customer, customer_name, and custom_vsm_id from Sales Invoice.
#     - Creates a draft Journal Entry with posting date matching Sales Invoice.
#     - Updates Vehicle Sales Master and Sales Invoice with finance details.
#     - Logs activity in finance_activity child table using RTO Activity Log.
#     - Returns the name of the created Vehicle Finance document.
#     """
#     try:
#         # Validate inputs
#         if not sales_invoice:
#             frappe.throw(_("Please select a valid Sales Invoice."))
#         if not finance_provider:
#             frappe.throw(_("Please select a Finance Provider."))
#         if not loan_amount or float(loan_amount) <= 0:
#             frappe.throw(_("Please enter a valid Loan Amount greater than 0."))
#         if not loan_type:
#             frappe.throw(_("Please select a Loan Type."))

#         # Validate Sales Invoice
#         sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
#         if sales_doc.docstatus != 1:
#             frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

#         # Validate Vehicle Sales Master
#         vsm_doc_name = sales_doc.get("custom_vsm_id")
#         if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
#             frappe.throw(_("No Vehicle Sales Master found for Sales Invoice {0}.").format(sales_invoice))
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         if vsm_doc.docstatus == 2:
#             frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

#         # Validate loan_type
#         if loan_type != "New Vehicle":
#             frappe.throw(_("Only 'New Vehicle' loan type is supported for this action."))

#         # Validate finance_provider (must be a Customer in 'Financer' group)
#         if not frappe.db.exists("Customer", {"name": finance_provider, "customer_group": "Financer"}):
#             frappe.throw(_("Finance Provider {0} must be a Customer in the 'Financer' group.").format(finance_provider))

#         # Check if Vehicle Finance already exists
#         finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
#         if finance_doc_name:
#             frappe.throw(_("Vehicle Finance {0} already exists for Sales Invoice {1}.").format(finance_doc_name, sales_invoice))

#         # Get chassis_number from custom_vin if not provided
#         if not chassis_number:
#             vin_entries = sales_doc.get("custom_vin", [])
#             if not vin_entries:
#                 frappe.throw(_("No VIN details found in Sales Invoice {0}. Please provide a Chassis Number.").format(sales_invoice))
#             elif len(vin_entries) > 1:
#                 frappe.throw(_("Multiple VIN entries found in Sales Invoice {0}. Please specify a Chassis Number.").format(sales_invoice))
#             chassis_number = vin_entries[0].chassis_number
#         elif not frappe.db.exists("VIN Sales Child", {"parent": sales_invoice, "chassis_number": chassis_number}):
#             frappe.throw(_("Chassis Number {0} not found in Sales Invoice {1}'s VIN details.").format(chassis_number, sales_invoice))

#         # Get company and abbreviation
#         company = sales_doc.company
#         company_abbr = frappe.db.get_value("Company", company, "abbr")

#         # Validate accounts
#         accounts_to_validate = [f"{finance_provider} Receivable", "Debtors"]
#         accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
#             accounts=accounts_to_validate, company=company
#         )
#         if not accounts_valid:
#             frappe.throw(_("One or more accounts ({0} Receivable, Debtors) do not exist for company {1}.").format(finance_provider, company))

#         # Validate posting date
#         posting_date = sales_doc.posting_date
#         if date_diff(posting_date, getdate()) > 0:
#             frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(posting_date))

#         # Create Vehicle Finance document
#         finance_doc = frappe.get_doc({
#             "doctype": "Vehicle Finance",
#             "customer": sales_doc.customer,
#             "customer_name": sales_doc.customer_name,
#             "sales_invoice": sales_doc.name,
#             "vsm_id": vsm_doc_name,
#             "finance_provider": finance_provider,
#             "loan_amount": float(loan_amount),
#             "chassis_number": chassis_number,
#             "loan_type": loan_type,
#             "loan_status": "Pending",
#             "journal_status": "Draft",
#             "payment_status": "Not Received",
#             "status": "Due Update"
#         })
#         finance_doc.insert(ignore_permissions=True)
#         finance_doc_name = finance_doc.name

#         # Create draft Journal Entry
#         je_finance = frappe.new_doc("Journal Entry")
#         je_finance.voucher_type = "Journal Entry"
#         je_finance.company = company
#         je_finance.posting_date = posting_date  # Use Sales Invoice's posting date
#         je_finance.title = f"FIN - {sales_doc.customer} - {finance_provider}"
#         je_finance.remark = f"Received ₹{loan_amount} from {finance_provider} for {sales_doc.customer}'s vehicle purchase under Sales Invoice {sales_doc.name}."
#         je_finance.append("accounts", {
#             "account": f"{finance_provider} Receivable - {company_abbr}",
#             "party_type": "Customer",
#             "party": finance_provider,
#             "debit_in_account_currency": float(loan_amount),
#             "credit_in_account_currency": 0,
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_finance.append("accounts", {
#             "account": f"Debtors - {company_abbr}",
#             "party_type": "Customer",
#             "party": sales_doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": float(loan_amount),
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_finance.insert(ignore_permissions=True)
#         je_finance_name = je_finance.name

#         # Update journal_entry_id in Vehicle Finance
#         finance_doc.journal_entry_id = je_finance_name
#         finance_doc.save(ignore_permissions=True)

#         # Update Vehicle Sales Master
#         vsm_doc.is_finance = 1
#         vsm_doc.finance_id = finance_doc_name
#         vsm_doc.finance_provider = finance_provider
#         vsm_doc.loan_amount = float(loan_amount)
#         vsm_doc.loan_status = "Pending"
#         vsm_doc.save(ignore_permissions=True)

#         # Update Sales Invoice with finance details
#         sales_doc.db_set("custom_finance_provider", finance_provider, update_modified=False)
#         sales_doc.db_set("custom_finance_amount", float(loan_amount), update_modified=False)

#         # Log activity in finance_activity child table using RTO Activity Log
#         activity_log = {
#             "doctype": "RTO Activity Log",
#             "activity": "Vehicle Finance Created",
#             "status": "Created",
#             "user": frappe.session.user,
#             "update_on": now_datetime(),
#             "remarks": f"Vehicle Finance created for Sales Invoice {sales_invoice} with loan amount ₹{loan_amount}.",
#             "parent": finance_doc_name,
#             "parentfield": "finance_activity",
#             "parenttype": "Vehicle Finance"
#         }
#         frappe.get_doc(activity_log).insert(ignore_permissions=True)

#         # Log failure activity in case of later exception
#         frappe.db.commit()
#         return finance_doc_name

#     except Exception as e:
#         frappe.db.rollback()
#         error_message = str(e)
#         frappe.log_error(f"Failed to create Vehicle Finance for Sales Invoice {sales_invoice}: {error_message}")
#         if "finance_doc_name" in locals():
#             try:
#                 activity_log = {
#                     "doctype": "RTO Activity Log",
#                     "activity": "Vehicle Finance Creation Failed",
#                     "status": "Failed",
#                     "user": frappe.session.user,
#                     "update_on": now_datetime(),
#                     "remarks": f"Failed to create Vehicle Finance: {error_message}",
#                     "parent": finance_doc_name,
#                     "parentfield": "finance_activity",
#                     "parenttype": "Vehicle Finance"
#                 }
#                 frappe.get_doc(activity_log).insert(ignore_permissions=True)
#                 frappe.db.commit()
#             except Exception as log_error:
#                 frappe.log_error(f"Failed to log activity for Vehicle Finance {finance_doc_name}: {str(log_error)}")
#         frappe.throw(_("Failed to create Vehicle Finance: {0}").format(error_message))

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, date_diff

class VehicleFinance(Document):
    pass

@frappe.whitelist()
def create_vehicle_finance_from_sales_invoice(sales_invoice, loan_type, finance_provider, loan_amount, chassis_number, customer, vsm_id):
    """
    Creates a Vehicle Finance document, associated Journal Entry, and updates Vehicle Sales Master for New Vehicle.
    - Validates Sales Invoice, fetches chassis_number, customer, vsm_id, and posting_date from Sales Invoice.
    - Creates a Vehicle Finance document with provided finance_provider, loan_amount, and default statuses.
    - Creates a draft Journal Entry with Sales Invoice's posting date.
    - Updates Vehicle Sales Master and Sales Invoice with finance details.
    - Logs activity in finance_activity child table using RTO Activity Log.
    - Returns the name of the created Vehicle Finance document.
    """
    try:
        # Validate inputs
        if not sales_invoice:
            frappe.throw(_("Please select a valid Sales Invoice."))
        if not finance_provider:
            frappe.throw(_("Please select a Finance Provider."))
        if not loan_amount or float(loan_amount) <= 0:
            frappe.throw(_("Please enter a valid Loan Amount greater than 0."))
        if not loan_type or loan_type != "New Vehicle":
            frappe.throw(_("Loan Type must be New Vehicle."))
        if not chassis_number:
            frappe.throw(_("Chassis Number is required."))
        if not customer:
            frappe.throw(_("Customer is required."))
        if not vsm_id:
            frappe.throw(_("Vehicle Sales Master ID is required."))

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

        # Check if Vehicle Finance already exists
        finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
        if finance_doc_name:
            frappe.throw(_("Vehicle Finance {0} already exists for Sales Invoice {1}.").format(finance_doc_name, sales_invoice))

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

        # Get company and abbreviation
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        # Validate finance_provider
        if not frappe.db.exists("Customer", {"name": finance_provider, "customer_group": "Financer"}):
            frappe.throw(_("Finance Provider {0} must be a Customer in the 'Financer' group.").format(finance_provider))

        # Validate accounts
        accounts_to_validate = [f"{finance_provider} Receivable", "Debtors"]
        accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
            accounts=accounts_to_validate, company=company
        )
        if not accounts_valid:
            frappe.throw(_("One or more accounts ({0} Receivable, Debtors) do not exist for company {1}.").format(finance_provider, company))

        # Validate posting date
        journal_posting_date = sales_doc.posting_date
        if date_diff(journal_posting_date, getdate()) > 0:
            frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(journal_posting_date))

        # Create Vehicle Finance document
        finance_doc = frappe.get_doc({
            "doctype": "Vehicle Finance",
            "customer": customer,
            "customer_name": sales_doc.customer_name,
            "sales_invoice": sales_invoice,
            "vsm_id": vsm_id,
            "finance_provider": finance_provider,
            "loan_amount": float(loan_amount),
            "chassis_number": chassis_number,
            "loan_type": loan_type,
            "loan_status": "Pending",
            "journal_status": "Draft",
            "payment_status": "Not Received",
            "status": "Due Update"
        })
        finance_doc.insert(ignore_permissions=True)
        finance_doc_name = finance_doc.name

        # Create draft Journal Entry
        je_finance = frappe.new_doc("Journal Entry")
        je_finance.voucher_type = "Journal Entry"
        je_finance.company = company
        je_finance.posting_date = journal_posting_date
        je_finance.title = f"FIN - {customer} - {finance_provider}"
        je_finance.remark = f"Received ₹{loan_amount} from {finance_provider} for {customer}'s vehicle finance for {chassis_number} under Sales Invoice {sales_invoice}."
        je_finance.append("accounts", {
            "account": f"{finance_provider} Receivable - {company_abbr}",
            "party_type": "Customer",
            "party": finance_provider,
            "debit_in_account_currency": float(loan_amount),
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}"
        })
        je_finance.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": customer,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": float(loan_amount),
            "cost_center": f"Main - {company_abbr}"
        })
        je_finance.insert(ignore_permissions=True)
        je_finance_name = je_finance.name

        # Update journal_entry_id in Vehicle Finance
        finance_doc.journal_entry_id = je_finance_name
        finance_doc.save(ignore_permissions=True)

        # Update Vehicle Sales Master
        vsm_doc.is_finance = 1
        vsm_doc.finance_id = finance_doc_name
        vsm_doc.finance_provider = finance_provider
        vsm_doc.loan_amount = float(loan_amount)
        vsm_doc.loan_status = "Pending"
        vsm_doc.save(ignore_permissions=True)

        # Update Sales Invoice
        sales_doc.db_set("custom_finance_provider", finance_provider, update_modified=False)
        sales_doc.db_set("custom_finance_amount", float(loan_amount), update_modified=False)

        # Log activity in finance_activity child table using RTO Activity Log
        activity_log = {
            "doctype": "RTO Activity Log",
            "activity": "Vehicle Finance Created",
            "status": "Created",
            "user": frappe.session.user,
            "update_on": now_datetime(),
            "remarks": f"Vehicle Finance created for Sales Invoice {sales_invoice} with loan amount ₹{loan_amount}.",
            "parent": finance_doc_name,
            "parentfield": "finance_activity",
            "parenttype": "Vehicle Finance"
        }
        frappe.get_doc(activity_log).insert(ignore_permissions=True)

        frappe.db.commit()
        return finance_doc_name

    except Exception as e:
        frappe.db.rollback()
        error_message = str(e)
        frappe.log_error(f"Failed to create Vehicle Finance for Sales Invoice {sales_invoice}: {error_message}")
        if "finance_doc_name" in locals():
            try:
                activity_log = {
                    "doctype": "RTO Activity Log",
                    "activity": "Vehicle Finance Creation Failed",
                    "status": "Failed",
                    "user": null,
                    "update_on": now_datetime(),
                    "remarks": f"Failed to create Vehicle Finance: {error_message}",
                    "parent": finance_doc_name,
                    "parentfield": "finance_activity",
                    "parenttype": "Vehicle Finance"
                }
                frappe.get_doc(activity_log).insert(ignore_permissions=True)
                frappe.db.commit()
            except Exception as log_error:
                frappe.log_error(f"Failed to log activity for Vehicle Finance {finance_doc_name}: {str(log_error)}")
        frappe.throw(_("Failed to create Vehicle Finance: {0}").format(error_message))