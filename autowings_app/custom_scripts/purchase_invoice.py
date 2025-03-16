import frappe
import csv
import os
import io

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

    # Sync VIN table updates to Items table
    sync_vin_to_items(doc)

def before_submit(doc, method):
    """ Before Submit: Ensure all VIN fields are filled and assign serial numbers to items """
    for item in doc.get("items"):
        chassis_list = [vin.chassis_number for vin in doc.get("custom_vin") if vin.item == item.item_code]

        if not chassis_list or "" in chassis_list:
            frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

        item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers

    # Sync VIN data to Items table before final submission
    sync_vin_to_items(doc)

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

def sync_vin_to_items(doc):
    """ Sync custom_vin child table data to items table """
    if doc.custom_purchase_type != "Vehicle":
        return  # No need to sync for non-vehicle purchases

    # Clear items table before syncing
    doc.set("items", [])

    # Track unique items and their chassis numbers
    item_qty = {}
    item_serials = {}

    for vin in doc.get("custom_vin"):
        if vin.item not in item_qty:
            item_qty[vin.item] = 0
            item_serials[vin.item] = []

        item_qty[vin.item] += 1
        item_serials[vin.item].append(vin.chassis_number)

    # Add items back to the items table with correct quantity and serial_no
    for item_code, qty in item_qty.items():
        item_row = doc.append("items", {
            "item_code": item_code,
            "qty": qty,
            "serial_no": "\n".join(item_serials[item_code])  # Add all chassis numbers with line breaks
        })

    frappe.msgprint("Items table updated based on VIN details.")

    
import frappe
import csv
import os
import io

@frappe.whitelist()
def download_vin_csv(docname):
    """ Generates a CSV file with VIN details for a Purchase Invoice """
    doc = frappe.get_doc("Purchase Invoice", docname)
    
    # Prepare CSV headers
    header = ["item", "chassis_number", "engine_number", "vehicle_color", "manufacturing_date"]
    
    # Prepare data
    data = []
    for vin in doc.custom_vin:
        data.append([vin.item, vin.chassis_number, vin.engine_number, vin.vehicle_color, vin.manufacturing_date or ""])
    
    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)  # Write header
    writer.writerows(data)   # Write data

    return output.getvalue()


@frappe.whitelist()
def upload_vin_csv(docname, file_url):
    """ Uploads a CSV file and updates the VIN child table in the Purchase Invoice """
    doc = frappe.get_doc("Purchase Invoice", docname)
    
    # Ensure correct file path resolution
    if not file_url.startswith("/private/"):  
        file_url = "/private" + file_url  # Convert public URL to private path

    file_path = frappe.get_site_path(file_url.strip("/"))

    # Check if file exists before reading
    if not os.path.exists(file_path):
        frappe.throw(f"Uploaded file not found at {file_path}")

    # Read CSV file
    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.reader(file)
        headers = next(reader)  # Read the header row
        
        vin_data = list(reader)

    # Clear existing VIN table
    doc.set("custom_vin", [])

    # Insert new VIN data
    for row in vin_data:
        if len(row) < 5:
            continue  # Skip invalid rows

        item, chassis_number, engine_number, vehicle_color, manufacturing_date = row
        doc.append("custom_vin", {
            "item": item.strip(),
            "chassis_number": chassis_number.strip(),
            "engine_number": engine_number.strip(),
            "vehicle_color": vehicle_color.strip(),
            "manufacturing_date": manufacturing_date.strip() if manufacturing_date else None
        })

    doc.save(ignore_permissions=True)  # Save as draft
    frappe.db.commit()

    # Sync VIN data to Items table after upload
    sync_vin_to_items(doc)

    return "VIN Data Updated Successfully"

def sync_vin_to_items(doc):
    """ Sync custom_vin child table data to items table """
    if doc.custom_purchase_type != "Vehicle":
        return  # No need to sync for non-vehicle purchases

    # Clear items table before syncing
    doc.set("items", [])

    # Track unique items and their chassis numbers
    item_qty = {}
    item_serials = {}

    for vin in doc.get("custom_vin"):
        if vin.item not in item_qty:
            item_qty[vin.item] = 0
            item_serials[vin.item] = []

        item_qty[vin.item] += 1
        item_serials[vin.item].append(vin.chassis_number)

    # Add items back to the items table with correct quantity and serial_no
    for item_code, qty in item_qty.items():
        item_row = doc.append("items", {
            "item_code": item_code,
            "qty": qty,
            "serial_no": "\n".join(item_serials[item_code])  # Add all chassis numbers with line breaks
        })

    frappe.msgprint("Items table updated based on VIN details.")
