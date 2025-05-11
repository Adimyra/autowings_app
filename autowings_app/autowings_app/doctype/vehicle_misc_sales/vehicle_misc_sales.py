# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class VehicleMiscSales(Document):
	pass


# import frappe
# from frappe import _
# from frappe.utils import now_datetime

# def on_submit(doc, method):
#     """
#     On Payment Entry submission, update payment_status to 'Paid' in Vehicle Misc Sales
#     misc_accounts child table for matching journal_entry_id.
#     """
#     try:
#         # Iterate through references in Payment Entry
#         for reference in doc.references:
#             if reference.reference_doctype == "Journal Entry" and reference.reference_name:
#                 update_vehicle_misc_sales_payment_status(doc, reference)
#     except Exception as e:
#         log_error(doc, f"Error processing Payment Entry submission: {str(e)}")
#         frappe.msgprint(
#             msg=_("Error updating Vehicle Misc Sales payment status: {0}").format(str(e)),
#             title=_("Error"),
#             indicator="red"
#         )

# def update_vehicle_misc_sales_payment_status(doc, reference, retry_count=0):
#     """
#     Update payment_status in Vehicle Misc Sales misc_accounts for a given journal_entry_id.
#     """
#     max_retries = 3
#     try:
#         # Find Vehicle Misc Sales documents where journal_entry_id matches reference_name
#         vms_docs = frappe.get_all(
#             "Vehicle Misc Sales",
#             filters={
#                 "customer": reference.custom_party_name,
#                 "docstatus": ["!=", 2]  # Not cancelled
#             },
#             fields=["name"]
#         )

#         for vms in vms_docs:
#             # Get the Vehicle Misc Sales document
#             vms_doc = frappe.get_doc("Vehicle Misc Sales", vms.name)
            
#             # Check misc_accounts for matching journal_entry_id
#             for row in vms_doc.misc_accounts:
#                 if row.journal_entry_id == reference.reference_name:
#                     # Update payment_status to Paid
#                     row.payment_status = "Paid"
                    
#                     # Log activity
#                     log_vehicle_misc_activity(
#                         vms_doc,
#                         activity="Payment Status Updated",
#                         status="Success",
#                         remarks=f"Payment status set to Paid for journal {row.journal_entry_id} via Payment Entry {doc.name}"
#                     )
            
#             # Save the document with retry logic
#             save_document_with_retry(vms_doc, retry_count)

#     except Exception as e:
#         if retry_count < max_retries and "Document has been modified after you have opened it" in str(e):
#             # Retry after reloading the document
#             frappe.db.rollback()
#             update_vehicle_misc_sales_payment_status(doc, reference, retry_count + 1)
#         else:
#             log_error(doc, f"Error updating payment status for journal {reference.reference_name}: {str(e)}")
#             frappe.throw(
#                 msg=_("Error updating payment status for journal {0}: {1}").format(reference.reference_name, str(e)),
#                 title=_("Error")
#             )

# def save_document_with_retry(doc, retry_count, max_retries=3):
#     """
#     Save the document with retry logic for TimestampMismatchError.
#     """
#     try:
#         doc.save()
#         frappe.db.commit()
#     except Exception as e:
#         if retry_count < max_retries and "Document has been modified after you have opened it" in str(e):
#             frappe.db.rollback()
#             doc.reload()
#             save_document_with_retry(doc, retry_count + 1, max_retries)
#         else:
#             raise e

# def log_vehicle_misc_activity(doc, activity, status, remarks):
#     """
#     Log activity to RTO Activity Log child table.
#     """
#     try:
#         activity_log = {
#             "doctype": "RTO Activity Log",
#             "activity": activity,
#             "status": status,
#             "user": frappe.session.user,
#             "update_on": now_datetime(),
#             "remarks": (remarks or "")[:140],
#             "parent": doc.name,
#             "parentfield": "misc_activity",
#             "parenttype": "Vehicle Misc Sales"
#         }
#         frappe.get_doc(activity_log).insert(ignore_permissions=True)
#         frappe.db.commit()
#     except Exception as e:
#         frappe.log_error(f"Failed to log activity for {doc.name}: {str(e)}")

# def log_error(doc, message):
#     """
#     Log error to Error Log.
#     """
#     frappe.log_error(
#         message=message,
#         title=f"Payment Entry {doc.name} Submission Error"
#     )