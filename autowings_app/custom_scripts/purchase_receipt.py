# import frappe

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

# def before_submit(doc, method):
#     """ Before Submit: Set Serial No field in items and create Serial No Documents """
#     for item in doc.get("items"):
#         chassis_list = [vin.chassis_number for vin in doc.get("custom_vin") if vin.item == item.item_code]

#         if not chassis_list or "" in chassis_list:
#             frappe.throw(f"Please enter chassis numbers for all VIN entries of item {item.item_code}")

#         item.serial_no = "\n".join(chassis_list)  # Store multiple chassis numbers



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


# # for update table of VIN

# import frappe
# import csv
# import io

# @frappe.whitelist()
# def download_vin_csv(docname):
#     doc = frappe.get_doc("Purchase Receipt", docname)
    
#     # Prepare CSV headers
#     header = ["item", "chassis_number", "engine_number", "vehicle_color", "manufacturing_date"]
    
#     # Prepare data
#     data = []
#     for vin in doc.custom_vin:
#         data.append([vin.item, vin.chassis_number, vin.engine_number, vin.vehicle_color, vin.manufacturing_date or ""])
    
#     # Generate CSV in memory
#     output = io.StringIO()
#     writer = csv.writer(output)
#     writer.writerow(header)  # Write header
#     writer.writerows(data)   # Write data

#     return output.getvalue()


# import frappe
# import csv
# import os

# @frappe.whitelist()
# def upload_vin_csv(docname, file_url):
#     doc = frappe.get_doc("Purchase Receipt", docname)
    
#     # Ensure correct file path resolution
#     if not file_url.startswith("/private/"):  
#         file_url = "/private" + file_url  # Convert public URL to private path

#     file_path = frappe.get_site_path(file_url.strip("/"))

#     # Check if file exists before reading
#     if not os.path.exists(file_path):
#         frappe.throw(f"Uploaded file not found at {file_path}")

#     # Read CSV file
#     with open(file_path, "r", encoding="utf-8") as file:
#         reader = csv.reader(file)
#         headers = next(reader)  # Read the header row
        
#         vin_data = list(reader)

#     # Clear existing VIN table
#     doc.set("custom_vin", [])

#     # Insert new VIN data
#     for row in vin_data:
#         if len(row) < 5:
#             continue  # Skip invalid rows

#         item, chassis_number, engine_number, vehicle_color, manufacturing_date = row
#         doc.append("custom_vin", {
#             "item": item.strip(),
#             "chassis_number": chassis_number.strip(),
#             "engine_number": engine_number.strip(),
#             "vehicle_color": vehicle_color.strip(),
#             "manufacturing_date": manufacturing_date.strip() if manufacturing_date else None
#         })

#     doc.save(ignore_permissions=True)  # Save as draft
#     frappe.db.commit()
    
#     return "VIN Data Updated Successfully"
