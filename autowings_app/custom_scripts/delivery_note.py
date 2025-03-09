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
                    "item": item.item_code
                })

def before_submit(doc, method):
    """ Before Submit: Set Serial No field in items and create Serial No Documents """
    for item in doc.get("items"):
        chassis_list = [vin.chassis_number for vin in doc.get("custom_vin") if vin.item == item.item_code]

        if not chassis_list or "" in chassis_list:
            frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

        item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers
