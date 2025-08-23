import frappe
from datetime import timedelta, datetime
import json

@frappe.whitelist()
def create_service_feedback_on_job_card_close(doc, method=None):
    """Create Service Feedback document when AW Job Card status is set to Close."""
    # If doc is a JSON string (from JS call), parse it to dict
    if isinstance(doc, str):
        try:
            doc = frappe._dict(json.loads(doc))
        except json.JSONDecodeError:
            frappe.log_error("Invalid JSON for doc in create_service_feedback_on_job_card_close", "Service Feedback Creation")
            return

    if doc.get("status") != "Close":
        return

    # Fetch the singleton Autowings Naming Series document
    naming_series = frappe.get_single("Autowings Naming Series")

    # Search for a matching feedback configuration based on sales_type (assuming "Service" for job cards)
    matching_feedback = next(
        (row for row in naming_series.get("feedback") if row.get("sales_type") == "Service"),
        None
    )
    if not matching_feedback:
        frappe.log_error("No matching feedback configuration for sales_type: Service", "Service Feedback Creation")
        return

    # Retrieve configuration details
    feedback_type = matching_feedback.get("feedback_type")  # e.g., "Service Feedback"
    trigger_days = matching_feedback.get("trigger_days") or 3  # Fallback to 3 days if not specified

    # Parse creation date or use a specific date if available (adjust based on your workflow)
    posting_date_str = doc.get("creation")[:10]  # Extract date from creation timestamp
    posting_date = datetime.strptime(posting_date_str, "%Y-%m-%d").date()

    # Prepare new Service Feedback document
    new_feedback = frappe.new_doc("Service Feedback")
    new_feedback.set("feedback_type", feedback_type)
    new_feedback.set("customer", doc.get("customer"))  # Assuming customer is linked in AW Job Card
    new_feedback.set("customer_name", doc.get("customer_name") or doc.get("customer"))  # Auto-fetch or default
    new_feedback.set("status", "Pending")
    new_feedback.set("feedback_active_date", posting_date + timedelta(days=trigger_days))
    new_feedback.set("job_card_id", doc.get("name"))  # Use job card ID as the name
    new_feedback.set("posting_date", posting_date_str)

    # Insert the document (remains in Draft)
    new_feedback.insert(ignore_permissions=True)
    frappe.msgprint(f"Service Feedback {new_feedback.name} created for Job Card {doc.get('name')}.")

def update_service_feedback_status():
    """Daily scheduler to activate pending Service Feedback documents on their active date."""
    today = date.today()

    # Query for pending feedbacks ready for activation
    pending_feedbacks = frappe.get_all(
        "Service Feedback",
        filters={
            "status": "Pending",
            "feedback_active_date": today
        },
        fields=["name"]
    )

    for feedback in pending_feedbacks:
        doc = frappe.get_doc("Service Feedback", feedback.name)
        doc.set("status", "Active")
        doc.save(ignore_permissions=True)
        frappe.msgprint(f"Service Feedback {doc.name} updated to Active on {today}.")