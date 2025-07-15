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