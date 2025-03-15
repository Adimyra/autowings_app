import frappe

@frappe.whitelist()
def get_serial_no_details(sales_invoice):
    sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
    vehicle_sale = frappe.get_doc("Vehicle Sale", {"sales_invoice": sales_invoice})

    return {
        "chassis_number": vehicle_sale.chassis_number,
        "engine_number": vehicle_sale.engine_number,
        "vehicle_color": vehicle_sale.vehicle_color
    }

import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def submit_lead(full_name, email, phone, message, area=None):
    """Handles lead form submission and updates if existing"""
    try:
        frappe.logger().info(f"Received Lead Form: {full_name}, {email}, {phone}, {message}, {area}")

        # Check if a Lead already exists with this email
        existing_lead = frappe.db.exists("Lead", {"email_id": email})
        
        if existing_lead:
            # Update existing Lead
            lead = frappe.get_doc("Lead", existing_lead)
            lead.custom_query = message  # Ensure query is updated
            lead.custom_area = area if area else None
            lead.status = "Lead"  # Set a meaningful status
            lead.save(ignore_permissions=True)
            frappe.db.commit()
            response_message = _("Lead updated successfully!")
        else:
            # Create a new Lead
            lead = frappe.get_doc({
                "doctype": "Lead",
                "lead_name": full_name,
                "email_id": email,
                "phone": phone,
                "custom_query": message,  # Ensure query is set
                "source": "Website",
                "custom_area": area if area else None,
                "status": "Lead"  # Explicitly set status
            })
            lead.insert(ignore_permissions=True)
            frappe.db.commit()
            response_message = _("Lead submitted successfully!")

        frappe.logger().info(f"Lead Processed: {lead.name}")

        return {"status": "success", "message": response_message}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Lead Submission Error")
        frappe.logger().error(f"Error occurred: {str(e)}")
        return {"status": "error", "message": str(e)}



# for serial grab in settings of user privilage

import frappe

@frappe.whitelist()
def get_sales_invoice_series():
    doctype_name = "Sales Invoice"
    naming_series_field = frappe.get_meta(doctype_name).get_field("naming_series")

    if naming_series_field and naming_series_field.options:
        series_list = naming_series_field.options.split("\n")  # Convert to list
        return series_list
    return []


# for sales invoice naming series

import frappe

@frappe.whitelist()
def get_user_naming_series(user):
    user_privileges = frappe.get_doc("User Privileges Settings")
    
    for entry in user_privileges.users:
        if entry.user == user:
            return entry.sales_invoice_series
    
    return None  # If no matching user is found
