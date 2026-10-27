import frappe

from autowings_app.site_context import update_context


def get_context(context):
	"""Fetch Landing Page data dynamically"""
	landing_page = frappe.get_all("Landing Page", fields=["*"], limit=1)
	context.landing_page = landing_page[0] if landing_page else frappe._dict()

	update_context(context)
	context.title = context.landing_page.heading or context.company.company_name
	return context
