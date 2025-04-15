

# from frappe import db, throw, msgprint, enqueue
# from frappe.utils import getdate
# import frappe

# def on_submit_sales_invoice(doc, method):
#     # Verify document creation based on custom fields
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc = db.exists("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not rto_doc:
#             msgprint(f"Error: RTO Registration not created for Sales Invoice {doc.name} despite custom_rto_office being set.")
#             throw("RTO Registration document creation failed.")
#         else:
#             rto_doc = frappe.get_doc("RTO Registration", rto_doc)
#             if rto_doc.registration_charge != doc.custom_registration_charge:
#                 msgprint(f"Warning: RTO Registration charge ({rto_doc.registration_charge}) differs from Sales Invoice estimate ({doc.custom_registration_charge}).")

#         # Create initial RTO Journal Entry with remark
#         je_rto = frappe.new_doc("Journal Entry")
#         je_rto.voucher_type = "Journal Entry"
#         je_rto.company = doc.company
#         je_rto.posting_date = getdate()
#         je_rto.title = f"RTO Charge - {doc.customer}"
#         je_rto.remark = f"Initial RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
#         je_rto.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_registration_charge,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_rto_office
#         })
#         je_rto.append("accounts", {
#             "account": "RTO Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_rto_office,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_registration_charge,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_rto.save()
#         je_rto.submit()
#         msgprint(f"RTO Journal Entry {je_rto.name} created.")

#     if doc.custom_insurance_provider and doc.custom_insurance_amount:
#         insurance_doc = db.exists("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not insurance_doc:
#             msgprint(f"Error: Vehicle Insurance not created for Sales Invoice {doc.name} despite custom_insurance_provider being set.")
#             throw("Vehicle Insurance document creation failed.")
#         else:
#             insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc)
#             if insurance_doc.insurance_amount != doc.custom_insurance_amount:
#                 msgprint(f"Warning: Insurance amount ({insurance_doc.insurance_amount}) differs from Sales Invoice estimate ({doc.custom_insurance_amount}).")

#         # Create initial Insurance Journal Entry with remark
#         je_insurance = frappe.new_doc("Journal Entry")
#         je_insurance.voucher_type = "Journal Entry"
#         je_insurance.company = doc.company
#         je_insurance.posting_date = getdate()
#         je_insurance.title = f"Insurance Charge - {doc.customer}"
#         je_insurance.remark = f"Initial Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
#         je_insurance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_insurance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_insurance_provider
#         })
#         je_insurance.append("accounts", {
#             "account": "Insurance Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_insurance_provider,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_insurance_amount,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_insurance.save()
#         je_insurance.submit()
#         msgprint(f"Insurance Journal Entry {je_insurance.name} created.")

#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         finance_doc = db.exists("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not finance_doc:
#             msgprint(f"Error: Vehicle Finance not created for Sales Invoice {doc.name} despite custom_finance_provider being set.")
#             throw("Vehicle Finance document creation failed.")
#         else:
#             finance_doc = frappe.get_doc("Vehicle Finance", finance_doc)
#             if finance_doc.loan_amount != doc.custom_finance_amount:
#                 msgprint(f"Warning: Finance amount ({finance_doc.loan_amount}) differs from Sales Invoice estimate ({doc.custom_finance_amount}).")

#         # Create initial Finance Journal Entry with remark
#         je_finance = frappe.new_doc("Journal Entry")
#         je_finance.voucher_type = "Journal Entry"
#         je_finance.company = doc.company
#         je_finance.posting_date = getdate()
#         je_finance.title = doc.custom_finance_provider
#         je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
#         je_finance.append("accounts", {
#             "account": "Finance Receivable - A",
#             "party_type": "Customer",
#             "party": doc.custom_finance_provider,
#             "debit_in_account_currency": doc.custom_finance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_finance_provider
#         })
#         je_finance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_finance_amount,
#             "cost_center": "Main - A",
#             "against_account": "Finance Receivable - A"
#         })
#         je_finance.save()
#         je_finance.submit()
#         msgprint(f"Finance Journal Entry {je_finance.name} created.")

# # Update hooks for non-submitable documents with difference tracking

# def before_save_rto_registration(doc, method):
#     if doc.docstatus == 0:  # Non-submitable document
#         sales_invoice = doc.sales_invoice
#         if sales_invoice:
#             si = db.get_value("Sales Invoice", sales_invoice, ["custom_registration_charge"], as_dict=True)
#             estimated = si.custom_registration_charge or 0
#             actual = doc.registration_charge or 0
#             diff = actual - estimated
#             if diff != 0:
#                 enqueue("autowings_app.custom_scripts.events.trigger_confirmation", doc=doc, doctype_name="RTO Registration", diff=diff, estimated=estimated, actual=actual, create_je_func=create_rto_adjustment_je.__name__)

# def before_save_vehicle_insurance(doc, method):
#     if doc.docstatus == 0:  # Non-submitable document
#         sales_invoice = doc.sales_invoice
#         if sales_invoice:
#             si = db.get_value("Sales Invoice", sales_invoice, ["custom_insurance_amount"], as_dict=True)
#             estimated = si.custom_insurance_amount or 0
#             actual = doc.insurance_amount or 0
#             diff = actual - estimated
#             if diff != 0:
#                 enqueue("autowings_app.custom_scripts.events.trigger_confirmation", doc=doc, doctype_name="Vehicle Insurance", diff=diff, estimated=estimated, actual=actual, create_je_func=create_insurance_adjustment_je.__name__)

# def before_save_vehicle_finance(doc, method):
#     if doc.docstatus == 0:  # Non-submitable document
#         sales_invoice = doc.sales_invoice
#         if sales_invoice:
#             si = db.get_value("Sales Invoice", sales_invoice, ["custom_finance_amount"], as_dict=True)
#             estimated = si.custom_finance_amount or 0
#             actual = doc.loan_amount or 0
#             diff = actual - estimated
#             if diff != 0:
#                 enqueue("autowings_app.custom_scripts.events.trigger_confirmation", doc=doc, doctype_name="Vehicle Finance", diff=diff, estimated=estimated, actual=actual, create_je_func=create_finance_adjustment_je.__name__)

# @frappe.whitelist()
# def trigger_confirmation(doc, doctype_name, diff, estimated, actual, create_je_func):
#     """Trigger a client-side confirmation dialog."""
#     message = f"""
#         The {doctype_name} amount has changed from ₹{estimated} to ₹{actual}.
#         This will create an adjustment Journal Entry for ₹{diff}.
#         Are you sure the new amount is correct? This action cannot be reverted.
#     """
#     frappe.call(
#         "frappe.client.show_message",
#         {
#             "message": message,
#             "title": "Confirm Adjustment",
#             "type": "alert",
#             "actions": [
#                 {
#                     "label": "Yes",
#                     "action": f"frappe.call({{ method: 'autowings_app.custom_scripts.events.process_confirmation', args: {{ docname: '{doc.name}', doctype: '{doc.doctype}', diff: {diff}, doctype_name: '{doctype_name}' }} }})"
#                 },
#                 {
#                     "label": "No",
#                     "action": f"frappe.call({{ method: 'autowings_app.custom_scripts.events.process_cancellation', args: {{ docname: '{doc.name}', doctype: '{doc.doctype}', estimated: {estimated} }} }})"
#                 }
#             ]
#         }
#     )

# @frappe.whitelist()
# def process_confirmation(docname, doctype, diff, doctype_name):
#     """Process the confirmation and create the adjustment Journal Entry."""
#     doc = frappe.get_doc(doctype, docname)
#     create_je_func = {
#         "RTO Registration": create_rto_adjustment_je,
#         "Vehicle Insurance": create_insurance_adjustment_je,
#         "Vehicle Finance": create_finance_adjustment_je
#     }.get(doctype_name)
#     if create_je_func:
#         create_je_func(doc, diff)
#     frappe.msgprint(f"Adjustment Journal Entry created for {doctype_name} with difference ₹{diff}.")
#     frappe.db.commit()

# @frappe.whitelist()
# def process_cancellation(docname, doctype, estimated):
#     """Process the cancellation and revert to the original amount."""
#     doc = frappe.get_doc(doctype, docname)
#     if doctype == "RTO Registration":
#         doc.registration_charge = estimated
#     elif doctype == "Vehicle Insurance":
#         doc.insurance_amount = estimated
#     elif doctype == "Vehicle Finance":
#         doc.loan_amount = estimated
#     doc.save()
#     frappe.msgprint(f"Adjustment for {doctype} cancelled. Reverted to original amount ₹{estimated}.")
#     frappe.db.commit()

# def create_rto_adjustment_je(doc, diff):
#     if diff > 0:
#         je = frappe.new_doc("Journal Entry")
#         je.voucher_type = "Journal Entry"
#         je.company = doc.company
#         je.posting_date = getdate()
#         je.title = f"RTO Adjustment - {doc.customer}"
#         je.remark = f"Adjusted RTO charge from ₹{doc.registration_charge - diff} to ₹{doc.registration_charge} (+₹{diff}) for Sales Invoice {doc.sales_invoice}."
#         je.append("accounts", {
#             "account": "RTO Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.rto_office,
#             "debit_in_account_currency": diff,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": diff,
#             "cost_center": "Main - A",
#             "against_account": "RTO Charges Payable - A"
#         })
#         je.save()
#         je.submit()

# def create_insurance_adjustment_je(doc, diff):
#     if diff > 0:
#         je = frappe.new_doc("Journal Entry")
#         je.voucher_type = "Journal Entry"
#         je.company = doc.company
#         je.posting_date = getdate()
#         je.title = f"Insurance Adjustment - {doc.customer}"
#         je.remark = f"Adjusted Insurance charge from ₹{doc.insurance_amount - diff} to ₹{doc.insurance_amount} (+₹{diff}) for Sales Invoice {doc.sales_invoice}."
#         je.append("accounts", {
#             "account": "Insurance Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.insurance_provider,
#             "debit_in_account_currency": diff,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": diff,
#             "cost_center": "Main - A",
#             "against_account": "Insurance Charges Payable - A"
#         })
#         je.save()
#         je.submit()

# def create_finance_adjustment_je(doc, diff):
#     if diff > 0:
#         je = frappe.new_doc("Journal Entry")
#         je.voucher_type = "Journal Entry"
#         je.company = doc.company
#         je.posting_date = getdate()
#         je.title = f"Finance Adjustment - {doc.customer}"
#         je.remark = f"Adjusted Finance amount from ₹{doc.loan_amount - diff} to ₹{doc.loan_amount} (+₹{diff}) for Sales Invoice {doc.sales_invoice}."
#         je.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": diff,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.finance_provider
#         })
#         je.append("accounts", {
#             "account": "Financer Advances - A",
#             "party_type": "Supplier",
#             "party": doc.finance_provider,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": diff,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je.save()
#         je.submit()

# def on_update_rto_registration(doc, method):
#     # Existing on_update logic remains unchanged
#     if doc.docstatus == 1:
#         sales_invoice = doc.sales_invoice
#         if not sales_invoice:
#             return
#         si = db.get_value("Sales Invoice", sales_invoice, ["custom_registration_charge"], as_dict=True)
#         estimated = si.custom_registration_charge or 0
#         actual = doc.registration_charge or 0
#         diff = actual - estimated
#         if diff != 0:
#             je = frappe.new_doc("Journal Entry")
#             je.voucher_type = "Journal Entry"
#             je.company = doc.company
#             je.posting_date = getdate()
#             je.title = f"RTO Adjustment - {doc.customer}"
#             je.remark = f"Adjusted RTO charge from ₹{estimated} to ₹{actual} (+₹{diff}) for Sales Invoice {sales_invoice}."
#             if diff > 0:
#                 je.append("accounts", {
#                     "account": "RTO Charges Payable - A",
#                     "party_type": "Supplier",
#                     "party": doc.rto_office,
#                     "debit_in_account_currency": diff,
#                     "credit_in_account_currency": 0,
#                     "cost_center": "Main - A",
#                     "against_account": "Debtors - A"
#                 })
#                 je.append("accounts", {
#                     "account": "Debtors - A",
#                     "party_type": "Customer",
#                     "party": doc.customer,
#                     "debit_in_account_currency": 0,
#                     "credit_in_account_currency": diff,
#                     "cost_center": "Main - A",
#                     "against_account": "RTO Charges Payable - A"
#                 })
#             je.save()
#             je.submit()
#             msgprint(f"RTO Adjustment Journal Entry {je.name} created.")

# def on_update_vehicle_insurance(doc, method):
#     # Existing on_update logic remains unchanged
#     if doc.docstatus == 1:
#         sales_invoice = doc.sales_invoice
#         if not sales_invoice:
#             return
#         si = db.get_value("Sales Invoice", sales_invoice, ["custom_insurance_amount"], as_dict=True)
#         estimated = si.custom_insurance_amount or 0
#         actual = doc.insurance_amount or 0
#         diff = actual - estimated
#         if diff != 0:
#             je = frappe.new_doc("Journal Entry")
#             je.voucher_type = "Journal Entry"
#             je.company = doc.company
#             je.posting_date = getdate()
#             je.title = f"Insurance Adjustment - {doc.customer}"
#             je.remark = f"Adjusted Insurance charge from ₹{estimated} to ₹{actual} (+₹{diff}) for Sales Invoice {sales_invoice}."
#             if diff > 0:
#                 je.append("accounts", {
#                     "account": "Insurance Charges Payable - A",
#                     "party_type": "Supplier",
#                     "party": doc.insurance_provider,
#                     "debit_in_account_currency": diff,
#                     "credit_in_account_currency": 0,
#                     "cost_center": "Main - A",
#                     "against_account": "Debtors - A"
#                 })
#                 je.append("accounts", {
#                     "account": "Debtors - A",
#                     "party_type": "Customer",
#                     "party": doc.customer,
#                     "debit_in_account_currency": 0,
#                     "credit_in_account_currency": diff,
#                     "cost_center": "Main - A",
#                     "against_account": "Insurance Charges Payable - A"
#                 })
#             je.save()
#             je.submit()
#             msgprint(f"Insurance Adjustment Journal Entry {je.name} created.")

# def on_update_vehicle_finance(doc, method):
#     # Existing on_update logic remains unchanged
#     if doc.docstatus == 1:
#         sales_invoice = doc.sales_invoice
#         if not sales_invoice:
#             return
#         si = db.get_value("Sales Invoice", sales_invoice, ["custom_finance_amount"], as_dict=True)
#         estimated = si.custom_finance_amount or 0
#         actual = doc.loan_amount or 0
#         diff = actual - estimated
#         if diff != 0:
#             je = frappe.new_doc("Journal Entry")
#             je.voucher_type = "Journal Entry"
#             je.company = doc.company
#             je.posting_date = getdate()
#             je.title = f"Finance Adjustment - {doc.customer}"
#             je.remark = f"Adjusted Finance amount from ₹{estimated} to ₹{actual} (+₹{diff}) for Sales Invoice {sales_invoice}."
#             if diff > 0:
#                 je.append("accounts", {
#                     "account": "Debtors - A",
#                     "party_type": "Customer",
#                     "party": doc.customer,
#                     "debit_in_account_currency": diff,
#                     "credit_in_account_currency": 0,
#                     "cost_center": "Main - A",
#                     "against_account": doc.finance_provider
#                 })
#                 je.append("accounts", {
#                     "account": "Financer Advances - A",
#                     "party_type": "Supplier",
#                     "party": doc.finance_provider,
#                     "debit_in_account_currency": 0,
#                     "credit_in_account_currency": diff,
#                     "cost_center": "Main - A",
#                     "against_account": "Debtors - A"
#                 })
#             je.save()
#             je.submit()
#             msgprint(f"Finance Adjustment Journal Entry {je.name} created.")
import frappe
from frappe import _
from frappe.utils import getdate

def on_submit_sales_invoice(doc, method):
    """Create draft Journal Entries for RTO, Insurance, Finance, and Miscellaneous charges on Sales Invoice submission."""
    # RTO Journal Entry
    if doc.custom_rto_office and doc.custom_registration_charge:
        rto_doc = frappe.db.exists("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
        if not rto_doc:
            frappe.msgprint(_("Error: RTO Registration not created for Sales Invoice {0} despite custom_rto_office being set.").format(doc.name))
            frappe.throw(_("RTO Registration document creation failed."))

        je_rto = frappe.new_doc("Journal Entry")
        je_rto.voucher_type = "Journal Entry"
        je_rto.company = doc.company
        je_rto.posting_date = getdate()
        je_rto.title = f"RTO Charge - {doc.customer}"
        je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
        je_rto.append("accounts", {
            "account": "Debtors - A",
            "party_type": "Customer",
            "party": doc.customer,
            "debit_in_account_currency": doc.custom_registration_charge,
            "credit_in_account_currency": 0,
            "cost_center": "Main - A",
            "against_account": doc.custom_rto_office
        })
        je_rto.append("accounts", {
            "account": f"{doc.custom_rto_office} Payable - A",
            "party_type": "Supplier",
            "party": doc.custom_rto_office,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": doc.custom_registration_charge,
            "cost_center": "Main - A",
            "against_account": "Debtors - A"
        })
        je_rto.save()
        frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

    # Insurance Journal Entry
    if doc.custom_insurance_provider and doc.custom_insurance_amount:
        insurance_doc = frappe.db.exists("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
        if not insurance_doc:
            frappe.msgprint(_("Error: Vehicle Insurance not created for Sales Invoice {0} despite custom_insurance_provider being set.").format(doc.name))
            frappe.throw(_("Vehicle Insurance document creation failed."))

        je_insurance = frappe.new_doc("Journal Entry")
        je_insurance.voucher_type = "Journal Entry"
        je_insurance.company = doc.company
        je_insurance.posting_date = getdate()
        je_insurance.title = f"Insurance Charge - {doc.customer}"
        je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
        je_insurance.append("accounts", {
            "account": "Debtors - A",
            "party_type": "Customer",
            "party": doc.customer,
            "debit_in_account_currency": doc.custom_insurance_amount,
            "credit_in_account_currency": 0,
            "cost_center": "Main - A",
            "against_account": doc.custom_insurance_provider
        })
        je_insurance.append("accounts", {
            "account": f"{doc.custom_insurance_provider} Payable - A",
            "party_type": "Supplier",
            "party": doc.custom_insurance_provider,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": doc.custom_insurance_amount,
            "cost_center": "Main - A",
            "against_account": "Debtors - A"
        })
        je_insurance.save()
        frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

    # Finance Journal Entry
    if doc.custom_finance_provider and doc.custom_finance_amount:
        finance_doc = frappe.db.exists("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
        if not finance_doc:
            frappe.msgprint(_("Error: Vehicle Finance not created for Sales Invoice {0} despite custom_finance_provider being set.").format(doc.name))
            frappe.throw(_("Vehicle Finance document creation failed."))

        je_finance = frappe.new_doc("Journal Entry")
        je_finance.voucher_type = "Journal Entry"
        je_finance.company = doc.company
        je_finance.posting_date = getdate()
        je_finance.title = doc.custom_finance_provider
        je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
        je_finance.append("accounts", {
            "account": "Finance Receivable - A",
            "party_type": "Customer",
            "party": doc.custom_finance_provider,
            "debit_in_account_currency": doc.custom_finance_amount,
            "credit_in_account_currency": 0,
            "cost_center": "Main - A",
            "against_account": doc.customer
        })
        je_finance.append("accounts", {
            "account": "Debtors - A",
            "party_type": "Customer",
            "party": doc.customer,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": doc.custom_finance_amount,
            "cost_center": "Main - A",
            "against_account": doc.custom_finance_provider
        })
        je_finance.save()
        frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

    # Miscellaneous Journal Entries
    for misc in doc.custom_miscellaneous:
        if misc.amount > 0:
            je_misc = frappe.new_doc("Journal Entry")
            je_misc.voucher_type = "Journal Entry"
            je_misc.company = doc.company
            je_misc.posting_date = getdate()
            je_misc.title = f"Miscellaneous Charge - {doc.customer}"
            je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
            je_misc.append("accounts", {
                "account": "Debtors - A",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": misc.amount,
                "credit_in_account_currency": 0,
                "cost_center": "Main - A",
                "against_account": misc.misc_account
            })
            je_misc.append("accounts", {
                "account": f"{misc.misc_account} Payable - A",
                "party_type": "Supplier",
                "party": misc.misc_account,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": misc.amount,
                "cost_center": "Main - A",
                "against_account": "Debtors - A"
            })
            je_misc.save()
            frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))

def after_insert_sales_invoice(doc, method):
    """Add suppliers with custom_show_in_sales_invoice = 1 and supplier_group = 'Misc Group' to custom_miscellaneous child table on Sales Invoice creation."""
    suppliers = frappe.get_all(
        "Supplier",
        filters={
            "custom_show_in_sales_invoice": 1,
            "supplier_group": "Misc Group"
        },
        fields=["supplier_name"]
    )

    # Only add suppliers if custom_miscellaneous is empty
    if not doc.custom_miscellaneous:
        for supplier in suppliers:
            doc.append("custom_miscellaneous", {
                "misc_account": supplier.supplier_name,
                "amount": 0
            })
        doc.save()