import frappe
import csv
import os
import io

# def before_save(doc, method):
#     """ Automatically add rows in 'custom_vin' child table based on item quantity """
#     existing_vins = {vin.item: vin for vin in doc.get("custom_vin")}

#     for item in doc.get("items"):
#         qty = int(item.qty)
#         existing_count = len([vin for vin in doc.get("custom_vin") if vin.item == item.item_code])

#         # Add missing VIN entries if not enough rows exist
#         if existing_count < qty:
#             for _ in range(qty - existing_count):
#                 doc.append("custom_vin", {
#                     "item": item.item_code,
#                     "chassis_number": "",  # Empty initially
#                     "engine_number": "",
#                     "vehicle_color": "",
#                     "manufacturing_date": ""
#                 })

#     # Sync VIN table updates to Items table
#     sync_vin_to_items(doc)

def before_submit(doc, method):
    """ Before Submit: Ensure all VIN fields are filled and assign serial numbers to items """
    for item in doc.get("items"):
        chassis_list = [vin.chassis_number for vin in doc.get("custom_vin") if vin.item == item.item_code]

        if not chassis_list or "" in chassis_list:
            frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

        item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers

    # Sync VIN data to Items table before final submission
    sync_vin_to_items(doc)

# def on_submit(doc, method):
#     """ After Submit: Update Serial No Docs with VIN Details """
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             frappe.db.set_value("Serial No", vin.chassis_number, {
#                 "custom_chassis_number": vin.chassis_number,
#                 "custom_engine_number": vin.engine_number,
#                 "custom_vehicle_color": vin.vehicle_color,
#                 "custom_manufacturing_date": vin.manufacturing_date
#             })

import frappe

def on_submit(doc, method):
    """ After Submit: Update newly created Serial No docs with details from custom_vin """
    
    frappe.enqueue(update_serial_nos_after_submission, queue="short", doc_name=doc.name)

def update_serial_nos_after_submission(doc_name):
    """ Enqueue this function to ensure Serial Nos are updated after they are created """
    doc = frappe.get_doc("Purchase Invoice", doc_name)

    for vin in doc.get("custom_vin"):
        if frappe.db.exists("Serial No", vin.chassis_number):
            # ✅ Update the existing Serial No (created by Purchase Invoice)
            frappe.db.set_value("Serial No", vin.chassis_number, {
                "custom_engine_number": vin.engine_number,
                "custom_vehicle_color": vin.vehicle_color,
                "custom_manufacturing_date": vin.manufacturing_date
            })
            frappe.msgprint(f"✅ Updated Serial No {vin.chassis_number} with VIN details.")
        else:
            frappe.msgprint(f"⚠️ Serial No {vin.chassis_number} not found. Try refreshing after a few seconds.")

    frappe.db.commit()



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

import frappe
import csv
import io

@frappe.whitelist()
def download_blank_vin_csv():
    """Generates a blank CSV file with predefined headers for VIN data"""
    
    # Predefined CSV Headers
    header = ["item", "chassis_number", "engine_number", "vehicle_color", "manufacturing_date"]
    
    # Generate CSV in memory (only headers, no data)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)  # Write only the header row

    return output.getvalue()


import frappe
import csv
import os
import json

@frappe.whitelist()
def upload_vin_csv(doc, file_url):
    """ Uploads a CSV file and updates the VIN child table in the Purchase Invoice """
    doc = json.loads(doc)  # Convert JSON string to dictionary
    purchase_invoice = frappe.get_doc(doc)  # Create a Frappe document object

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
    purchase_invoice.custom_vin = []  # Reset VIN table manually

    # Insert new VIN data
    for row in vin_data:
        if len(row) < 5:
            continue  # Skip invalid rows

        item, chassis_number, engine_number, vehicle_color, manufacturing_date = row
        purchase_invoice.append("custom_vin", {
            "item": item.strip(),
            "chassis_number": chassis_number.strip(),
            "engine_number": engine_number.strip(),
            "vehicle_color": vehicle_color.strip(),
            "manufacturing_date": manufacturing_date.strip() if manufacturing_date else None
        })

    # Sync VIN data to Items table after upload
    sync_vin_to_items(purchase_invoice)

    return {"message": "VIN Data Updated Successfully", "doc": purchase_invoice}


import frappe
import csv
import os
import json

@frappe.whitelist()
def upload_vin_csv_temp(doc, file_url):
    doc = json.loads(doc)
    purchase_invoice = frappe.get_doc(doc)

    # Resolve file path
    if not file_url.startswith("/private/"):
        file_url = "/private" + file_url
    file_path = frappe.get_site_path(file_url.strip("/"))

    if not os.path.exists(file_path):
        frappe.throw(f"Uploaded file not found at {file_path}")

    # Read CSV
    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.reader(file)
        headers = next(reader)
        vin_data = list(reader)

    new_vins = []
    duplicate_chassis = []
    duplicate_engine = []

    for row in vin_data:
        if len(row) < 5:
            continue

        item, chassis, engine, color, mfg_date = [val.strip() for val in row]

        # Check for duplicates
        if frappe.db.exists("Serial No", {"name": chassis}):
            duplicate_chassis.append(chassis)
        if frappe.db.exists("Serial No", {"custom_engine_number": engine}):
            duplicate_engine.append(engine)

        new_vins.append({
            "item": item,
            "chassis_number": chassis,
            "engine_number": engine,
            "vehicle_color": color,
            "manufacturing_date": mfg_date or None
        })

    # # Show error if duplicates found
    # if duplicate_chassis or duplicate_engine:
    #     msg = ""
    #     if duplicate_chassis:
    #         msg += f"🚫 Duplicate Chassis Numbers: {', '.join(duplicate_chassis)}<br>"
    #     if duplicate_engine:
    #         msg += f"🚫 Duplicate Engine Numbers: {', '.join(duplicate_engine)}"
    #     return {"error": msg}

    if duplicate_chassis or duplicate_engine:
        msg = '<div style="margin-bottom:10px;">'
        msg += """
            <table class="table table-bordered" style="margin-bottom:10px;">
                <thead>
                    <tr>
                        <th>🚗 Duplicate Chassis Number</th>
                        <th>🛠️ Duplicate Engine Number</th>
                    </tr>
                </thead>
                <tbody>
        """

        copy_lines = ["Chassis Number\tEngine Number"]
        max_len = max(len(duplicate_chassis), len(duplicate_engine))

        for i in range(max_len):
            chassis_val = duplicate_chassis[i] if i < len(duplicate_chassis) else ""
            engine_val = duplicate_engine[i] if i < len(duplicate_engine) else ""

            # If chassis_val exists, convert it to a clickable link
            if chassis_val:
                chassis_link = f'<a href="/app/serial-no/{chassis_val}" target="_blank">{chassis_val}</a>'
            else:
                chassis_link = ""

            msg += f"<tr><td>{chassis_link}</td><td>{engine_val}</td></tr>"
            copy_lines.append(f"{chassis_val}\t{engine_val}")

        msg += "</tbody></table>"

        full_copy_text = "\n".join(copy_lines)

        msg += f"""
            <div style="text-align: right;">
                <button class="btn btn-sm btn-primary"
                        onclick="navigator.clipboard.writeText(`{full_copy_text}`); frappe.show_alert('Copied to clipboard!')">
                    📋 Copy
                </button>
            </div>
        </div>
        """

        return {"error": msg}




    # Set VIN table
    purchase_invoice.set("custom_vin", [])
    for vin in new_vins:
        purchase_invoice.append("custom_vin", vin)

    # Sync to items
    sync_vin_to_items(purchase_invoice)

    return {"validated_doc": purchase_invoice}


def sync_vin_to_items(doc):
    """Update Items table based on VIN entries"""
    if doc.custom_purchase_type != "Vehicle":
        return

    doc.set("items", [])  # Clear existing

    item_qty = {}
    item_serials = {}

    for vin in doc.custom_vin:
        item = vin.item
        item_qty.setdefault(item, 0)
        item_serials.setdefault(item, [])
        item_qty[item] += 1
        item_serials[item].append(vin.chassis_number)

    for item_code, qty in item_qty.items():
        item_doc = frappe.get_doc("Item", item_code) if frappe.db.exists("Item", item_code) else None
        item_name = item_doc.item_name if item_doc else "Unknown Item"
        uom = item_doc.stock_uom if item_doc else "Nos"

        doc.append("items", {
            "item_code": item_code,
            "item_name": item_name,
            "uom": uom,
            "qty": qty,
            "serial_no": "\n".join(item_serials[item_code])
        })


# def sync_vin_to_items(doc):
#     """ Sync custom_vin child table data to items table with Item Name & UOM """
#     if doc.custom_purchase_type != "Vehicle":
#         return  # No need to sync for non-vehicle purchases

#     # Clear items table before syncing
#     doc.set("items", [])

#     # Track unique items and their chassis numbers
#     item_qty = {}
#     item_serials = {}

#     for vin in doc.get("custom_vin"):
#         if vin.item not in item_qty:
#             item_qty[vin.item] = 0
#             item_serials[vin.item] = []

#         item_qty[vin.item] += 1
#         item_serials[vin.item].append(vin.chassis_number)

#     # ✅ Fetch Item Name and UOM from Item Doctype
#     for item_code, qty in item_qty.items():
#         item_doc = frappe.get_doc("Item", item_code) if frappe.db.exists("Item", item_code) else None
        
#         item_name = item_doc.item_name if item_doc else "Unknown Item"
#         uom = item_doc.stock_uom if item_doc else "Nos"

#         # Add items back to the items table with quantity, serial_no, item_name, and UOM
#         item_row = doc.append("items", {
#             "item_code": item_code,
#             "item_name": item_name,  # Set Item Name
#             "uom": uom,  # Set UOM
#             "qty": qty,
#             "serial_no": "\n".join(item_serials[item_code])  # Add all chassis numbers with line breaks
#         })

#     frappe.msgprint("Items table updated based on VIN details, including Item Name & UOM.")

import frappe

@frappe.whitelist()
def update_chassis_details(docname):
    """Fetch custom_vin table from Purchase Invoice and update matching Serial No documents"""
    doc = frappe.get_doc("Purchase Invoice", docname)
    
    for vin in doc.custom_vin:
        if frappe.db.exists("Serial No", vin.chassis_number):
            # ✅ Update Serial No with VIN details
            frappe.db.set_value("Serial No", vin.chassis_number, {
                "custom_chassis_number": vin.chassis_number,
                "custom_engine_number": vin.engine_number,
                "custom_vehicle_color": vin.vehicle_color,
                "custom_manufacturing_date": vin.manufacturing_date
            })
            frappe.msgprint(f"✅ Updated Serial No {vin.chassis_number}.")
        else:
            frappe.msgprint(f"⚠️ Serial No {vin.chassis_number} not found!")

    frappe.db.commit()
    return {"message": "Chassis details updated successfully!"}
