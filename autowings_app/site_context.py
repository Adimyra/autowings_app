"""Shared context for the public Autowings website pages (header, footer, company details)."""

import re

import frappe


def update_context(context):
	settings = frappe.get_cached_doc("Website Settings")
	company = get_company()

	context.company = company
	context.address = get_address(company) or frappe._dict(full=settings.address)
	context.copyright = settings.copyright
	context.since = (re.search(r"\b(19|20)\d{2}\b", settings.copyright or "") or [None])[0]
	context.footer_links = [d for d in settings.footer_items if d.url and not d.parent_label]
	context.contact = frappe.get_cached_doc("Contact Us Settings")
	context.body_class = "aw-landing"
	context.no_cache = 1
	return context


def get_company():
	name = frappe.defaults.get_global_default("company") or frappe.db.get_value("Company", {}, "name")
	return frappe.db.get_value("Company", name, ["name", "company_name", "gstin", "phone_no", "email"], as_dict=True) or frappe._dict(company_name="Autowings")


def get_address(company):
	"""The company's own address from the desk (Address linked to the Company)."""
	addr = frappe.db.sql(
		"""select a.address_line1, a.address_line2, a.city, a.state, a.pincode, a.phone, a.email_id
		from `tabAddress` a join `tabDynamic Link` l on l.parent = a.name and l.parenttype = 'Address'
		where l.link_doctype = 'Company' and l.link_name = %s and a.disabled = 0
		order by a.is_primary_address desc, a.is_your_company_address desc limit 1""",
		company.name,
		as_dict=True,
	)
	if not addr:
		return None
	a = addr[0]
	a.street = ", ".join(filter(None, [a.address_line1, a.address_line2]))
	a.region = ", ".join(filter(None, [a.city, a.state])) + (f" {a.pincode}" if a.pincode else "")
	a.full = ", ".join(filter(None, [a.street, a.region]))
	return a


def website_context(context):
	"""`update_website_context` hook: give About and the published Web Pages (terms, privacy...)
	the Autowings header, footer and dark theme, keeping their content from the desk."""
	path = (context.get("path") or context.get("route") or getattr(frappe.local, "path", None) or "").strip("/")
	if not path or path not in themed_routes():
		return

	update_context(context)
	context.base_template_path = "templates/autowings_base.html"
	context.aw_doc = 1
	context.body_class = "aw-landing aw-doc"
	if path == "login":
		context.body_class = "aw-landing aw-login"
		context.logo = "/assets/autowings_app/images/autowings_logo_light.png"
		return

	doc = context.get("doc")
	title = (doc and doc.get("title")) or (context.get("title") or "").split(" - ")[-1]
	if not context.get("header") and title:
		context.header = (
			'<span class="aw-kicker">' + frappe.utils.escape_html(context.company.company_name) + "</span>"
			'<h1 class="aw-display aw-doc-title">' + frappe.utils.escape_html(title) + "</h1>"
		)


def themed_routes():
	routes = frappe.cache.get_value("autowings_themed_routes")
	if routes is None:
		routes = ["about", "login", *frappe.get_all("Web Page", {"published": 1}, pluck="route")]
		frappe.cache.set_value("autowings_themed_routes", routes, expires_in_sec=300)
	return routes
