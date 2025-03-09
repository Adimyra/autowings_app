import frappe

def before_submit(doc, method):
    """ Ensure all chassis_number values in custom_vehicle_details are correctly mapped to items before submit """
    if doc.update_stock:
        for item in doc.get("items"):
            # Get all chassis numbers for the item from custom_vehicle_details
            chassis_list = [vin.chassis_number for vin in doc.get("custom_vehicle_details") if vin.item == item.item_code]

            if not chassis_list or "" in chassis_list:
                frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

            # Store multiple chassis numbers as serial_no in items table
            item.serial_no = "\n".join(chassis_list)  # Line-separated serial numbers
