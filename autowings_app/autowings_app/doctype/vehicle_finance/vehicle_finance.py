# # Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# # For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class VehicleFinance(Document):
# 	pass

# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate


class VehicleFinance(Document):
    pass


@frappe.whitelist()
def create_vehicle_finance_from_sales_invoice(sales_invoice, loan_type, finance_provider, loan_amount):
    """
    Creates a Vehicle Finance document, associated Journal Entry, and updates Vehicle Sales Master.
    - Validates the Sales Invoice and linked Vehicle Sales Master.
    - Creates a Vehicle Finance document with provided finance_provider, loan_amount, and default statuses.
    - Uses customer and custom_vsm_id from Sales Invoice.
    - Creates a draft Journal Entry for the finance transaction.
    - Updates Vehicle Sales Master with is_finance checkbox and finance details.
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
        
        # Validate Sales Invoice
        sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
        if sales_doc.docstatus != 1:
            frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

        # Validate Vehicle Sales Master
        vsm_doc_name = sales_doc.get("custom_vsm_id")
        if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
            frappe.throw(_("No Vehicle Sales Master found for Sales Invoice {0}.").format(sales_invoice))
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
        if vsm_doc.docstatus == 2:
            frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

        # Validate loan_type
        if loan_type != "New Vehicle":
            frappe.throw(_("Only 'New Vehicle' loan type is supported for this action."))

        # Validate finance_provider (must be a Customer in 'Financer' group)
        if not frappe.db.exists("Customer", {"name": finance_provider, "customer_group": "Financer"}):
            frappe.throw(_("Finance Provider {0} must be a Customer in the 'Financer' group.").format(finance_provider))

        # Check if Vehicle Finance already exists
        finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
        if finance_doc_name:
            frappe.throw(_("Vehicle Finance {0} already exists for Sales Invoice {1}.").format(finance_doc_name, sales_invoice))

        # Get company and abbreviation
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        # Create Vehicle Finance document
        finance_doc = frappe.get_doc({
            "doctype": "Vehicle Finance",
            "customer": sales_doc.customer,
            "sales_invoice": sales_doc.name,
            "vsm_id": vsm_doc_name,
            "finance_provider": finance_provider,
            "loan_amount": float(loan_amount),
            "loan_status": "Pending",
            "journal_status": "Draft",
            "payment_status": "Not Received",
            "status": "Due Update",
            "loan_type": loan_type
        })
        finance_doc.insert(ignore_permissions=True)  # Bypass read-only restrictions
        finance_doc_name = finance_doc.name

        # Create draft Journal Entry
        je_finance = frappe.new_doc("Journal Entry")
        je_finance.voucher_type = "Journal Entry"
        je_finance.company = company
        je_finance.posting_date = getdate()
        je_finance.title = f"FIN - {sales_doc.customer} - {finance_provider}"
        je_finance.remark = f"Received ₹{finance_doc.loan_amount} from {finance_provider} for {sales_doc.customer}’s vehicle purchase under Sales Invoice {sales_doc.name}."
        je_finance.append("accounts", {
            "account": f"{finance_provider} Receivable - {company_abbr}",
            "party_type": "Customer",
            "party": finance_provider,
            "debit_in_account_currency": finance_doc.loan_amount,
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}",
            "against_account": sales_doc.customer
        })
        je_finance.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": sales_doc.customer,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": finance_doc.loan_amount,
            "cost_center": f"Main - {company_abbr}",
            "against_account": finance_provider
        })
        je_finance.insert(ignore_permissions=True)  # Bypass permissions
        je_finance_name = je_finance.name

        # Update journal_entry_id in Vehicle Finance
        finance_doc.journal_entry_id = je_finance_name
        finance_doc.save(ignore_permissions=True)

        # Update Vehicle Sales Master
        vsm_doc.is_finance = 1
        vsm_doc.finance_id = finance_doc_name
        vsm_doc.finance_provider = finance_provider
        vsm_doc.loan_amount = finance_doc.loan_amount
        vsm_doc.loan_status = finance_doc.loan_status
        vsm_doc.save(ignore_permissions=True)

        # Update Sales Invoice with finance details
        sales_doc.db_set("custom_finance_provider", finance_provider, update_modified=False)
        sales_doc.db_set("custom_finance_amount", finance_doc.loan_amount, update_modified=False)

        frappe.db.commit()

        frappe.msgprint(
            _("Vehicle Finance {0} and Journal Entry {1} created successfully. Vehicle Sales Master {2} and Sales Invoice {3} updated.")
            .format(finance_doc_name, je_finance_name, vsm_doc_name, sales_invoice)
        )

        return finance_doc_name

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error creating Vehicle Finance for Sales Invoice {sales_invoice}: {str(e)}")
        frappe.throw(_("Failed to create Vehicle Finance: {0}").format(str(e)))