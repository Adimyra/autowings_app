import frappe
from frappe import _

@frappe.whitelist()
def submit_rto_registration(rto_name):
    try:
        # Fetch the RTO Registration document
        rto_doc = frappe.get_doc("RTO Registration", rto_name)
        
        # Ensure the document is not already submitted
        if rto_doc.docstatus == 1:
            return {"success": False, "error": "RTO Registration is already submitted."}
        
        # Update journal_status
        rto_doc.journal_status = "Submitted"
        
        # Save and submit the document in a single transaction
        rto_doc.save()
        rto_doc.submit()
        
        return {"success": True}
    except Exception as e:
        frappe.log_error(f"Error submitting RTO Registration {rto_name}: {str(e)}")
        return {"success": False, "error": str(e)}