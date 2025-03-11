# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class VehicleInsurance(Document):
# 	pass

# import frappe
# from frappe.model.document import Document

# class VehicleInsurance(Document):
#     pass

# @frappe.whitelist()
# def create_vehicle_insurance(sales_invoice):
#     sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

#     insurance_doc = frappe.get_doc({
#         "doctype": "Vehicle Insurance",
#         "customer": sales_doc.customer,
#         "vehicle_sale": sales_doc.name,
#         "insurance_provider": sales_doc.insurance_provider,
#         "insurance_policy_number": sales_doc.insurance_policy_number,
#         "insurance_status": "Active"
#     })
    
#     insurance_doc.insert()
#     return insurance_doc.name
import frappe
from frappe.model.document import Document

class VehicleInsurance(Document):
    pass

@frappe.whitelist()
def create_vehicle_insurance(sales_invoice, insurance_provider):
    """
    Create Vehicle Insurance from Sales Invoice
    """
    sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

    insurance_doc = frappe.get_doc({
        "doctype": "Vehicle Insurance",
        "customer": sales_doc.customer,
        "vehicle_sale": sales_doc.name,
        "insurance_provider": insurance_provider,  # Provider selected as input
        # "insurance_policy_number": sales_doc.insurance_policy_number,
        "insurance_status": "Applied"
    })
    
    insurance_doc.insert()
    
    frappe.msgprint(f"Vehicle Insurance {insurance_doc.name} Created Successfully")
    return insurance_doc.name
