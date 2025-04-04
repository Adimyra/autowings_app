# autowings_app/custom_scripts/adi_crm_dashboard.py

import frappe
from frappe.utils import getdate, add_days, get_first_day, get_last_day

@frappe.whitelist()
def get_dashboard_data(range="monthly"):
    """
    Fetch dashboard data based on the selected date range.
    Args:
        range (str): 'today', 'yesterday', 'weekly', 'monthly', or 'custom'
    Returns:
        dict: Counts of leads, opportunities, quotations, customers, invoices, tasks, and goal progress
    """
    # Initialize filters based on date range
    filters = {}
    if range == "today":
        filters = {"creation": ["between", [getdate(), getdate()]]}
    elif range == "yesterday":
        yesterday = add_days(getdate(), -1)
        filters = {"creation": ["between", [yesterday, yesterday]]}
    elif range == "weekly":
        start = add_days(getdate(), -7)
        filters = {"creation": ["between", [start, getdate()]]}
    elif range == "monthly":
        start = get_first_day(getdate())
        end = get_last_day(getdate())
        filters = {"creation": ["between", [start, end]]}

    # Fetch counts
    new_leads = frappe.get_list("Lead", filters=filters, fields=["count(*) as total"], as_list=True)[0][0] or 0
    opportunities = frappe.get_list("Opportunity", filters=filters, fields=["count(*) as total"], as_list=True)[0][0] or 0
    quotations = frappe.get_list("Quotation", filters=filters, fields=["count(*) as total"], as_list=True)[0][0] or 0
    new_customers = frappe.get_list("Customer", filters=filters, fields=["count(*) as total"], as_list=True)[0][0] or 0
    sent_invoices = frappe.get_list("Sales Invoice", filters={"docstatus": 1, **filters}, fields=["count(*) as total"], as_list=True)[0][0] or 0
    current_tasks = frappe.get_list("ToDo", filters={"status": "Open"}, fields=["count(*) as total"], as_list=True)[0][0] or 0

    # Example goal calculation: $100 per lead + $50 per opportunity
    goal_achieved = new_leads * 100 + opportunities * 50

    # Return data
    return {
        "new_leads": new_leads,
        "opportunities": opportunities,
        "quotations": quotations,
        "new_customers": new_customers,
        "sent_invoices": sent_invoices,
        "current_tasks": current_tasks,
        "goal_achieved": goal_achieved
    }