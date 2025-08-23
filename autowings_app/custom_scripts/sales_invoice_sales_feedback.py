import frappe
from datetime import timedelta, date, datetime

def sales_invoice_after_submit(doc, method):
    """Create Sales Feedback document after Sales Invoice submission if matching criteria found."""
    if not doc.get("custom_sale_type"):
        return

    # Fetch the singleton Autowings Naming Series document
    naming_series = frappe.get_single("Autowings Naming Series")

    # Search for a matching feedback configuration based on sales type
    matching_feedback = next(
        (row for row in naming_series.get("feedback") if row.get("sales_type") == doc.custom_sale_type),
        None
    )
    if not matching_feedback:
        return  # No matching configuration, exit early

    # Retrieve configuration details
    feedback_type = matching_feedback.get("feedback_type")
    trigger_days = matching_feedback.get("trigger_days") or 3  # Fallback to 3 days if not specified

    # Parse posting_date string to date object
    posting_date_str = doc.get("posting_date")
    posting_date = datetime.strptime(posting_date_str, "%Y-%m-%d").date()

    # Prepare new Sales Feedback document
    new_feedback = frappe.new_doc("Sales Feedback")
    new_feedback.set("feedback_type", feedback_type)
    new_feedback.set("customer", doc.get("customer"))
    new_feedback.set("customer_name", doc.get("customer_name"))  # Typically auto-fetched in DocType
    # Assume the first item is the primary one; adjust if multi-item logic needed
    items = doc.get("items")
    new_feedback.set("item_code", items[0].get("item_code") if items else "")
    new_feedback.set("item_name", items[0].get("item_name") if items else "")  # Typically auto-fetched
    new_feedback.set("status", "Pending")
    new_feedback.set("feedback_active_date", posting_date + timedelta(days=trigger_days))
    new_feedback.set("sales_invoice", doc.get("name"))
    new_feedback.set("posting_date", posting_date_str)

    # Insert the document (remains in Draft; submit if required)
    new_feedback.insert(ignore_permissions=True)

    frappe.msgprint(f"Sales Feedback {new_feedback.name} created for invoice {doc.name}.")

def update_feedback_status():
    """Daily scheduler to activate pending Sales Feedback documents on their active date."""
    today = date.today()

    # Query for pending feedbacks ready for activation
    pending_feedbacks = frappe.get_all(
        "Sales Feedback",
        filters={
            "status": "Pending",
            "feedback_active_date": today
        },
        fields=["name"]
    )

    for feedback in pending_feedbacks:
        doc = frappe.get_doc("Sales Feedback", feedback.name)
        doc.set("status", "Active")
        doc.save(ignore_permissions=True)
        frappe.msgprint(f"Sales Feedback {doc.name} updated to Active on {today}.")