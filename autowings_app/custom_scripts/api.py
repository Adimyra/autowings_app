# import frappe
# from frappe.utils import nowdate, add_days, getdate
# import json

# @frappe.whitelist()
# def get_dashboard_counts(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)

#     leads = frappe.get_list('Lead', filters=[
#         ['lead_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name'])
#     lead_count = len(leads)

#     opportunities = frappe.get_list('Opportunity', filters=[
#         ['opportunity_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name'])
#     opp_count = len(opportunities)

#     quotations = frappe.get_list('Quotation', filters=[
#         ['transaction_date', 'between', [start_date, end_date]]
#     ], fields=['name', 'party_name', 'opportunity'])
#     user_leads = [l.name for l in frappe.get_list('Lead', filters=[['lead_owner', '=', user]], fields=['name'])]
#     user_opps = [o.name for o in frappe.get_list('Opportunity', filters=[['opportunity_owner', '=', user]], fields=['name'])]
#     valid_quotations = [q for q in quotations if (q.party_name in user_leads) or (q.opportunity in user_opps)]
#     quotation_count = len(valid_quotations)

#     return {
#         'leads': lead_count,
#         'opportunities': opp_count,
#         'quotations': quotation_count
#     }

# @frappe.whitelist()
# def get_leads(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('Lead', filters=[
#         ['lead_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name', 'lead_name', 'status', 'modified'])

# @frappe.whitelist()
# def get_opportunities(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('Opportunity', filters=[
#         ['opportunity_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name', 'title', 'status', 'modified'])

# @frappe.whitelist()
# def get_events(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('Event', filters=[
#         ['owner', '=', user],
#         ['starts_on', 'between', [start_date, end_date]]
#     ], fields=['name', 'subject', 'description', 'starts_on', 'status'])

# def get_date_range(filter_type, date_range):
#     today = nowdate()
#     if filter_type == 'today':
#         return today, today
#     elif filter_type == 'yesterday':
#         return add_days(today, -1), add_days(today, -1)
#     elif filter_type == 'weekly':
#         return add_days(today, -7), today
#     elif filter_type == 'monthly':
#         return add_days(today, -30), today
#     elif filter_type == 'date-range' and date_range:
#         # Handle if date_range is a string (from JSON)
#         if isinstance(date_range, str):
#             date_range = json.loads(date_range)
#         return date_range['start'], date_range['end']
#     return add_days(today, -30), today  # Default to monthly


# @frappe.whitelist()
# def get_activities_for_doc(docname, doctype):
#     # Get open events
#     events = frappe.get_all('Event', filters={
#         'reference_type': doctype,
#         'reference_name': docname,
#         'status': 'Open'
#     }, fields=['name', 'subject', 'starts_on'])

#     # Get open tasks (ToDo)
#     todos = frappe.get_all('ToDo', filters={
#         'reference_type': doctype,
#         'reference_name': docname,
#         'status': 'Open',
#         'allocated_to': frappe.session.user
#     }, fields=['name', 'description', 'date'])

#     return {
#         'events': events,
#         'tasks': todos
#     }

# 3rd -----------

# import frappe
# from frappe.utils import nowdate, add_days, getdate, get_datetime
# import json
# import logging

# # Set up logging for debugging
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# @frappe.whitelist()
# def get_dashboard_counts(user, filter_type, date_range=None, lead_status_filter=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     logger.debug(f"Dashboard Counts - Filter: {filter_type}, Date Range: {start_date} to {end_date}, Lead Status Filter: {lead_status_filter}")

#     # Filter leads by status if lead_status_filter is provided
#     lead_filters = [
#         ['lead_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ]
#     if lead_status_filter:
#         lead_filters.append(['status', 'in', lead_status_filter])

#     leads = frappe.get_list('Lead', filters=lead_filters, fields=['name', 'status', 'creation'])
#     lead_count = len(leads)
#     logger.debug(f"Found {lead_count} leads: {leads}")

#     opportunities = frappe.get_list('Opportunity', filters=[
#         ['opportunity_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name'])
#     opp_count = len(opportunities)

#     quotations = frappe.get_list('Quotation', filters=[
#         ['transaction_date', 'between', [start_date, end_date]]
#     ], fields=['name', 'party_name', 'opportunity'])
#     user_leads = [l.name for l in frappe.get_list('Lead', filters=[['lead_owner', '=', user]], fields=['name'])]
#     user_opps = [o.name for o in frappe.get_list('Opportunity', filters=[['opportunity_owner', '=', user]], fields=['name'])]
#     valid_quotations = [q for q in quotations if (q.party_name in user_leads) or (q.opportunity in user_opps)]
#     quotation_count = len(valid_quotations)

#     events = frappe.get_list('Event', filters=[
#         ['owner', '=', user],
#         ['status', '=', 'Open'],
#         ['starts_on', 'between', [start_date, end_date]]
#     ], fields=['name'])
#     event_count = len(events)

#     tasks = frappe.get_list('ToDo', filters=[
#         ['allocated_to', '=', user],
#         ['status', '=', 'Open'],
#         ['reference_type', 'in', ['Opportunity', 'Lead']],
#         ['date', 'between', [start_date, end_date]]
#     ], fields=['name'])
#     task_count = len(tasks)

#     return {
#         'leads': lead_count,
#         'opportunities': opp_count,
#         'quotations': quotation_count,
#         'events': event_count,
#         'tasks': task_count
#     }

# @frappe.whitelist()
# def get_leads(user, filter_type, date_range=None, status_filter=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     logger.debug(f"Get Leads - Filter: {filter_type}, Date Range: {start_date} to {end_date}, Status Filter: {status_filter}")

#     filters = [
#         ['lead_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ]
#     if status_filter:
#         filters.append(['status', 'in', status_filter])  # Filter leads by status
#         logger.debug(f"Applying status filter: {status_filter}")

#     leads = frappe.get_list('Lead', filters=filters, fields=['name', 'lead_name', 'status', 'creation', 'modified'])
#     logger.debug(f"Retrieved leads: {leads}")
#     return leads

# @frappe.whitelist()
# def get_opportunities(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('Opportunity', filters=[
#         ['opportunity_owner', '=', user],
#         ['creation', 'between', [start_date, end_date]]
#     ], fields=['name', 'title', 'status', 'modified'])

# @frappe.whitelist()
# def get_events(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('Event', filters=[
#         ['owner', '=', user],
#         ['starts_on', 'between', [start_date, end_date]]
#     ], fields=['name', 'subject', 'description', 'starts_on', 'status'])

# @frappe.whitelist()
# def get_tasks(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     return frappe.get_list('ToDo', filters=[
#         ['allocated_to', '=', user],
#         ['reference_type', 'in', ['Opportunity', 'Lead']],
#         ['date', 'between', [start_date, end_date]]
#     ], fields=['name', 'description', 'date', 'status', 'reference_type'])

# @frappe.whitelist()
# def get_related_items(reference_name, item_type):
#     if item_type == 'events':
#         event_participants = frappe.get_list('Event Participants', filters=[
#             ['reference_docname', '=', reference_name]
#         ], fields=['parent'])
#         event_ids = [ep.parent for ep in event_participants if ep.parent]
#         return frappe.get_list('Event', filters=[
#             ['name', 'in', event_ids],
#             ['status', '=', 'Open']
#         ], fields=['name', 'subject', 'starts_on', 'status'])
#     elif item_type == 'tasks':
#         return frappe.get_list('ToDo', filters=[
#             ['reference_name', '=', reference_name],
#             ['status', '=', 'Open'],
#             ['reference_type', 'in', ['Opportunity', 'Lead']]
#         ], fields=['name', 'description', 'date', 'status'])
#     return []

# @frappe.whitelist()
# def get_upcoming_tasks(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     today = getdate()
#     tasks = frappe.get_list('ToDo', filters=[
#         ['allocated_to', '=', user],
#         ['status', '=', 'Open'],
#         ['reference_type', 'in', ['Opportunity', 'Lead']],
#         ['date', '>=', today],
#         ['date', 'between', [start_date, end_date]]
#     ], fields=['name', 'description', 'date', 'status'], order_by='date asc')
#     return tasks

# @frappe.whitelist()
# def get_upcoming_events(user, filter_type, date_range=None):
#     start_date, end_date = get_date_range(filter_type, date_range)
#     today = getdate()
#     events = frappe.get_list('Event', filters=[
#         ['owner', '=', user],
#         ['status', '=', 'Open'],
#         ['starts_on', '>=', today],
#         ['starts_on', 'between', [start_date, end_date]]
#     ], fields=['name', 'subject', 'starts_on', 'status'], order_by='starts_on asc')
#     return events

# @frappe.whitelist()
# def create_lead(**kwargs):
#     try:
#         doc = frappe.get_doc({
#             'doctype': 'Lead',
#             'first_name': kwargs.get('first_name'),
#             'middle_name': kwargs.get('middle_name'),
#             'last_name': kwargs.get('last_name'),
#             'lead_name': kwargs.get('lead_name'),
#             'gender': kwargs.get('gender'),
#             'source': kwargs.get('source'),
#             'status': kwargs.get('status'),
#             'email_id': kwargs.get('email_id'),
#             'mobile_no': kwargs.get('mobile_no'),
#             'city': kwargs.get('city'),
#             'state': kwargs.get('state'),
#             'custom_area': kwargs.get('area'),
#             'country': kwargs.get('country', 'India'),
#             'company': kwargs.get('company', 'Autowings Dev'),
#             'lead_owner': kwargs.get('lead_owner')
#         })
#         doc.insert()
#         return True
#     except Exception as e:
#         frappe.log_error(f"Error creating lead: {str(e)}")
#         return False

# @frappe.whitelist()
# def get_lead_sources():
#     return frappe.get_list('Lead Source', fields=['name'])

# def get_date_range(filter_type, date_range):
#     today = nowdate()
#     if filter_type == 'today':
#         return today, today
#     elif filter_type == 'yesterday':
#         return add_days(today, -1), add_days(today, -1)
#     elif filter_type == 'weekly':
#         return add_days(today, -7), today
#     elif filter_type == 'monthly':
#         return add_days(today, -30), today
#     elif filter_type == 'date-range' and date_range:
#         if isinstance(date_range, str):
#             date_range = json.loads(date_range)
#         return date_range['start'], date_range['end']
#     return add_days(today, -30), today  # Default to monthly

import frappe
from frappe.utils import nowdate, add_days, getdate, get_datetime
import json
import logging

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@frappe.whitelist()
def get_dashboard_counts(user, filter_type, date_range=None, lead_status_filter=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    logger.debug(f"Dashboard Counts - Filter: {filter_type}, Date Range: {start_date} to {end_date}, Lead Status Filter: {lead_status_filter}")

    # Filter leads by status "Lead" or "Open" specifically for dashboard
    lead_filters = [
        ['lead_owner', '=', user],
        ['creation', 'between', [start_date, end_date]],
        ['status', 'in', ['Lead', 'Open']]  # Only count leads with status "Lead" or "Open"
    ]

    leads = frappe.get_list('Lead', filters=lead_filters, fields=['name', 'status', 'creation'])
    lead_count = len(leads)
    logger.debug(f"Found {lead_count} leads: {leads}")

    opportunities = frappe.get_list('Opportunity', filters=[
        ['opportunity_owner', '=', user],
        ['creation', 'between', [start_date, end_date]]
    ], fields=['name'])
    opp_count = len(opportunities)

    quotations = frappe.get_list('Quotation', filters=[
        ['transaction_date', 'between', [start_date, end_date]]
    ], fields=['name', 'party_name', 'opportunity'])
    user_leads = [l.name for l in frappe.get_list('Lead', filters=[['lead_owner', '=', user], ['status', 'in', ['Lead', 'Open']]], fields=['name'])]
    user_opps = [o.name for o in frappe.get_list('Opportunity', filters=[['opportunity_owner', '=', user]], fields=['name'])]
    valid_quotations = [q for q in quotations if (q.party_name in user_leads) or (q.opportunity in user_opps)]
    quotation_count = len(valid_quotations)

    events = frappe.get_list('Event', filters=[
        ['owner', '=', user],
        ['status', '=', 'Open'],  # Only count events with "Open" status
        ['starts_on', 'between', [start_date, end_date]]
    ], fields=['name'])
    event_count = len(events)

    tasks = frappe.get_list('ToDo', filters=[
        ['allocated_to', '=', user],
        ['status', '=', 'Open'],
        ['reference_type', 'in', ['Opportunity', 'Lead']],
        ['date', 'between', [start_date, end_date]]
    ], fields=['name'])
    task_count = len(tasks)

    return {
        'leads': lead_count,
        'opportunities': opp_count,
        'quotations': quotation_count,
        'events': event_count,
        'tasks': task_count
    }

@frappe.whitelist()
def get_leads(user, filter_type, date_range=None, status_filter=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    logger.debug(f"Get Leads - Filter: {filter_type}, Date Range: {start_date} to {end_date}, Status Filter: {status_filter}")

    # Default to only fetching leads with status "Lead" or "Open" if no status_filter is provided
    if status_filter is None:
        status_filter = ['Lead', 'Open']

    filters = [
        ['lead_owner', '=', user],
        ['creation', 'between', [start_date, end_date]],
        ['status', 'in', status_filter]  # Only fetch leads with status "Lead" or "Open"
    ]
    logger.debug(f"Applying status filter: {status_filter}")

    leads = frappe.get_list('Lead', filters=filters, fields=['name', 'lead_name', 'status', 'creation', 'modified'])
    logger.debug(f"Retrieved leads: {leads}")
    return leads

@frappe.whitelist()
def get_opportunities(user, filter_type, date_range=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    return frappe.get_list('Opportunity', filters=[
        ['opportunity_owner', '=', user],
        ['creation', 'between', [start_date, end_date]]
    ], fields=['name', 'title', 'status', 'modified'])

@frappe.whitelist()
def get_events(user, filter_type, date_range=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    return frappe.get_list('Event', filters=[
        ['owner', '=', user],
        ['status', '=', 'Open'],  # Only fetch events with "Open" status
        ['starts_on', 'between', [start_date, end_date]]
    ], fields=['name', 'subject', 'description', 'starts_on', 'status'])

@frappe.whitelist()
def get_tasks(user, filter_type, date_range=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    return frappe.get_list('ToDo', filters=[
        ['allocated_to', '=', user],
        ['status', '=', 'Open'],
        ['reference_type', 'in', ['Opportunity', 'Lead']],
        ['date', 'between', [start_date, end_date]]
    ], fields=['name', 'description', 'date', 'status', 'reference_type'])

@frappe.whitelist()
def get_related_items(reference_name, item_type):
    if item_type == 'events':
        event_participants = frappe.get_list('Event Participants', filters=[
            ['reference_docname', '=', reference_name]
        ], fields=['parent'])
        event_ids = [ep.parent for ep in event_participants if ep.parent]
        return frappe.get_list('Event', filters=[
            ['name', 'in', event_ids],
            ['status', '=', 'Open']  # Only fetch events with "Open" status
        ], fields=['name', 'subject', 'starts_on', 'status'])
    elif item_type == 'tasks':
        return frappe.get_list('ToDo', filters=[
            ['reference_name', '=', reference_name],
            ['status', '=', 'Open'],
            ['reference_type', 'in', ['Opportunity', 'Lead']]
        ], fields=['name', 'description', 'date', 'status'])
    return []

@frappe.whitelist()
def get_upcoming_tasks(user, filter_type, date_range=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    today = getdate()
    tasks = frappe.get_list('ToDo', filters=[
        ['allocated_to', '=', user],
        ['status', '=', 'Open'],
        ['reference_type', 'in', ['Opportunity', 'Lead']],
        ['date', '>=', today],
        ['date', 'between', [start_date, end_date]]
    ], fields=['name', 'description', 'date', 'status'], order_by='date asc')
    return tasks

@frappe.whitelist()
def get_upcoming_events(user, filter_type, date_range=None):
    start_date, end_date = get_date_range(filter_type, date_range)
    today = getdate()
    events = frappe.get_list('Event', filters=[
        ['owner', '=', user],
        ['status', '=', 'Open'],  # Only fetch events with "Open" status
        ['starts_on', '>=', today],
        ['starts_on', 'between', [start_date, end_date]]
    ], fields=['name', 'subject', 'starts_on', 'status'], order_by='starts_on asc')
    return events

@frappe.whitelist()
def create_lead(**kwargs):
    try:
        doc = frappe.get_doc({
            'doctype': 'Lead',
            'first_name': kwargs.get('first_name'),
            'middle_name': kwargs.get('middle_name'),
            'last_name': kwargs.get('last_name'),
            'lead_name': kwargs.get('lead_name'),
            'gender': kwargs.get('gender'),
            'source': kwargs.get('source'),
            'status': kwargs.get('status'),
            'email_id': kwargs.get('email_id'),
            'mobile_no': kwargs.get('mobile_no'),
            'city': kwargs.get('city'),
            'state': kwargs.get('state'),
            'custom_area': kwargs.get('area'),
            'country': kwargs.get('country', 'India'),
            'company': kwargs.get('company', 'Autowings'),
            'lead_owner': kwargs.get('lead_owner')
        })
        doc.insert()
        return True
    except Exception as e:
        frappe.log_error(f"Error creating lead: {str(e)}")
        return False

@frappe.whitelist()
def get_lead_sources():
    return frappe.get_list('Lead Source', fields=['name'])

def get_date_range(filter_type, date_range):
    today = nowdate()
    if filter_type == 'today':
        return today, today
    elif filter_type == 'yesterday':
        return add_days(today, -1), add_days(today, -1)
    elif filter_type == 'weekly':
        return add_days(today, -7), today
    elif filter_type == 'monthly':
        return add_days(today, -30), today
    elif filter_type == 'date-range' and date_range:
        if isinstance(date_range, str):
            date_range = json.loads(date_range)
        return date_range['start'], date_range['end']
    return add_days(today, -30), today  # Default to monthly



# udpate document flag due documents submission to dto

def update_due_documents_flag(doc, method):
    if (
        doc.status == "Due Documents Submission to DTO"
        or doc.registration_status == "Due Documents Submission to DTO"
    ):
        doc.due_documents_flag = 1
    else:
        doc.due_documents_flag = 0