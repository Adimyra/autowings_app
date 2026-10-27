import frappe

from autowings_app.site_context import update_context


def get_context(context):
	update_context(context)
	c = context.contact
	context.query_options = [o.strip() for o in (c.query_options or "").splitlines() if o.strip()]
	context.contact_lines = [
		", ".join(filter(None, [c.address_line1, c.address_line2])),
		", ".join(filter(None, [c.city, c.state])) + (f" {c.pincode}" if c.pincode else ""),
		c.country,
	]
	context.map_query = ", ".join(filter(None, [context.company.company_name, *context.contact_lines]))
	context.title = c.heading or "Contact us"
	return context
