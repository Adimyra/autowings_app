# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class RTORegistration(Document):
# 	pass

import frappe
from frappe.model.document import Document

class RTORegistration(Document):
    pass

@frappe.whitelist()
def create_rto_registration(sales_invoice):
    sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

    rto_doc = frappe.get_doc({
        "doctype": "RTO Registration",
        "customer": sales_doc.customer,
        "sales_invoice": sales_doc.name,
        "vehicle_sale": frappe.db.get_value("Vehicle Sale", {"sales_invoice": sales_invoice}, "name"),
        "rto_office": sales_doc.rto_office,
        "registration_fee": sales_doc.registration_fee,
        "registration_status": "Pending"
    })
    
    rto_doc.insert()
    return rto_doc.name
