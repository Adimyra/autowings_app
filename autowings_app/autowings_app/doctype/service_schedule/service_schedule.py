# # Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# # For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class ServiceSchedule(Document):
# 	pass

# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, getdate, nowdate

class ServiceSchedule(Document):
    pass

@frappe.whitelist()
def create_service_reminder_tasks(is_manual=False, doc_name=None):
    """
    Create CRM Tasks for Service Schedule documents based on service_scheduled_info.
    - Daily scheduler (is_manual=False, doc_name=None): Process all Service Schedules with status='Active',
      creating tasks where today == reminder_date (scheduled_date - 7 days).
    - Manual run (is_manual=True, doc_name=None): Process all Service Schedules with status='Active',
      creating tasks where today == reminder_date.
    - Button click (is_manual=True, doc_name=specified): Process the specified Service Schedule with status='Active',
      creating tasks where reminder_date <= today, with duplicate checks based on service_no.
    Args:
        is_manual (bool): If True and doc_name specified, create tasks for reminder_date <= today.
                          Otherwise, create tasks for reminder_date == today.
        doc_name (str, optional): Name of the Service Schedule to process (for button click).
    """
    try:
        # Initialize logger
        logger = frappe.logger("service_schedule")
        
        # Track number of tasks created
        tasks_created = 0
        
        # Determine which Service Schedules to process
        if doc_name:
            # Process only the specified document
            service_schedules = frappe.get_all(
                "Service Schedule",
                filters={"name": doc_name, "status": "Active"},
                fields=["name", "customer", "customer_name", "vehicle_name", "sales_invoice_id"]
            )
        else:
            # Process all Service Schedules with status='Active'
            service_schedules = frappe.get_all(
                "Service Schedule",
                filters={"status": "Active"},
                fields=["name", "customer", "customer_name", "vehicle_name", "sales_invoice_id"]
            )

        for schedule in service_schedules:
            # Fetch the Service Schedule document
            doc = frappe.get_doc("Service Schedule", schedule.name)
            
            # Iterate through service_scheduled_info table
            for service_info in doc.service_scheduled_info:
                # Calculate the date 7 days before scheduled_date
                reminder_date = add_days(service_info.scheduled_date, -7)
                
                # Determine if task should be created
                create_task = False
                if is_manual and doc_name:
                    # For button click, create task if reminder_date is today or past
                    create_task = getdate(reminder_date) <= getdate(nowdate())
                else:
                    # For scheduler or manual run without doc_name, create task if today is reminder_date
                    create_task = getdate(nowdate()) == getdate(reminder_date)
                
                if create_task:
                    # Check for duplicates based on custom_service_schedule_id and service_no
                    existing_task = frappe.get_all(
                        "CRM Task",
                        filters={
                            "reference_doctype": "Service Schedule",
                            "reference_docname": doc.name,
                            "custom_service_schedule_id": doc.name,
                            "custom_service_no": service_info.service_no
                        },
                        limit=1
                    )
                    if existing_task:
                        continue  # Skip if task exists for this service_no
                    
                    # Create a new CRM Task
                    task = frappe.new_doc("CRM Task")
                    task.title = f"Service Reminder for {doc.customer_name} - Service {service_info.service_no}"
                    task.priority = "Medium"
                    task.start_date = nowdate()
                    task.due_date = nowdate()
                    task.reference_doctype = "Service Schedule"
                    task.reference_docname = doc.name
                    task.custom_customer = doc.customer
                    task.custom_customer_name = doc.customer_name
                    task.custom_service_schedule_id = doc.name
                    task.custom_sales_invoice_id = doc.sales_invoice_id
                    task.custom_service_no = service_info.service_no
                    task.status = "Todo"
                    task.description = (
                        f"Call customer {doc.customer_name} to remind about service #{service_info.service_no} "
                        f"scheduled for {service_info.scheduled_date} for vehicle {doc.vehicle_name}."
                    )
                    task.insert(ignore_permissions=True)
                    tasks_created += 1
                    logger.info(
                        f"Created CRM Task for Service Schedule {doc.name}, Service {service_info.service_no}"
                    )
            
        frappe.db.commit()
        
        # Show success message only if tasks were created and doc_name is specified (button click)
        if tasks_created > 0 and doc_name:
            frappe.msgprint(
                f"Successfully created {tasks_created} reminder task(s) for Service Schedule {doc_name}.",
                title="Success"
            )
        elif doc_name:
            frappe.msgprint(
                f"No new reminder tasks created for Service Schedule {doc_name}.",
                title="No Tasks Created"
            )
        elif tasks_created > 0:
            logger.info(f"Created {tasks_created} CRM Task(s) for Service Schedules in {'manual' if is_manual else 'daily'} run")
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(
            f"Error creating CRM Tasks in {'manual' if is_manual else 'daily'} mode for Service Schedule {doc_name or 'all'}: {str(e)}",
            "Service Schedule Task Scheduler"
        )
        if doc_name:
            frappe.msgprint(f"Failed to create CRM Tasks: {str(e)}", title="Scheduler Error")