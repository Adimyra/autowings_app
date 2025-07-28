import frappe
from frappe.utils import nowdate, add_days, get_datetime

def on_submit_sales_invoice_create_schedule(doc, method):
    try:
        # Check if custom_sale_type is "Vehicle"
        if doc.custom_sale_type != "Vehicle":
            return

        # Iterate through items in the Sales Invoice
        for item in doc.items:
            if item.item_code:
                # Fetch the Item document
                item_doc = frappe.get_doc("Item", item.item_code)
                
                # Create a new Service Schedule document
                service_schedule = frappe.new_doc("Service Schedule")
                
                # Populate fields from Sales Invoice
                service_schedule.naming_series = "AW-VS-.YYYY.-.MM.-"
                service_schedule.customer = doc.customer
                service_schedule.customer_name = doc.customer_name
                service_schedule.status = "Active"
                service_schedule.date = nowdate()
                service_schedule.sales_invoice_id = doc.name
                service_schedule.item = item.item_code
                service_schedule.vehicle_modal = item.item_code
                service_schedule.vehicle_name = item.item_name
                
                # Fetch chassis number from custom_vin table in Sales Invoice
                for vin in doc.custom_vin:
                    if vin.item == item.item_code:
                        service_schedule.chassis_number = vin.chassis_number
                        break
                
                # Handle custom_serviceinfo2 if it exists
                if hasattr(item_doc, "custom_serviceinfo2") and item_doc.custom_serviceinfo2:
                    # Populate the info table from custom_serviceinfo2
                    for service_info in item_doc.custom_serviceinfo2:
                        service_schedule.append("info", {
                            "service_no": service_info.service_no,
                            "kilo_meter": service_info.kilo_meter,
                            "days": service_info.days,
                            "is_free": service_info.is_free
                        })
                    
                    # Initialize the next service due fields (for first service)
                    first_service = item_doc.custom_serviceinfo2[0]
                    service_schedule.next_service_due_days = first_service.days
                    service_schedule.next_service_due_kms = first_service.kilo_meter
                    
                    # Populate service_scheduled_info table
                    for service_info in item_doc.custom_serviceinfo2:
                        days = int(service_info.days or 0)
                        scheduled_date = add_days(doc.posting_date, days)
                        status = "Due" if get_datetime(scheduled_date) < get_datetime(nowdate()) else "Upcoming"
                        service_schedule.append("service_scheduled_info", {
                            "service_no": service_info.service_no,
                            "kilo_meter": service_info.kilo_meter,
                            "days": service_info.days,
                            "is_free": service_info.is_free,
                            "scheduled_date": scheduled_date,
                            "status": status
                        })
                else:
                    # Handle case where custom_serviceinfo2 is empty
                    days = int(item_doc.custom_post__exwarranty_details or 0)
                    kms = int(item_doc.custom_next_service_due_kms or 0)
                    service_schedule.next_service_due_days = days
                    service_schedule.next_service_due_kms = kms
                    
                    # Populate info table with one row
                    service_schedule.append("info", {
                        "service_no": 1,
                        "kilo_meter": kms,
                        "days": days,
                        "is_free": "No"
                    })
                    
                    # Add one row to service_scheduled_info
                    scheduled_date = add_days(doc.posting_date, days)
                    status = "Due" if get_datetime(scheduled_date) < get_datetime(nowdate()) else "Upcoming"
                    service_schedule.append("service_scheduled_info", {
                        "service_no": 1,
                        "kilo_meter": kms,
                        "days": days,
                        "is_free": "No",
                        "scheduled_date": scheduled_date,
                        "status": status
                    })
                
                # Save the Service Schedule document
                service_schedule.insert(ignore_permissions=True)
                
                # Update the Sales Invoice with the Service Schedule ID using MariaDB query
                frappe.db.sql("""
                    UPDATE `tabSales Invoice`
                    SET custom_service_schedule_id = %s
                    WHERE name = %s
                """, (service_schedule.name, doc.name))
                
                frappe.db.commit()
                
    except Exception as e:
        frappe.log_error(f"Error creating Service Schedule: {str(e)}", "Sales Invoice Service Schedule Hook")
        raise

    # on cancelled sales invoice status change to cancelled of service schedule doc

def on_cancel_sales_invoice_create_schedule(doc, method):
    try:
        # Check if custom_sale_type is "Vehicle"
        if doc.custom_sale_type != "Vehicle":
            return

        # Fetch the Service Schedule document linked to the Sales Invoice
        service_schedule = frappe.get_all("Service Schedule", filters={"sales_invoice_id": doc.name}, fields=["name"])

        if service_schedule:
            # Update the status of the Service Schedule to "Cancelled"
            frappe.db.set_value("Service Schedule", service_schedule[0].name, "status", "Cancelled")
            frappe.db.commit()
    except Exception as e:
        frappe.log_error(f"Error cancelling Service Schedule: {str(e)}", "Sales Invoice Service Schedule Hook")
        raise  # Re-raise to ensure ERPNext logs the error