import frappe

def get_context(context):
    """Fetch Landing Page data dynamically"""
    landing_page = frappe.get_all("Landing Page", fields=["*"])
    
    if landing_page:
        context.landing_page = landing_page[0]  # Fetch first record
    else:
        context.landing_page = None  # Handle case when no record exists

    return context
