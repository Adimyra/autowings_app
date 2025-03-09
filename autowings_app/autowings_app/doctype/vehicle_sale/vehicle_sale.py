# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class VehicleSale(Document):
	pass

@frappe.whitelist()
def create_vehicle_sale(sales_invoice):
    sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

    vehicle_sale = frappe.get_doc({
        "doctype": "Vehicle Sale",
        "customer": sales_doc.customer,
        "sales_invoice": sales_doc.name,
        "vehicle_model": sales_doc.items[0].item_code, 
        "chassis_number": sales_doc.custom_vehicle_details[0].chassis_number if sales_doc.custom_vehicle_details else "",
        "engine_number": sales_doc.custom_vehicle_details[0].engine_number if sales_doc.custom_vehicle_details else "",
        "vehicle_color": sales_doc.custom_vehicle_details[0].vehicle_color if sales_doc.custom_vehicle_details else "",
        "registration_status": "Pending",
        "insurance_status": "Pending",
        "finance_status": "Pending",
        "delivery_status": "Not Delivered"
    })
    
    vehicle_sale.insert()
    return vehicle_sale.name
