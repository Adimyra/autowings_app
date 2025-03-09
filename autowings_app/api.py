import frappe

@frappe.whitelist()
def get_serial_no_details(sales_invoice):
    sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
    vehicle_sale = frappe.get_doc("Vehicle Sale", {"sales_invoice": sales_invoice})

    return {
        "chassis_number": vehicle_sale.chassis_number,
        "engine_number": vehicle_sale.engine_number,
        "vehicle_color": vehicle_sale.vehicle_color
    }
