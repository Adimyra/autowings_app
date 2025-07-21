# import frappe
# from frappe.model.document import Document

# class Customer(Document):
#     def before_save(self):
#         if self.mobile_no:
#             if frappe.db.exists('Customer', {'mobile_no': self.mobile_no, 'name': ['!=', self.name]}):
#                 frappe.throw("A customer with this mobile number already exists.")


# Server script

# bench set-config -g server_script_enabled 1
# bench --site site1.local set-config server_script_enabled true



# script is 

# # Prevent duplicate customer based on mobile_no
# if doc.mobile_no:
#     existing_customer = frappe.db.get_value(
#         'Customer',
#         {'mobile_no': doc.mobile_no, 'name': ['!=', doc.name]},
#         'name'
#     )
#     if existing_customer:
#         frappe.throw(f"A customer with mobile number {doc.mobile_no} already exists (Customer: {existing_customer}).")




# -*- coding: utf-8 -*-

# for see all customer list
# import frappe

# def list_customers():
#     # Get all customers with name and customer_name fields
#     customers = frappe.get_all("Customer", fields=["name", "customer_name"], order_by="name")
    
#     # Print header
#     print(f"{'Name':<30} {'Customer Name':<30}")
#     print("-" * 60)
    
#     # Print each customer's name and customer_name
#     for customer in customers:
#         print(f"{customer.name:<30} {customer.customer_name:<30}")

# # Execute the function
# list_customers()


# for change name id

# import frappe

# def rename_customers():
#     # Get all customers
#     customers = frappe.get_all("Customer", fields=["name", "customer_name"], order_by="creation")
    
#     # Dictionary to track used names and their counts
#     name_counts = {}
    
#     for customer in customers:
#         desired_name = customer.customer_name
#         current_name = customer.name
        
#         # Skip if name is already correct
#         if current_name == desired_name or current_name.startswith(desired_name + " - "):
#             continue
            
#         # Check for duplicate names
#         if desired_name in name_counts:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
#         else:
#             name_counts[desired_name] = 0
#             new_name = desired_name
            
#         # Verify if new_name is unique
#         while frappe.db.exists("Customer", new_name) and new_name != current_name:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
            
#         # Update the customer name in the database
#         if new_name != current_name:
#             frappe.db.set_value("Customer", current_name, "name", new_name, update_modified=False)
#             print(f"Renamed {current_name} to {new_name}")
    
#     # Commit changes to the database
#     frappe.db.commit()

# # Execute the function
# rename_customers()





# for all change

# ------ terminal command ------

# import frappe

# def list_and_update_customers():
#     # Step 1: List all customers
#     customers = frappe.get_all("Customer", fields=["name", "customer_name"], order_by="creation")
#     print(f"{'Name':<30} {'Customer Name':<30}")
#     print("-" * 60)
#     for customer in customers:
#         print(f"{customer.name:<30} {customer.customer_name:<30}")
    
#     # Step 2: Rename customers
#     name_counts = {}
#     customer_mapping = {}
    
#     for customer in customers:
#         desired_name = customer.customer_name
#         current_name = customer.name
        
#         # Skip if name is already correct or follows duplicate pattern
#         if current_name == desired_name or current_name.startswith(desired_name + " - "):
#             customer_mapping[current_name] = current_name
#             continue
            
#         # Handle duplicates
#         if desired_name in name_counts:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
#         else:
#             name_counts[desired_name] = 0
#             new_name = desired_name
            
#         # Ensure new_name is unique
#         while frappe.db.exists("Customer", new_name) and new_name != current_name:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
            
#         # Update customer name
#         if new_name != current_name:
#             frappe.db.set_value("Customer", current_name, "name", new_name, update_modified=False)
#             customer_mapping[current_name] = new_name
#             print(f"Renamed {current_name} to {new_name}")
#         else:
#             customer_mapping[current_name] = current_name
    
#     # Step 3: Update references in other doctypes
#     doctypes_to_check = [
#         {"doctype": "Journal Entry Account", "field": "party", "parent_doctype": "Journal Entry", "parent_field": "accounts"},
#         {"doctype": "Sales Invoice", "field": "customer"},
#         {"doctype": "Sales Order", "field": "customer"},
#         {"doctype": "Delivery Note", "field": "customer"},
#         {"doctype": "Payment Entry", "field": "party"},
#         {"doctype": "Payment Entry Reference", "field": "reference_name", "parent_doctype": "Payment Entry", "parent_field": "references"},
#         {"doctype": "Quotation", "field": "party_name"},
#         {"doctype": "Vehicle Sales Master", "field": "customer"},
#         {"doctype": "Serial No", "field": "custom_customer_id"},
#         {"doctype": "RTO Registration", "field": "customer"},
#         {"doctype": "Vehicle Smart Card", "field": "customer"},
#         {"doctype": "Vehicle Insurance", "field": "customer"},
#         {"doctype": "Vehicle Finance", "field": "customer"},
#         {"doctype": "Vehicle Misc Sales", "field": "customer"},
#         {"doctype": "Vehicle RSA", "field": "customer"},
#         {"doctype": "Vehicle Extended Warranty", "field": "customer"}
#     ]
    
#     for doctype_info in doctypes_to_check:
#         doctype = doctype_info["doctype"]
#         field = doctype_info["field"]
#         parent_doctype = doctype_info.get("parent_doctype")
        
#         # Find records with old customer names
#         if parent_doctype:
#             records = frappe.db.sql("""
#                 SELECT parent, %s as field_value
#                 FROM `tab%s`
#                 WHERE %s IN (%s)
#             """ % (field, doctype, field, ",".join(["%s"] * len(customer_mapping))),
#             tuple(customer_mapping.keys()), as_dict=True)
#         else:
#             records = frappe.db.get_all(doctype, filters={field: ["in", list(customer_mapping.keys())]}, fields=["name", field], as_list=False)
        
#         # Update each record
#         for record in records:
#             old_value = record.field_value if parent_doctype else record[field]
#             new_value = customer_mapping.get(old_value)
#             if new_value and new_value != old_value:
#                 if parent_doctype:
#                     frappe.db.sql("""
#                         UPDATE `tab%s`
#                         SET %s = %s
#                         WHERE parent = %s AND %s = %s
#                     """ % (doctype, field, "%s", "%s", field, "%s"),
#                     (new_value, record.parent, old_value))
#                     print(f"Updated {doctype} in {parent_doctype} (parent: {record.parent}) {field}: {old_value} -> {new_value}")
#                 else:
#                     frappe.db.set_value(doctype, record.name, field, new_value, update_modified=False)
#                     print(f"Updated {doctype} (name: {record.name}) {field}: {old_value} -> {new_value}")
    
#     # Commit changes
#     frappe.db.commit()

# # Execute the function
# list_and_update_customers()




# for aw job card

# import frappe

# def update_aw_job_card_customer_to_name():
#     # Step 1: Fetch all AW Job Card records with customer and customer_name
#     job_cards = frappe.get_all(
#         "AW Job Card",
#         fields=["name", "customer", "customer_name"],
#         order_by="creation"
#     )
    
#     print(f"{'Job Card Name':<15} {'Current Customer':<30} {'Customer Name':<30}")
#     print("-" * 75)
#     for job_card in job_cards:
#         print(f"{job_card.name:<15} {job_card.customer:<30} {job_card.customer_name:<30}")
    
#     # Step 2: Update customer field to match customer_name
#     for job_card in job_cards:
#         if job_card.customer_name and job_card.customer != job_card.customer_name:
#             frappe.db.set_value(
#                 "AW Job Card",
#                 job_card.name,
#                 "customer",
#                 job_card.customer_name,
#                 update_modified=False
#             )
#             print(f"Updated AW Job Card {job_card.name}: customer {job_card.customer} -> {job_card.customer_name}")
    
#     # Step 3: Commit changes
#     frappe.db.commit()
#     print("Changes committed successfully.")

# # Execute the function
# update_aw_job_card_customer_to_name()


# import frappe

# def sync_customer_names():
#     # Step 1: Fetch all Customer records
#     customers = frappe.get_all(
#         "Customer",
#         fields=["name", "customer_name"],
#         order_by="creation"
#     )
    
#     print(f"{'Current Name':<20} {'Customer Name':<30}")
#     print("-" * 50)
#     for customer in customers:
#         print(f"{customer.name:<20} {customer.customer_name:<30}")
    
#     # Step 2: Update Customer names to match customer_name with duplicate handling
#     name_counts = {}
#     customer_mapping = {}
    
#     for customer in customers:
#         desired_name = customer.customer_name
#         current_name = customer.name
        
#         # Skip if name is already correct or follows duplicate pattern
#         if current_name == desired_name or current_name.startswith(desired_name + " - "):
#             customer_mapping[current_name] = current_name
#             continue
        
#         # Handle duplicates
#         if desired_name in name_counts:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
#         else:
#             name_counts[desired_name] = 0
#             new_name = desired_name
        
#         # Ensure new_name is unique
#         while frappe.db.exists("Customer", {"name": new_name}) and new_name != current_name:
#             name_counts[desired_name] += 1
#             new_name = f"{desired_name} - {name_counts[desired_name]}"
        
#         # Update Customer name
#         if new_name != current_name:
#             frappe.rename_doc("Customer", current_name, new_name, force=True, ignore_permissions=True)
#             customer_mapping[current_name] = new_name
#             print(f"Renamed Customer {current_name} to {new_name}")
#         else:
#             customer_mapping[current_name] = current_name
    
#     # Step 3: Update AW Job Card customer field to match new Customer names
#     job_cards = frappe.get_all(
#         "AW Job Card",
#         fields=["name", "customer", "customer_name"],
#         order_by="creation"
#     )
    
#     print(f"\n{'Job Card Name':<15} {'Current Customer':<30} {'Customer Name':<30}")
#     print("-" * 75)
#     for job_card in job_cards:
#         print(f"{job_card.name:<15} {job_card.customer:<30} {job_card.customer_name:<30}")
    
#     for job_card in job_cards:
#         old_customer = job_card.customer
#         new_customer = customer_mapping.get(old_customer, old_customer)
#         if new_customer and old_customer != new_customer:
#             frappe.db.set_value(
#                 "AW Job Card",
#                 job_card.name,
#                 "customer",
#                 new_customer,
#                 update_modified=False
#             )
#             print(f"Updated AW Job Card {job_card.name}: customer {old_customer} -> {new_customer}")
    
#     # Step 4: Commit changes
#     frappe.db.commit()
#     print("Changes committed successfully.")

# # Execute the function
# sync_customer_names()