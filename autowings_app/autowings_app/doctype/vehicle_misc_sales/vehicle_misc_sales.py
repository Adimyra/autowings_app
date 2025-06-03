# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class VehicleMiscSales(Document):
# 	pass

# import frappe
# from frappe import _
# from frappe.model.document import Document

# class VehicleMiscSales(Document):
#     def validate(self):
#         # Ensure misc_accounts is only editable when status is "Due Update"
#         if self.status != "Due Update":
#             frappe.throw(_("Cannot modify misc_accounts table when status is not 'Due Update'. The table is read-only."))

#     def before_save(self):
#         # Validate deletions and additions in misc_accounts
#         self.validate_misc_accounts()

#     def validate_misc_accounts(self):
#         # Get previous version of the document to compare changes
#         previous_doc = self.get_doc_before_save()

#         # If new document, only handle new rows
#         if not previous_doc:
#             self.create_journal_entries_for_new_rows()
#             return

#         previous_accounts = {row.name: row for row in previous_doc.get("misc_accounts", [])}
#         current_accounts = {row.name: row for row in self.get("misc_accounts", [])}

#         # Check for deleted rows
#         for row_name in previous_accounts:
#             if row_name not in current_accounts:
#                 self.validate_deletion(previous_accounts[row_name])

#         # Check for new rows and create journal entries
#         self.create_journal_entries_for_new_rows()

#     def validate_deletion(self, row):
#         # Check if row has a linked journal entry
#         if row.journal_entry_id:
#             try:
#                 je_doc = frappe.get_doc("Journal Entry", row.journal_entry_id)
#                 if je_doc.docstatus == 1:  # Submitted
#                     frappe.throw(_(
#                         "Cannot delete row {0} because it is linked to submitted Journal Entry {1}. "
#                         "Please cancel or delete the Journal Entry first."
#                     ).format(row.idx, row.journal_entry_id))
#                 elif je_doc.docstatus == 0 or je_doc.docstatus == 2:  # Draft or Canceled
#                     # Unlink the journal entry from Vehicle Misc Sales
#                     self.unlink_journal_entry(row.journal_entry_id)
#                     # Delete the journal entry
#                     frappe.delete_doc("Journal Entry", row.journal_entry_id, ignore_permissions=False, force=True)
#             except frappe.DoesNotExistError:
#                 frappe.msgprint(_("Journal Entry {0} linked to row {1} does not exist.").format(row.journal_entry_id, row.idx))

#         # Check for payment entry (assuming payment_status != "Due" indicates a payment entry)
#         if row.payment_status != "Due":
#             frappe.throw(_(
#                 "Cannot delete row {0} because it is linked to a submitted Payment Entry. "
#                 "Please cancel or delete the Payment Entry first."
#             ).format(row.idx))

#     def unlink_journal_entry(self, journal_entry_id):
#         # Clear references to the journal entry in misc_accounts
#         for row in self.get("misc_accounts", []):
#             if row.journal_entry_id == journal_entry_id:
#                 row.journal_entry_id = None
#                 row.payment_status = "Due"
#         # Save the document to update the unlinked reference, handling concurrent modification
#         max_retries = 3
#         for attempt in range(max_retries):
#             try:
#                 self.save(ignore_permissions=True)
#                 frappe.db.commit()  # Ensure changes are committed
#                 break
#             except frappe.TimestampMismatchError:
#                 if attempt < max_retries - 1:
#                     self.reload()  # Reload the latest version of the document
#                     for row in self.get("misc_accounts", []):
#                         if row.journal_entry_id == journal_entry_id:
#                             row.journal_entry_id = None
#                             row.payment_status = "Due"
#                 else:
#                     frappe.throw(_("Failed to save document after multiple retries due to concurrent modification. Please refresh and try again."))

#     def create_journal_entries_for_new_rows(self):
#         # Create journal entries for new rows in misc_accounts
#         for row in self.get("misc_accounts", []):
#             if not row.journal_entry_id and row.amount > 0:  # Ensure valid amount
#                 self.create_journal_entry(row)

#     def get_company(self):
#         # Fetch company from Sales Invoice if available
#         if self.sales_invoice:
#             try:
#                 sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
#                 return sales_invoice.company
#             except frappe.DoesNotExistError:
#                 frappe.msgprint(_("Sales Invoice {0} does not exist.").format(self.sales_invoice))
#         # Fallback to default company from Global Defaults
#         return frappe.db.get_single_value("Global Defaults", "default_company") or "Autowings"

#     def get_posting_date(self):
#         # Fetch posting_date from Sales Invoice if available
#         if self.sales_invoice:
#             try:
#                 sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
#                 return sales_invoice.posting_date
#             except frappe.DoesNotExistError:
#                 frappe.msgprint(_("Sales Invoice {0} does not exist.").format(self.sales_invoice))
#         # Fallback to current date
#         return frappe.utils.today()

#     def create_journal_entry(self, row):
#         # Create a new Journal Entry document
#         je_doc = frappe.new_doc("Journal Entry")
#         company = self.get_company()
#         posting_date = self.get_posting_date()
#         je_doc.update({
#             "voucher_type": "Journal Entry",
#             "naming_series": "ACC-JV-.YYYY.-",
#             "company": company,
#             "posting_date": posting_date,
#             "title": f"Misc - {self.customer or 'Unknown'} - {row.misc_account or 'Unknown'}",
#             "remark": f"Miscellaneous charge of ₹{row.amount} for Sales Invoice {self.sales_invoice or 'N/A'} paid to {row.misc_account or 'N/A'}.",
#             "total_debit": row.amount,
#             "total_credit": row.amount,
#             "total_amount": row.amount,
#             "total_amount_currency": "INR",
#             "total_amount_in_words": frappe.utils.money_in_words(row.amount, main_currency="INR"),
#             "write_off_based_on": "Accounts Receivable",
#             "write_off_amount": 0,
#             "is_opening": "No"
#         })

#         # Add debit entry (Customer/Debtors)
#         je_doc.append("accounts", {
#             "account": "Debtors - A",
#             "account_type": "Receivable",
#             "party_type": "Customer",
#             "party": self.customer or frappe.throw(_("Customer is required for Journal Entry.")),
#             "cost_center": "Main - A",
#             "account_currency": "INR",
#             "exchange_rate": 1,
#             "debit_in_account_currency": row.amount,
#             "debit": row.amount,
#             "credit_in_account_currency": 0,
#             "credit": 0,
#             "is_advance": "No",
#             "against_account": row.misc_account or "Miscellaneous"
#         })

#         # Add credit entry (Misc Account Payable)
#         je_doc.append("accounts", {
#             "account": f"{row.misc_account or 'Miscellaneous'} Payable - A",
#             "account_type": "Payable",
#             "party_type": "Supplier",
#             "party": row.misc_account or "Miscellaneous",
#             "cost_center": "Main - A",
#             "account_currency": "INR",
#             "exchange_rate": 1,
#             "debit_in_account_currency": 0,
#             "debit": 0,
#             "credit_in_account_currency": row.amount,
#             "credit": row.amount,
#             "is_advance": "No",
#             "against_account": self.customer or "Unknown"
#         })

#         # Save the journal entry as draft
#         je_doc.insert(ignore_permissions=False)

#         # Link the journal entry to the row and set payment_status to Due
#         row.journal_entry_id = je_doc.name
#         row.payment_status = "Due"

#     def on_trash(self):
#         # Prevent deletion if any linked journal entries are submitted
#         for row in self.get("misc_accounts", []):
#             if row.journal_entry_id:
#                 try:
#                     je_doc = frappe.get_doc("Journal Entry", row.journal_entry_id)
#                     if je_doc.docstatus == 1:
#                         frappe.throw(_(
#                             "Cannot delete document because row {0} is linked to submitted Journal Entry {1}. "
#                             "Please cancel or delete the Journal Entry first."
#                         ).format(row.idx, row.journal_entry_id))
#                     elif je_doc.docstatus == 0 or je_doc.docstatus == 2:
#                         # Unlink and delete draft or canceled journal entries
#                         self.unlink_journal_entry(row.journal_entry_id)
#                         frappe.delete_doc("Journal Entry", row.journal_entry_id, ignore_permissions=False, force=True)
#                 except frappe.DoesNotExistError:
#                     frappe.msgprint(_("Journal Entry {0} linked to row {1} does not exist.").format(row.journal_entry_id, row.idx))

# # import frappe
# # from frappe import _
# # from frappe.utils import now_datetime

# # def on_submit(doc, method):
# #     """
# #     On Payment Entry submission, update payment_status to 'Paid' in Vehicle Misc Sales
# #     misc_accounts child table for matching journal_entry_id.
# #     """
# #     try:
# #         # Iterate through references in Payment Entry
# #         for reference in doc.references:
# #             if reference.reference_doctype == "Journal Entry" and reference.reference_name:
# #                 update_vehicle_misc_sales_payment_status(doc, reference)
# #     except Exception as e:
# #         log_error(doc, f"Error processing Payment Entry submission: {str(e)}")
# #         frappe.msgprint(
# #             msg=_("Error updating Vehicle Misc Sales payment status: {0}").format(str(e)),
# #             title=_("Error"),
# #             indicator="red"
# #         )

# # def update_vehicle_misc_sales_payment_status(doc, reference, retry_count=0):
# #     """
# #     Update payment_status in Vehicle Misc Sales misc_accounts for a given journal_entry_id.
# #     """
# #     max_retries = 3
# #     try:
# #         # Find Vehicle Misc Sales documents where journal_entry_id matches reference_name
# #         vms_docs = frappe.get_all(
# #             "Vehicle Misc Sales",
# #             filters={
# #                 "customer": reference.custom_party_name,
# #                 "docstatus": ["!=", 2]  # Not cancelled
# #             },
# #             fields=["name"]
# #         )

# #         for vms in vms_docs:
# #             # Get the Vehicle Misc Sales document
# #             vms_doc = frappe.get_doc("Vehicle Misc Sales", vms.name)
            
# #             # Check misc_accounts for matching journal_entry_id
# #             for row in vms_doc.misc_accounts:
# #                 if row.journal_entry_id == reference.reference_name:
# #                     # Update payment_status to Paid
# #                     row.payment_status = "Paid"
                    
# #                     # Log activity
# #                     log_vehicle_misc_activity(
# #                         vms_doc,
# #                         activity="Payment Status Updated",
# #                         status="Success",
# #                         remarks=f"Payment status set to Paid for journal {row.journal_entry_id} via Payment Entry {doc.name}"
# #                     )
            
# #             # Save the document with retry logic
# #             save_document_with_retry(vms_doc, retry_count)

# #     except Exception as e:
# #         if retry_count < max_retries and "Document has been modified after you have opened it" in str(e):
# #             # Retry after reloading the document
# #             frappe.db.rollback()
# #             update_vehicle_misc_sales_payment_status(doc, reference, retry_count + 1)
# #         else:
# #             log_error(doc, f"Error updating payment status for journal {reference.reference_name}: {str(e)}")
# #             frappe.throw(
# #                 msg=_("Error updating payment status for journal {0}: {1}").format(reference.reference_name, str(e)),
# #                 title=_("Error")
# #             )

# # def save_document_with_retry(doc, retry_count, max_retries=3):
# #     """
# #     Save the document with retry logic for TimestampMismatchError.
# #     """
# #     try:
# #         doc.save()
# #         frappe.db.commit()
# #     except Exception as e:
# #         if retry_count < max_retries and "Document has been modified after you have opened it" in str(e):
# #             frappe.db.rollback()
# #             doc.reload()
# #             save_document_with_retry(doc, retry_count + 1, max_retries)
# #         else:
# #             raise e

# # def log_vehicle_misc_activity(doc, activity, status, remarks):
# #     """
# #     Log activity to RTO Activity Log child table.
# #     """
# #     try:
# #         activity_log = {
# #             "doctype": "RTO Activity Log",
# #             "activity": activity,
# #             "status": status,
# #             "user": frappe.session.user,
# #             "update_on": now_datetime(),
# #             "remarks": (remarks or "")[:140],
# #             "parent": doc.name,
# #             "parentfield": "misc_activity",
# #             "parenttype": "Vehicle Misc Sales"
# #         }
# #         frappe.get_doc(activity_log).insert(ignore_permissions=True)
# #         frappe.db.commit()
# #     except Exception as e:
# #         frappe.log_error(f"Failed to log activity for {doc.name}: {str(e)}")

# # def log_error(doc, message):
# #     """
# #     Log error to Error Log.
# #     """
# #     frappe.log_error(
# #         message=message,
# #         title=f"Payment Entry {doc.name} Submission Error"
# #     )
import frappe
from frappe import _
from frappe.model.document import Document

class VehicleMiscSales(Document):
    def before_save(self):
        # Create journal entries for new rows in misc_accounts
        self.create_journal_entries_for_new_rows()

    def create_journal_entries_for_new_rows(self):
        # Create journal entries for new rows in misc_accounts
        for row in self.get("misc_accounts", []):
            if not row.journal_entry_id and row.amount > 0:  # Ensure valid amount
                self.create_journal_entry(row)

    def get_company(self):
        # Fetch company from Sales Invoice if available
        if self.sales_invoice:
            try:
                sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
                return sales_invoice.company
            except frappe.DoesNotExistError:
                frappe.msgprint(_("Sales Invoice {0} does not exist.").format(self.sales_invoice))
        # Fallback to default company from Global Defaults
        return frappe.db.get_single_value("Global Defaults", "default_company") or "Autowings"

    def get_posting_date(self):
        # Fetch posting_date from Sales Invoice if available
        if self.sales_invoice:
            try:
                sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
                return sales_invoice.posting_date
            except frappe.DoesNotExistError:
                frappe.msgprint(_("Sales Invoice {0} does not exist.").format(self.sales_invoice))
        # Fallback to current date
        return frappe.utils.today()

    def create_journal_entry(self, row):
        # Create a new Journal Entry document
        je_doc = frappe.new_doc("Journal Entry")
        company = self.get_company()
        posting_date = self.get_posting_date()
        je_doc.update({
            "voucher_type": "Journal Entry",
            "naming_series": "ACC-JV-.YYYY.-",
            "company": company,
            "posting_date": posting_date,
            "title": f"Misc - {self.customer or 'Unknown'} - {row.misc_account or 'Unknown'}",
            "remark": f"Miscellaneous charge of ₹{row.amount} for Sales Invoice {self.sales_invoice or 'N/A'} paid to {row.misc_account or 'N/A'}.",
            "total_debit": row.amount,
            "total_credit": row.amount,
            "total_amount": row.amount,
            "total_amount_currency": "INR",
            "total_amount_in_words": frappe.utils.money_in_words(row.amount, main_currency="INR"),
            "write_off_based_on": "Accounts Receivable",
            "write_off_amount": 0,
            "is_opening": "No"
        })

        # Add debit entry (Customer/Debtors)
        je_doc.append("accounts", {
            "account": "Debtors - A",
            "account_type": "Receivable",
            "party_type": "Customer",
            "party": self.customer or frappe.throw(_("Customer is required for Journal Entry.")),
            "cost_center": "Main - A",
            "account_currency": "INR",
            "exchange_rate": 1,
            "debit_in_account_currency": row.amount,
            "debit": row.amount,
            "credit_in_account_currency": 0,
            "credit": 0,
            "is_advance": "No",
            "against_account": row.misc_account or "Miscellaneous"
        })

        # Add credit entry (Misc Account Payable)
        je_doc.append("accounts", {
            "account": f"{row.misc_account or 'Miscellaneous'} Payable - A",
            "account_type": "Payable",
            "party_type": "Supplier",
            "party": row.misc_account or "Miscellaneous",
            "cost_center": "Main - A",
            "account_currency": "INR",
            "exchange_rate": 1,
            "debit_in_account_currency": 0,
            "debit": 0,
            "credit_in_account_currency": row.amount,
            "credit": row.amount,
            "is_advance": "No",
            "against_account": self.customer or "Unknown"
        })

        # Save the journal entry as draft
        je_doc.insert(ignore_permissions=False)

        # Link the journal entry to the row and set payment_status to Due
        row.journal_entry_id = je_doc.name
        row.payment_status = "Due"