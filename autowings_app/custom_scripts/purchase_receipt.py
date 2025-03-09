import frappe

def before_save(doc, method):
    """ Automatically add rows in 'custom_vin' child table based on item quantity """
    existing_vins = {vin.item: vin for vin in doc.get("custom_vin")}

    for item in doc.get("items"):
        qty = int(item.qty)
        existing_count = len([vin for vin in doc.get("custom_vin") if vin.item == item.item_code])

        # Add missing VIN entries if not enough rows exist
        if existing_count < qty:
            for _ in range(qty - existing_count):
                doc.append("custom_vin", {
                    "item": item.item_code,
                    "chassis_number": "",  # Empty initially
                    "engine_number": "",
                    "vehicle_color": "",
                    "manufacturing_date": ""
                })

def before_submit(doc, method):
    """ Before Submit: Set Serial No field in items and create Serial No Documents """
    for item in doc.get("items"):
        chassis_list = [vin.chassis_number for vin in doc.get("custom_vin") if vin.item == item.item_code]

        if not chassis_list or "" in chassis_list:
            frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

        item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers



def on_submit(doc, method):
    """ After Submit: Update Serial No Docs with VIN Details """
    for vin in doc.get("custom_vin"):
        if frappe.db.exists("Serial No", vin.chassis_number):
            frappe.db.set_value("Serial No", vin.chassis_number, {
                "custom_chassis_number": vin.chassis_number,
                "custom_engine_number": vin.engine_number,
                "custom_vehicle_color": vin.vehicle_color,
                "custom_manufacturing_date": vin.manufacturing_date
            })
