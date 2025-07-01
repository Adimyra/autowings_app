# Copyright (c) 2025, Magvibe and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import cint
from frappe.model.document import Document
from frappe import whitelist

def get_context(context):
    # You can add custom context variables here if needed
    context.title = _('ADI CRM')
    return context

@frappe.whitelist()
def get_leads(limit=10, name_filter=None):
    limit = cint(limit)
    filters = {}
    if name_filter and name_filter.strip():
        filters['lead_name'] = ["like", f"%{name_filter.strip()}%"]
    leads = frappe.get_all(
        'Lead',
        fields=['name', 'lead_name', 'email_id', 'status', 'phone'],
        filters=filters if filters else None,
        limit_page_length=limit
    )
    return leads

@frappe.whitelist()
def add_lead(lead_name, phone, email_id=None):
    doc = frappe.get_doc({
        'doctype': 'Lead',
        'lead_name': lead_name,
        'phone': phone,
        'email_id': email_id or ''
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def get_customers(limit=20, name_filter=None):
    limit = cint(limit)
    filters = {}
    if name_filter and name_filter.strip():
        filters['customer_name'] = ["like", f"%{name_filter.strip()}%"]
    customers = frappe.get_all(
        'Customer',
        fields=['name', 'customer_name', 'mobile_no', 'email_id'],
        filters=filters if filters else None,
        limit_page_length=limit
    )
    return customers

@frappe.whitelist()
def add_customer(customer_name, mobile_no, email_id=None):
    doc = frappe.get_doc({
        'doctype': 'Customer',
        'customer_name': customer_name,
        'mobile_no': mobile_no,
        'email_id': email_id or ''
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def get_my_day_tasks():
    """Return today's tasks (priority, agenda) for the current user."""
    user = frappe.session.user
    today = frappe.utils.nowdate()
    # Example: Fetch from a custom Task doctype or ToDo
    tasks = frappe.get_all(
        'ToDo',
        fields=['name', 'description', 'status', 'reference_type', 'reference_name', 'date', 'priority'],
        filters={
            'owner': user,
            'date': today
        },
        order_by='priority desc, creation asc'
    )
    # Agenda: Example, fetch events for today
    agenda = frappe.get_all(
        'Event',
        fields=['name', 'subject', 'starts_on', 'ends_on', 'event_type'],
        filters={
            'starts_on': ["between", [today + ' 00:00:00', today + ' 23:59:59']],
            'owner': user
        },
        order_by='starts_on asc'
    )
    return {'tasks': tasks, 'agenda': agenda}

@frappe.whitelist()
def add_task(description, priority='Medium', date=None):
    user = frappe.session.user
    doc = frappe.get_doc({
        'doctype': 'ToDo',
        'description': description,
        'priority': priority,
        'date': date or frappe.utils.nowdate(),
        'owner': user
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def update_task_status(task_id, status):
    doc = frappe.get_doc('ToDo', task_id)
    doc.status = status
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def get_leads_to_follow_up():
    # Example: Open leads assigned to user, status not converted/lost
    user = frappe.session.user
    leads = frappe.get_all(
        'Lead',
        fields=['name', 'lead_name', 'status', 'email_id', 'phone', 'company_name'],
        filters={
            'status': ['not in', ['Converted', 'Lost']],
            'owner': user
        },
        order_by='creation desc',
        limit_page_length=10
    )
    return leads

@frappe.whitelist()
def get_events_for_calendar():
    """Return all events for the current month for the calendar view."""
    user = frappe.session.user
    today = frappe.utils.nowdate()
    year = frappe.utils.getdate(today).year
    month = frappe.utils.getdate(today).month
    month_start = f"{year}-{month:02d}-01 00:00:00"
    if month == 12:
        next_month_start = f"{year+1}-01-01 00:00:00"
    else:
        next_month_start = f"{year}-{month+1:02d}-01 00:00:00"
    events = frappe.get_all(
        'Event',
        fields=['name', 'subject', 'starts_on', 'description'],
        filters={
            'starts_on': ["between", [month_start, next_month_start]],
            'owner': user
        },
        order_by='starts_on asc'
    )
    return events

@frappe.whitelist()
def add_event(subject, starts_on, description=None):
    user = frappe.session.user
    doc = frappe.get_doc({
        'doctype': 'Event',
        'subject': subject,
        'starts_on': starts_on,
        'description': description or '',
        'owner': user,
        'event_type': 'Public',
        'status': 'Open'
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def get_dashboard_stats(from_date=None, to_date=None):
    """Return dashboard stats: open/converted/closed leads, total customers, lead status counts, customer growth, all date-range aware."""
    import datetime
    user = frappe.session.user
    # Date range logic
    if not from_date or not to_date:
        today = frappe.utils.getdate()
        from_date = today
        to_date = today
    else:
        from_date = frappe.utils.getdate(from_date)
        to_date = frappe.utils.getdate(to_date)
    # Lead counts by status in range
    lead_filters = {'owner': user, 'creation': ['between', [from_date, to_date]]}
    open_leads = frappe.db.count('Lead', {**lead_filters, 'status': 'Open'})
    converted_leads = frappe.db.count('Lead', {**lead_filters, 'status': 'Converted'})
    closed_leads = frappe.db.count('Lead', {**lead_filters, 'status': 'Closed'})
    all_leads = frappe.get_all('Lead', fields=['status'], filters=lead_filters)
    lead_status_counts = {}
    for lead in all_leads:
        status = lead.status or 'Unknown'
        lead_status_counts[status] = lead_status_counts.get(status, 0) + 1
    # Customer count (NOT filtered by date)
    total_customers = frappe.db.count('Customer', {'owner': user})
    # Customer growth chart (last 6 months, still date-filtered for chart)
    today = frappe.utils.getdate()
    customer_growth_labels = []
    customer_growth_data = []
    for i in range(5, -1, -1):
        month_start = (today.replace(day=1) - datetime.timedelta(days=30*i)).replace(day=1)
        month_end = (month_start.replace(day=28) + datetime.timedelta(days=4)).replace(day=1) - datetime.timedelta(days=1)
        label = month_start.strftime('%b %Y')
        customer_growth_labels.append(label)
        count = frappe.db.count('Customer', {
            'owner': user,
            'creation': ['between', [month_start.strftime('%Y-%m-%d'), month_end.strftime('%Y-%m-%d')]]
        })
        customer_growth_data.append(count)
    return {
        'open_leads': open_leads,
        'converted_leads': converted_leads,
        'closed_leads': closed_leads,
        'total_customers': total_customers,
        'lead_status_counts': lead_status_counts,
        'customer_growth_labels': customer_growth_labels,
        'customer_growth_data': customer_growth_data
    }