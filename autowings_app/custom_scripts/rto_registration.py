import frappe
from frappe import _

@frappe.whitelist()
def update_registration_number(rto_name, registration_number):
    """
    Update the Registration Number and set Registration Status to 'Registered' for an RTO Registration document.
    
    Args:
        rto_name (str): Name of the RTO Registration document
        registration_number (str): Registration Number to set
    
    Returns:
        dict: Success status and message
    """
    try:
        # Validate inputs
        if not all([rto_name, registration_number]):
            frappe.throw(_("All fields (RTO Name, Registration Number) are mandatory."))
        
        # Check if RTO Registration exists
        if not frappe.db.exists("RTO Registration", rto_name):
            frappe.throw(_("RTO Registration {0} does not exist.").format(rto_name))
        
        # Get the RTO Registration document for validation
        rto_doc = frappe.get_doc("RTO Registration", rto_name)
        
        # Validate document status
        if rto_doc.docstatus != 1:
            frappe.throw(_("RTO Registration {0} must be submitted.").format(rto_name))
        
        # Validate application_number and application_entry_date
        if not all([rto_doc.application_number, rto_doc.application_entry_date]):
            frappe.throw(_("Application Number and Application Entry Date are mandatory."))
        
        # Update registration_number and registration_status using direct SQL
        frappe.db.sql("""
            UPDATE `tabRTO Registration`
            SET registration_number = %s,
                registration_status = %s,
                modified = %s,
                modified_by = %s
            WHERE name = %s
        """, (registration_number, "Registered", frappe.utils.now(), frappe.session.user, rto_name))
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": _("Registration Number updated successfully. Status set to Registered.")
        }
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(_("Error updating Registration Number: {0}").format(str(e)), "RTO Registration")
        return {
            "success": False,
            "message": _("Error updating Registration Number: {0}").format(str(e))
        }