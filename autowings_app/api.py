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

# import frappe

# @frappe.whitelist()
# def get_sales_invoice_series():
#     doctype_name = "Sales Invoice"
#     naming_series_field = frappe.get_meta(doctype_name).get_field("naming_series")

#     if naming_series_field and naming_series_field.options:
#         series_list = naming_series_field.options.split("\n")  # Convert to list
#         return series_list
#     return []


# # for sales invoice naming series

# import frappe

# @frappe.whitelist()
# def get_user_naming_series(user):
#     user_privileges = frappe.get_doc("User Privileges Settings")
    
#     for entry in user_privileges.users:
#         if entry.user == user:
#             return entry.sales_invoice_series
    
#     return None  # If no matching user is found


import frappe

@frappe.whitelist()
def get_sales_invoice_series():
    doctype_name = "Sales Invoice"
    naming_series_field = frappe.get_meta(doctype_name).get_field("naming_series")
    
    if naming_series_field and naming_series_field.options:
        series_list = naming_series_field.options.split("\n")  # Convert to list
        return series_list
    return []


# @frappe.whitelist()
# def get_sub_sales_types(sales_type):
#     if not sales_type:
#         return []
    
#     try:
#         # Fetch the Autowings Naming Series single doctype record
#         naming_series_doc = frappe.get_single("Autowings Naming Series")
#     except frappe.DoesNotExistError:
#         frappe.log_error("Autowings Naming Series single doctype record not found.", "get_sub_sales_types")
#         return []
    
#     # Fetch child table entries where sales_type matches
#     entries = frappe.get_all(
#         "Autowings Naming Child",
#         filters={
#             "parent": naming_series_doc.name,
#             "parenttype": "Autowings Naming Series",
#             "parentfield": "autowings_naming_series_configuration",
#             "sales_type": sales_type
#         },
#         fields=["sub_sales_type", "sales_naming_series"],
#         order_by="idx"
#     )
    
#     return entries

@frappe.whitelist()
def get_sub_sales_types(sales_type):
    if not sales_type:
        return []
    
    try:
        # Fetch the Autowings Naming Series single doctype record
        naming_series_doc = frappe.get_single("Autowings Naming Series")
    except frappe.DoesNotExistError:
        frappe.log_error("Autowings Naming Series single doctype record not found.", "get_sub_sales_types")
        return []
    
    # Fetch child table entries where sales_type matches and enable is checked
    entries = frappe.get_all(
        "Autowings Naming Child",
        filters={
            "parent": naming_series_doc.name,
            "parenttype": "Autowings Naming Series",
            "parentfield": "autowings_naming_series_configuration",
            "sales_type": sales_type,
            "enable": 1
        },
        fields=["sub_sales_type", "sales_naming_series"],
        order_by="idx"
    )
    
    return entries
@frappe.whitelist()
def get_enabled_sales_types():
    try:
        # Fetch the Autowings Naming Series single doctype record
        naming_series_doc = frappe.get_single("Autowings Naming Series")
    except frappe.DoesNotExistError:
        frappe.log_error("Autowings Naming Series single doctype record not found.", "get_enabled_sales_types")
        return []

    # Fetch distinct sales types where enable is checked
    entries = frappe.get_all(
        "Autowings Naming Child",
        filters={
            "parent": naming_series_doc.name,
            "parenttype": "Autowings Naming Series",
            "parentfield": "autowings_naming_series_configuration",
            "enable": 1
        },
        fields=["distinct sales_type"],
        order_by="sales_type"
    )

    # Extract sales_type values from the result
    sales_types = [entry.sales_type for entry in entries]
    return sales_types




# for misc account journal entry payment entry
import frappe
from frappe import _

@frappe.whitelist()
def get_vehicle_misc_sales(journal_entries):
    try:
        # Fetch all Vehicle Misc Sales documents
        misc_sales = frappe.get_all(
            "Vehicle Misc Sales",
            fields=["name"]
        )

        result = []
        for sale in misc_sales:
            # Fetch misc_accounts with matching journal_entry_id and payment_status
            accounts = frappe.get_all(
                "Misc Journal vsm",
                filters={
                    "parent": sale.name,
                    "journal_entry_id": ["in", journal_entries],
                    "payment_status": "Due",
                    "journal_status": "Submitted"
                },
                fields=["name", "idx", "journal_entry_id", "payment_status", "journal_status"]
            )
            if accounts:
                result.append({
                    "name": sale.name,
                    "misc_accounts": accounts
                })

        return result
    except Exception as e:
        frappe.log_error(f"Error fetching Vehicle Misc Sales: {str(e)}")
        frappe.throw(_("Failed to fetch Vehicle Misc Sales. Please check server logs."))




# naming series for delivery note job card

import frappe

@frappe.whitelist()
def get_enabled_delivery_note_types():
    # Fetch the Autowings Naming Series document
    doc = frappe.get_doc("Autowings Naming Series", "Autowings Naming Series")
    enabled_types = []
    for entry in doc.delivery_note:
        if entry.enable:  # Only include enabled entries
            enabled_types.append({
                "name": entry.delivery_note_type,
                "label": entry.delivery_note_type,
                "naming_series": entry.delivery_note_naming_series
            })
    return enabled_types


import frappe

@frappe.whitelist()
def get_delivery_note_series():
    doctype_name = "Delivery Note"
    naming_series_field = frappe.get_meta(doctype_name).get_field("naming_series")
    
    if naming_series_field and naming_series_field.options:
        series_list = naming_series_field.options.split("\n")  # Convert to list
        return series_list
    return []

@frappe.whitelist()
def get_job_card_series():
    doctype_name = "AW Job Card"
    naming_series_field = frappe.get_meta(doctype_name).get_field("naming_series")
    
    if naming_series_field and naming_series_field.options:
        series_list = naming_series_field.options.split("\n")  # Convert to list
        return series_list
    return []


import frappe

@frappe.whitelist()
def get_enabled_job_card_types():
    try:
        # Fetch the Autowings Naming Series document
        doc = frappe.get_doc("Autowings Naming Series", "Autowings Naming Series")
        enabled_types = []
        for entry in doc.job_card:
            if entry.enable:  # Only include enabled entries
                enabled_types.append({
                    "name": entry.job_card_type,
                    "label": entry.job_card_type,
                    "naming_series": entry.job_card_naming_series
                })
        return enabled_types
    except Exception as e:
        frappe.log_error(f"Error fetching enabled Job Card types: {str(e)}")
        return []