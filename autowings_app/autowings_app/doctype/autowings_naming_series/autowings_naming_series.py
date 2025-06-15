# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class AutowingsNamingSeries(Document):
# # 	pass
# import frappe
# from frappe.model.document import Document

# class AutowingsNamingSeries(Document):
#     def before_insert(self):
#         # Automatically set enable = 1 for new child table records
#         for row in self.autowings_naming_series_configuration:
#             if not row.enable:
#                 row.enable = 1

#     def validate(self):
#         # Check for duplicate sales_naming_series in the child table
#         naming_series_list = [row.sales_naming_series for row in self.autowings_naming_series_configuration]
#         duplicates = [series for series in naming_series_list if naming_series_list.count(series) > 1]
#         if duplicates:
#             frappe.throw(f"Duplicate sales naming series found: {', '.join(set(duplicates))}. Each sales naming series must be unique.")

#         # Validate existence of Sale Type and Sub Sale Type for all rows
#         for row in self.autowings_naming_series_configuration:
#             # Check Sale Type
#             try:
#                 frappe.get_doc("Sale Type", {"sale_type": row.sales_type})
#             except frappe.DoesNotExistError:
#                 frappe.throw(f"Sale Type '{row.sales_type}' does not exist.")

#             # Check Sub Sale Type
#             if row.sub_sales_type:
#                 try:
#                     frappe.get_doc("Sub Sale Type", {"sub_sale_type": row.sub_sales_type})
#                 except frappe.DoesNotExistError:
#                     frappe.throw(f"Sub Sale Type '{row.sub_sales_type}' does not exist.")

#     def before_save(self):
#         # Collect enable status for Sale Type and Sub Sale Type
#         sale_type_enable = {}
#         sub_sale_type_enable = {}

#         # Aggregate enable status from all rows
#         for row in self.autowings_naming_series_configuration:
#             sale_type_enable[row.sales_type] = sale_type_enable.get(row.sales_type, 0) or row.enable
#             if row.sub_sales_type:
#                 sub_sale_type_enable[row.sub_sales_type] = sub_sale_type_enable.get(row.sub_sales_type, 0) or row.enable

#         # Update enabled field in Sale Type and Sub Sale Type doctypes
#         for sale_type, enabled in sale_type_enable.items():
#             frappe.db.set_value("Sale Type", {"sale_type": sale_type}, "enabled", enabled)

#         for sub_sale_type, enabled in sub_sale_type_enable.items():
#             frappe.db.set_value("Sub Sale Type", {"sub_sale_type": sub_sale_type}, "enabled", enabled)

#         # Process each row in the autowings_naming_series_configuration child table
#         for row in self.autowings_naming_series_configuration:
#             if row.enable and row.sub_sales_type:
#                 try:
#                     # Fetch the Sub Sale Type document based on sub_sales_type
#                     sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": row.sub_sales_type})
                    
#                     # Get misc_accounts from the Sub Sale Type's misc_accounts child table
#                     misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
                    
#                     # Update misc_account field based on enabled status
#                     row.misc_account = ", ".join(misc_accounts) if misc_accounts else "Not Have Account"
#                 except frappe.DoesNotExistError:
#                     row.misc_account = "Not Have Account"
#             else:
#                 # Set misc_account to "Disabled" if the row is not enabled or sub_sales_type is empty
#                 row.misc_account = "Disabled"

import frappe
from frappe.model.document import Document

class AutowingsNamingSeries(Document):
    def before_insert(self):
        # Automatically set enable = 1 for new child table records
        for row in self.autowings_naming_series_configuration:
            if not row.enable:
                row.enable = 1

    def validate(self):
        # Check for duplicate sales_naming_series in the child table
        naming_series_list = [row.sales_naming_series for row in self.autowings_naming_series_configuration]
        duplicates = [series for series in naming_series_list if naming_series_list.count(series) > 1]
        if duplicates:
            frappe.throw(f"Duplicate sales naming series found: {', '.join(set(duplicates))}. Each sales naming series must be unique.")

        # Validate existence of Sale Type and Sub Sale Type for all rows
        for row in self.autowings_naming_series_configuration:
            # Check Sale Type
            try:
                frappe.get_doc("Sale Type", {"sale_type": row.sales_type})
            except frappe.DoesNotExistError:
                frappe.throw(f"Sale Type '{row.sales_type}' does not exist.")

            # Check Sub Sale Type
            if row.sub_sales_type:
                try:
                    frappe.get_doc("Sub Sale Type", {"sub_sale_type": row.sub_sales_type})
                except frappe.DoesNotExistError:
                    frappe.throw(f"Sub Sale Type '{row.sub_sales_type}' does not exist.")

    def before_save(self):
        # Collect enable status for Sale Type and Sub Sale Type
        sale_type_enable = {}
        sub_sale_type_enable = {}

        # Aggregate enable status from all rows
        for row in self.autowings_naming_series_configuration:
            sale_type_enable[row.sales_type] = sale_type_enable.get(row.sales_type, 0) or row.enable
            if row.sub_sales_type:
                sub_sale_type_enable[row.sub_sales_type] = sub_sale_type_enable.get(row.sub_sales_type, 0) or row.enable

        # Update enabled field in Sale Type and Sub Sale Type doctypes
        for sale_type, enabled in sale_type_enable.items():
            frappe.db.set_value("Sale Type", {"sale_type": sale_type}, "enabled", enabled)

        for sub_sale_type, enabled in sub_sale_type_enable.items():
            frappe.db.set_value("Sub Sale Type", {"sub_sale_type": sub_sale_type}, "enabled", enabled)

        # Process each row in the autowings_naming_series_configuration child table
        for row in self.autowings_naming_series_configuration:
            if row.enable and row.sub_sales_type:
                try:
                    # Fetch the Sub Sale Type document based on sub_sales_type
                    sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": row.sub_sales_type})
                    
                    # Get misc_accounts from the Sub Sale Type's misc_accounts child table
                    misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
                    
                    # Update misc_account field based on enabled status
                    row.misc_account = ", ".join(misc_accounts) if misc_accounts else "Not Have Account"
                except frappe.DoesNotExistError:
                    row.misc_account = "Not Have Account"
            else:
                # Set misc_account to "Disabled" if the row is not enabled or sub_sales_type is empty
                row.misc_account = "Disabled"

@frappe.whitelist()
def update_autowings_naming_series(docname):
    """
    Server-side method to update misc_account fields and enabled status for AutowingsNamingSeries.
    """
    try:
        # Fetch the AutowingsNamingSeries document
        doc = frappe.get_doc("Autowings Naming Series", docname)

        # Check if document is submitted
        if doc.docstatus != 0:
            frappe.throw(_("This action is only available for unsubmitted documents."))

        # Collect enable status for Sale Type and Sub Sale Type
        sale_type_enable = {}
        sub_sale_type_enable = {}

        # Aggregate enable status from all rows
        for row in doc.autowings_naming_series_configuration:
            sale_type_enable[row.sales_type] = sale_type_enable.get(row.sales_type, 0) or row.enable
            if row.sub_sales_type:
                sub_sale_type_enable[row.sub_sales_type] = sub_sale_type_enable.get(row.sub_sales_type, 0) or row.enable

        # Update enabled field in Sale Type and Sub Sale Type doctypes
        for sale_type, enabled in sale_type_enable.items():
            frappe.db.set_value("Sale Type", {"sale_type": sale_type}, "enabled", enabled)

        for sub_sale_type, enabled in sub_sale_type_enable.items():
            frappe.db.set_value("Sub Sale Type", {"sub_sale_type": sub_sale_type}, "enabled", enabled)

        # Process each row in the autowings_naming_series_configuration child table
        for row in doc.autowings_naming_series_configuration:
            if row.enable and row.sub_sales_type:
                try:
                    # Fetch the Sub Sale Type document based on sub_sales_type
                    sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": row.sub_sales_type})
                    
                    # Get misc_accounts from the Sub Sale Type's misc_accounts child table
                    misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
                    
                    # Update misc_account field based on enabled status
                    row.misc_account = ", ".join(misc_accounts) if misc_accounts else "Not Have Account"
                except frappe.DoesNotExistError:
                    row.misc_account = "Not Have Account"
            else:
                # Set misc_account to "Disabled" if the row is not enabled or sub_sales_type is empty
                row.misc_account = "Disabled"

        # Save the document to persist changes
        doc.save()
        frappe.db.commit()

        return {"status": "success"}

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error updating Autowings Naming Series: {str(e)}")
        frappe.throw(_("Error updating document: {0}").format(str(e)))