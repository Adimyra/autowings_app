# import frappe
# from frappe import _

# @frappe.whitelist()
# def add_rto_activity(rto_name, item, status, date):
#     """
#     Add an RTO Activity Log entry to an RTO Registration document.
    
#     Args:
#         rto_name (str): Name of the RTO Registration document
#         item (str): RTO Activity Item
#         status (str): Status (Received/Delivered)
#         date (str): Date of the activity
    
#     Returns:
#         dict: Success status and message
#     """
#     try:
#         # Validate inputs
#         if not all([rto_name, item, status, date]):
#             frappe.throw(_("All fields (RTO Name, Item, Status, Date) are mandatory."))
        
#         # Check if RTO Registration exists
#         if not frappe.db.exists("RTO Registration", rto_name):
#             frappe.throw(_("RTO Registration {0} does not exist.").format(rto_name))
        
#         # Validate status
#         if status not in ["Received", "Delivered"]:
#             frappe.throw(_("Status must be either 'Received' or 'Delivered'."))
        
#         # Get the next idx for the child table
#         max_idx = frappe.db.sql("""
#             SELECT IFNULL(MAX(idx), 0) + 1
#             FROM `tabRTO Activity Log`
#             WHERE parent = %s
#         """, (rto_name,))[0][0]
        
#         # Create RTO Activity Log document
#         activity_log = frappe.get_doc({
#             "doctype": "RTO Activity Log",
#             "item": item,
#             "status": status,
#             "date": date,
#             "user": user,
#             "parent": rto_name,
#             "parentfield": "rto_activity",
#             "parenttype": "RTO Registration",
#             "idx": max_idx
#         })
        
#         # Insert the document (bypasses docstatus restrictions if needed)
#         activity_log.insert(ignore_permissions=True)
        
#         frappe.db.commit()
        
#         return {
#             "success": True,
#             "message": _("RTO Activity added successfully.")
#         }
    
#     except Exception as e:
#         frappe.db.rollback()
#         frappe.log_error(_("Error adding RTO Activity: {0}").format(str(e)), "RTO Activity")
#         return {
#             "success": False,
#             "message": _("Error adding RTO Activity: {0}").format(str(e))
#         }

import frappe
from frappe import _

@frappe.whitelist()
def add_rto_activity(rto_name, item, status, date, user=None):
    """
    Add an RTO Activity Log entry to an RTO Registration document.
    
    Args:
        rto_name (str): Name of the RTO Registration document
        item (str): RTO Activity Item
        status (str): Status (Received/Delivered)
        date (str): Date of the activity
        user (str, optional): User associated with the activity. Defaults to current user.
    
    Returns:
        dict: Success status and message
    """
    try:
        # Validate inputs
        if not all([rto_name, item, status, date]):
            frappe.throw(_("All fields (RTO Name, Item, Status, Date) are mandatory."))
        
        # Check if RTO Registration exists
        if not frappe.db.exists("RTO Registration", rto_name):
            frappe.throw(_("RTO Registration {0} does not exist.").format(rto_name))
        
        # Validate status
        # if status not in ["Received", "Delivered"]:
        #     frappe.throw(_("Status must be either 'Received' or 'Delivered'."))
        
        # Set user to current user if not provided
        user = user or frappe.session.user
        
        # Validate user
        if not frappe.db.exists("User", user):
            frappe.throw(_("User {0} does not exist.").format(user))
        
        # Get the next idx for the child table
        max_idx = frappe.db.sql("""
            SELECT IFNULL(MAX(idx), 0) + 1
            FROM `tabRTO Activity Log`
            WHERE parent = %s
        """, (rto_name,))[0][0]
        
        # Create RTO Activity Log document
        activity_log = frappe.get_doc({
            "doctype": "RTO Activity Log",
            "item": item,
            "status": status,
            "date": date,
            "user": user,
            "parent": rto_name,
            "parentfield": "rto_activity",
            "parenttype": "RTO Registration",
            "idx": max_idx
        })
        
        # Insert the document (bypasses docstatus restrictions if needed)
        activity_log.insert(ignore_permissions=True)
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": _("RTO Activity added successfully.")
        }
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(_("Error adding RTO Activity: {0}").format(str(e)), "RTO Activity")
        return {
            "success": False,
            "message": _("Error adding RTO Activity: {0}").format(str(e))
        }
    

    