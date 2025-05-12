# # import frappe

# # @frappe.whitelist()
# # def get_insurance_policies(provider):
# #     """Fetch insurance policies for the selected provider from the standalone Insurance Policy Doctype."""
# #     policies = frappe.get_all(
# #         "Insurance Policy",
# #         filters={"insurance_provider": provider},
# #         fields=["name", "policy_name"]
# #     )
# #     return policies

# # import frappe

# # @frappe.whitelist()
# # def get_misc_suppliers():
# #     """Fetch suppliers with custom_show_in_sales_invoice = 1 and supplier_group = 'Misc Group'."""
# #     suppliers = frappe.get_all(
# #         "Supplier",
# #         filters={
# #             "custom_show_in_sales_invoice": 1,
# #             "supplier_group": "Misc Group"
# #         },
# #         fields=["supplier_name"]
# #     )
# #     return suppliers

# # import frappe

# @frappe.whitelist()
# def get_insurance_policies(provider):
#     """Fetch insurance policies from the custom_under_insurer child table of the Supplier doctype."""
#     policies = frappe.get_all(
#         "Insurance Policy",  # Child doctype name
#         filters={
#             "parent": provider,  # Match supplier_name with parent Supplier
#             "parenttype": "Supplier",
#             "parentfield": "custom_under_insurer"
#         },
#         fields=["policy_name"]
#     )
#     return policies

# def before_submit(doc, method):
#     """
#     Before Submit Hook for Sales Invoice:
#     - Ensure `custom_sale_type` is selected.
#     - If Vehicle Sale, enforce mandatory `custom_vin` details before submission.
#     - Restrict multiple items and multiple quantity for Vehicle Sales.
#     - Create VSM, RTO, Insurance, Finance Documents.
#     - Update Serial No with VSM ID.
#     - If Spare or Other, skip vehicle processes and uncheck update_stock.
#     """
#     # ✅ Ensure `custom_sale_type` is set
#     if not doc.custom_sale_type:
#         frappe.throw("Sale Type (`custom_sale_type`) is required.")

#     # ✅ If Spare or Other, uncheck update_stock and skip vehicle processes
#     if doc.custom_sale_type in ["Spare", "Other"]:
#         doc.update_stock = 0
#         return  

#     # ✅ Ensure only 1 item and qty == 1 in Vehicle Sale
#     if len(doc.items) > 1:
#         frappe.throw("Only one item is allowed in the Items table for Vehicle sales.")
    
#     if doc.items[0].qty > 1:
#         frappe.throw("Quantity must be 1 for a Vehicle sale.")

#     # ✅ Ensure `custom_vin` is populated for Vehicle Sales when `update_stock` is checked
#     if doc.update_stock:
#         if not doc.custom_vin:
#             frappe.throw("Chassis Number details are required in VIN table.")

#         # ✅ Validate each VIN entry for mandatory fields and match with items
#         vin_item_codes = {vin.item for vin in doc.custom_vin}
#         item_codes = {item.item_code for item in doc.items}
#         if not vin_item_codes.issubset(item_codes):
#             frappe.throw("VIN entries must correspond to items in the Items table.")

#         for vin in doc.custom_vin:
#             if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
#                 frappe.throw(
#                     f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
#                 )

#     # ✅ Update `serial_no` in Items Table from `custom_vin`
#     update_items_with_chassis_numbers(doc)

#     # ✅ Create Vehicle Sales Master (VSM)
#     vsm_doc_name = create_vehicle_sales_master(doc)

#     # ✅ Create RTO Registration if applicable
#     rto_doc_name = None
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc_name = create_rto_registration(doc, vsm_doc_name)

#     # ✅ Create Vehicle Insurance if applicable
#     insurance_doc_name = None
#     if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_name)

#     # ✅ Create Vehicle Finance if applicable
#     finance_doc_name = None
#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_name)

#     # ✅ Update Serial No doctype with VSM ID
#     if doc.update_stock:
#         update_serial_no_with_vsm(doc, vsm_doc_name)
#         update_customer_vsm(doc, vsm_doc_name)

#     # ✅ Update VSM Document with RTO, Insurance & Finance IDs
#     vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#     vsm_doc.is_delivered = 1 if doc.update_stock else 0
    
#     if rto_doc_name:
#         vsm_doc.rto_registration = 1
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.rto_office = doc.custom_rto_office
#         vsm_doc.registration_status = "Pending"

#     if insurance_doc_name:
#         vsm_doc.is_insurance = 1
#         vsm_doc.insurance_id = insurance_doc_name
#         vsm_doc.insurance_provider = doc.custom_insurance_provider
#         vsm_doc.insurance_status = "Applied"

#     if finance_doc_name:
#         vsm_doc.is_finance = 1
#         vsm_doc.finance_id = finance_doc_name
#         vsm_doc.finance_provider = doc.custom_finance_provider
#         vsm_doc.loan_amount = doc.custom_finance_amount
#         vsm_doc.loan_status = "Pending"

#     vsm_doc.save()

# def update_items_with_chassis_numbers(doc):
#     """
#     Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers.
#     """
#     item_chassis_map = {}

#     # ✅ Group chassis numbers by item code
#     for vin in doc.custom_vin:
#         if vin.item not in item_chassis_map:
#             item_chassis_map[vin.item] = []
#         item_chassis_map[vin.item].append(vin.chassis_number)

#     # ✅ Update items table
#     for item in doc.items:
#         if item.item_code in item_chassis_map:
#             item.serial_no = "\n".join(item_chassis_map[item.item_code])  # Assign chassis numbers to serial_no field

# def update_serial_no_with_vsm(doc, vsm_doc_name):
#     """Update Serial No doctype with VSM ID when `update_stock` is checked."""
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
#             serial_no_doc.custom_vsm_id = vsm_doc_name
#             serial_no_doc.save()

# def update_customer_vsm(doc, vsm_doc_name):
#     """
#     Update the Customer doctype's `custom_vin` child table with VSM ID.
#     - If chassis number exists, update the `vsm_id`.
#     - If chassis number does not exist, append a new row.
#     """
#     if not doc.customer:
#         frappe.throw("Customer is required to update VSM ID in Customer doctype.")
    
#     customer_doc = frappe.get_doc("Customer", doc.customer)

#     for vin in doc.get("custom_vin"):
#         existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)
        
#         if existing_vin:
#             existing_vin.vsm_id = vsm_doc_name
#         else:
#             customer_doc.append("custom_vin", {
#                 "chassis_number": vin.chassis_number,
#                 "vsm_id": vsm_doc_name
#             })
    
#     customer_doc.save(ignore_permissions=True)

# def create_vehicle_sales_master(doc):
#     """Creates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
#     try:
#         if not doc.custom_vin:
#             frappe.throw("Chassis Number details are required in VIN table.")
#         vin = doc.custom_vin[0]
#         vsm_doc = frappe.get_doc({
#             "doctype": "Vehicle Sales Master",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "chassis_number": vin.chassis_number,
#             "engine_number": vin.engine_number,
#             "vehicle_color": vin.vehicle_color,
#             "manufacturing_date": vin.manufacturing_date,
#             "is_delivered": 1 if doc.update_stock else 0
#         })
#         vsm_doc.insert()
#         frappe.db.commit()
#         return vsm_doc.name
#     except frappe.DuplicateEntryError:
#         frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
#     except Exception as e:
#         frappe.log_error(f"Error creating VSM: {str(e)}")
#         raise

# def create_rto_registration(doc, vsm_doc_name):
#     """Creates an RTO Registration document if applicable."""
#     try:
#         rto_doc = frappe.get_doc({
#             "doctype": "RTO Registration",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "rto_office": doc.custom_rto_office,
#             "registration_charge": doc.custom_registration_charge,
#             "registration_status": "Pending"
#         })
#         rto_doc.insert()
#         frappe.db.commit()
#         return rto_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating RTO Registration: {str(e)}")
#         raise

# def create_vehicle_insurance(doc, vsm_doc_name):
#     """Creates a Vehicle Insurance document if applicable."""
#     try:
#         policies = get_insurance_policies(doc.custom_insurance_provider)
#         if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
#             frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
#         insurance_doc = frappe.get_doc({
#             "doctype": "Vehicle Insurance",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "insurance_provider": doc.custom_insurance_provider,
#             "policy_name": doc.custom_insurance_policy,
#             "insurance_amount": doc.custom_insurance_amount,
#             "insurance_status": "Applied"
#         })
#         insurance_doc.insert()
#         frappe.db.commit()
#         return insurance_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating Vehicle Insurance: {str(e)}")
#         raise

# def create_vehicle_finance(doc, vsm_doc_name):
#     """Creates a Vehicle Finance document if applicable."""
#     try:
#         finance_doc = frappe.get_doc({
#             "doctype": "Vehicle Finance",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "finance_provider": doc.custom_finance_provider,
#             "loan_amount": doc.custom_finance_amount,
#             "finance_status": "Pending"
#         })
#         finance_doc.insert()
#         frappe.db.commit()
#         return finance_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating Vehicle Finance: {str(e)}")
#         raise


#     import frappe
# from frappe import _
# from frappe.utils import getdate

# def on_submit_sales_invoice(doc, method):
#     """Create draft Journal Entries for RTO, Insurance, Finance, and Miscellaneous charges on Sales Invoice submission."""
#     # RTO Journal Entry
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc = frappe.db.exists("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not rto_doc:
#             frappe.msgprint(_("Error: RTO Registration not created for Sales Invoice {0} despite custom_rto_office being set.").format(doc.name))
#             frappe.throw(_("RTO Registration document creation failed."))

#         je_rto = frappe.new_doc("Journal Entry")
#         je_rto.voucher_type = "Journal Entry"
#         je_rto.company = doc.company
#         je_rto.posting_date = getdate()
#         je_rto.title = f"RTO Charge - {doc.customer}"
#         je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
#         je_rto.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_registration_charge,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_rto_office
#         })
#         je_rto.append("accounts", {
#             "account": f"{doc.custom_rto_office} Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_rto_office,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_registration_charge,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_rto.save()
#         frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

#     # Insurance Journal Entry
#     if doc.custom_insurance_provider and doc.custom_insurance_amount:
#         insurance_doc = frappe.db.exists("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not insurance_doc:
#             frappe.msgprint(_("Error: Vehicle Insurance not created for Sales Invoice {0} despite custom_insurance_provider being set.").format(doc.name))
#             frappe.throw(_("Vehicle Insurance document creation failed."))

#         je_insurance = frappe.new_doc("Journal Entry")
#         je_insurance.voucher_type = "Journal Entry"
#         je_insurance.company = doc.company
#         je_insurance.posting_date = getdate()
#         je_insurance.title = f"Insurance Charge - {doc.customer}"
#         je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
#         je_insurance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_insurance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_insurance_provider
#         })
#         je_insurance.append("accounts", {
#             "account": f"{doc.custom_insurance_provider} Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_insurance_provider,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_insurance_amount,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_insurance.save()
#         frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

#     # Finance Journal Entry
#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         finance_doc = frappe.db.exists("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not finance_doc:
#             frappe.msgprint(_("Error: Vehicle Finance not created for Sales Invoice {0} despite custom_finance_provider being set.").format(doc.name))
#             frappe.throw(_("Vehicle Finance document creation failed."))

#         je_finance = frappe.new_doc("Journal Entry")
#         je_finance.voucher_type = "Journal Entry"
#         je_finance.company = doc.company
#         je_finance.posting_date = getdate()
#         je_finance.title = doc.custom_finance_provider
#         je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
#         je_finance.append("accounts", {
#             "account": "Finance Receivable - A",
#             "party_type": "Customer",
#             "party": doc.custom_finance_provider,
#             "debit_in_account_currency": doc.custom_finance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.customer
#         })
#         je_finance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_finance_amount,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_finance_provider
#         })
#         je_finance.save()
#         frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

#     # Miscellaneous Journal Entries
#     for misc in doc.custom_miscellaneous:
#         if misc.amount > 0:
#             je_misc = frappe.new_doc("Journal Entry")
#             je_misc.voucher_type = "Journal Entry"
#             je_misc.company = doc.company
#             je_misc.posting_date = getdate()
#             je_misc.title = f"Miscellaneous Charge - {doc.customer}"
#             je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
#             je_misc.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": misc.amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": misc.misc_account
#             })
#             je_misc.append("accounts", {
#                 "account": f"{misc.misc_account} Payable - A",
#                 "party_type": "Supplier",
#                 "party": misc.misc_account,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": misc.amount,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_misc.save()
#             frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))

# def after_insert_sales_invoice(doc, method):
#     """Add suppliers with custom_show_in_sales_invoice = 1 and supplier_group = 'Misc Group' to custom_miscellaneous child table on Sales Invoice creation."""
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters={
#             "custom_show_in_sales_invoice": 1,
#             "supplier_group": "Misc Group"
#         },
#         fields=["supplier_name"]
#     )

#     # Only add suppliers if custom_miscellaneous is empty
#     if not doc.custom_miscellaneous:
#         for supplier in suppliers:
#             doc.append("custom_miscellaneous", {
#                 "misc_account": supplier.supplier_name,
#                 "amount": 0
#             })
#         doc.save()

# import frappe
# from frappe import _
# from frappe.utils import getdate


# def before_submit(doc, method):
#     """
#     Before Submit Hook for Sales Invoice:
#     - Ensure `custom_sale_type` is selected.
#     - If Vehicle Sale, enforce mandatory `custom_vin` details before submission.
#     - Restrict multiple items and multiple quantity for Vehicle Sales.
#     - Create VSM, RTO, Insurance, Finance Documents.
#     - Update Serial No with VSM ID.
#     - If Spare or Other, skip vehicle processes and uncheck update_stock.
#     """
#     # Ensure `custom_sale_type` is set
#     if not doc.custom_sale_type:
#         frappe.throw("Sale Type (`custom_sale_type`) is required.")

#     # If Spare or Other, uncheck update_stock and skip vehicle processes
#     if doc.custom_sale_type in ["Spare", "Other"]:
#         doc.update_stock = 0
#         return

#     # Ensure only 1 item and qty == 1 in Vehicle Sale
#     if len(doc.items) > 1:
#         frappe.throw("Only one item is allowed in the Items table for Vehicle sales.")

#     if doc.items[0].qty > 1:
#         frappe.throw("Quantity must be 1 for a Vehicle sale.")

#     # Ensure `custom_vin` is populated for Vehicle Sales when `update_stock` is checked
#     if doc.update_stock:
#         if not doc.custom_vin:
#             frappe.throw("Chassis Number details are required in VIN table.")

#         # Validate each VIN entry for mandatory fields and match with items
#         vin_item_codes = {vin.item for vin in doc.custom_vin}
#         item_codes = {item.item_code for item in doc.items}
#         if not vin_item_codes.issubset(item_codes):
#             frappe.throw("VIN entries must correspond to items in the Items table.")

#         for vin in doc.custom_vin:
#             if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
#                 frappe.throw(
#                     f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
#                 )

#     # Update `serial_no` in Items Table from `custom_vin`
#     update_items_with_chassis_numbers(doc)

#     # Create Vehicle Sales Master (VSM)
#     vsm_doc_name = create_vehicle_sales_master(doc)

#     # Create RTO Registration if applicable
#     rto_doc_name = None
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc_name = create_rto_registration(doc, vsm_doc_name)

#     # Create Vehicle Insurance if applicable
#     insurance_doc_name = None
#     if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
#         insurance_doc_name = create_vehicle_insurance(doc, vsm_doc_name)

#     # Create Vehicle Finance if applicable
#     finance_doc_name = None
#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         finance_doc_name = create_vehicle_finance(doc, vsm_doc_name)

#     # Update Serial No doctype with VSM ID
#     if doc.update_stock:
#         update_serial_no_with_vsm(doc, vsm_doc_name)
#         update_customer_vsm(doc, vsm_doc_name)

#     # Update VSM Document with RTO, Insurance & Finance IDs
#     vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#     vsm_doc.is_delivered = 1 if doc.update_stock else 0

#     if rto_doc_name:
#         vsm_doc.rto_registration = 1
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.rto_office = doc.custom_rto_office
#         vsm_doc.registration_status = "Pending"

#     if insurance_doc_name:
#         vsm_doc.is_insurance = 1
#         vsm_doc.insurance_id = insurance_doc_name
#         vsm_doc.insurance_provider = doc.custom_insurance_provider
#         vsm_doc.insurance_status = "Applied"

#     if finance_doc_name:
#         vsm_doc.is_finance = 1
#         vsm_doc.finance_id = finance_doc_name
#         vsm_doc.finance_provider = doc.custom_finance_provider
#         vsm_doc.loan_amount = doc.custom_finance_amount
#         vsm_doc.loan_status = "Pending"

#     vsm_doc.save()


# def after_insert_sales_invoice(doc, method):
#     """Add suppliers with custom_show_in_sales_invoice = 1 and supplier_group = 'Misc Group' to custom_miscellaneous child table on Sales Invoice creation."""
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters={
#             "custom_show_in_sales_invoice": 1,
#             "supplier_group": "Misc Group"
#         },
#         fields=["supplier_name"]
#     )

#     # Only add suppliers if custom_miscellaneous is empty
#     if not doc.custom_miscellaneous:
#         for supplier in suppliers:
#             doc.append("custom_miscellaneous", {
#                 "misc_account": supplier.supplier_name,
#                 "amount": 0
#             })
#         doc.save()


# def on_submit_sales_invoice(doc, method):
#     """Create draft Journal Entries for RTO, Insurance, Finance, and Miscellaneous charges on Sales Invoice submission."""
#     # RTO Journal Entry
#     if doc.custom_rto_office and doc.custom_registration_charge:
#         rto_doc = frappe.db.exists("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not rto_doc:
#             frappe.msgprint(_("Error: RTO Registration not created for Sales Invoice {0} despite custom_rto_office being set.").format(doc.name))
#             frappe.throw(_("RTO Registration document creation failed."))

#         je_rto = frappe.new_doc("Journal Entry")
#         je_rto.voucher_type = "Journal Entry"
#         je_rto.company = doc.company
#         je_rto.posting_date = getdate()
#         je_rto.title = f"RTO Charge - {doc.customer}"
#         je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
#         je_rto.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_registration_charge,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_rto_office
#         })
#         je_rto.append("accounts", {
#             "account": "RTO Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_rto_office,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_registration_charge,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_rto.save()
#         frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

#     # Insurance Journal Entry
#     if doc.custom_insurance_provider and doc.custom_insurance_amount:
#         insurance_doc = frappe.db.exists("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not insurance_doc:
#             frappe.msgprint(_("Error: Vehicle Insurance not created for Sales Invoice {0} despite custom_insurance_provider being set.").format(doc.name))
#             frappe.throw(_("Vehicle Insurance document creation failed."))

#         je_insurance = frappe.new_doc("Journal Entry")
#         je_insurance.voucher_type = "Journal Entry"
#         je_insurance.company = doc.company
#         je_insurance.posting_date = getdate()
#         je_insurance.title = f"Insurance Charge - {doc.customer}"
#         je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
#         je_insurance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": doc.custom_insurance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_insurance_provider
#         })
#         je_insurance.append("accounts", {
#             "account": "Insurance Charges Payable - A",
#             "party_type": "Supplier",
#             "party": doc.custom_insurance_provider,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_insurance_amount,
#             "cost_center": "Main - A",
#             "against_account": "Debtors - A"
#         })
#         je_insurance.save()
#         frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

#     # Finance Journal Entry
#     if doc.custom_finance_provider and doc.custom_finance_amount:
#         finance_doc = frappe.db.exists("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]})
#         if not finance_doc:
#             frappe.msgprint(_("Error: Vehicle Finance not created for Sales Invoice {0} despite custom_finance_provider being set.").format(doc.name))
#             frappe.throw(_("Vehicle Finance document creation failed."))

#         je_finance = frappe.new_doc("Journal Entry")
#         je_finance.voucher_type = "Journal Entry"
#         je_finance.company = doc.company
#         je_finance.posting_date = getdate()
#         je_finance.title = doc.custom_finance_provider
#         je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
#         je_finance.append("accounts", {
#             "account": "Finance Receivable - A",
#             "party_type": "Customer",
#             "party": doc.custom_finance_provider,
#             "debit_in_account_currency": doc.custom_finance_amount,
#             "credit_in_account_currency": 0,
#             "cost_center": "Main - A",
#             "against_account": doc.customer
#         })
#         je_finance.append("accounts", {
#             "account": "Debtors - A",
#             "party_type": "Customer",
#             "party": doc.customer,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": doc.custom_finance_amount,
#             "cost_center": "Main - A",
#             "against_account": doc.custom_finance_provider
#         })
#         je_finance.save()
#         frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

#     # Miscellaneous Journal Entries
#     for misc in doc.custom_miscellaneous:
#         if misc.amount > 0:
#             je_misc = frappe.new_doc("Journal Entry")
#             je_misc.voucher_type = "Journal Entry"
#             je_misc.company = doc.company
#             je_misc.posting_date = getdate()
#             je_misc.title = f"Miscellaneous Charge - {doc.customer}"
#             je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
#             je_misc.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": misc.amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": misc.misc_account
#             })
#             je_misc.append("accounts", {
#                 "account": f"{misc.misc_account} Payable - A",
#                 "party_type": "Supplier",
#                 "party": misc.misc_account,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": misc.amount,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_misc.save()
#             frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))


# def get_insurance_policies(provider):
#     """Fetch insurance policies from the custom_under_insurer child table of the Supplier doctype."""
#     policies = frappe.get_all(
#         "Insurance Policy",
#         filters={
#             "parent": provider,
#             "parenttype": "Supplier",
#             "parentfield": "custom_under_insurer"
#         },
#         fields=["policy_name"]
#     )
#     return policies


# def update_items_with_chassis_numbers(doc):
#     """Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers."""
#     item_chassis_map = {}

#     # Group chassis numbers by item code
#     for vin in doc.custom_vin:
#         if vin.item not in item_chassis_map:
#             item_chassis_map[vin.item] = []
#         item_chassis_map[vin.item].append(vin.chassis_number)

#     # Update items table
#     for item in doc.items:
#         if item.item_code in item_chassis_map:
#             item.serial_no = "\n".join(item_chassis_map[item.item_code])


# def update_serial_no_with_vsm(doc, vsm_doc_name):
#     """Update Serial No doctype with VSM ID when `update_stock` is checked."""
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
#             serial_no_doc.custom_vsm_id = vsm_doc_name
#             serial_no_doc.save()


# def update_customer_vsm(doc, vsm_doc_name):
#     """
#     Update the Customer doctype's `custom_vin` child table with VSM ID.
#     - If chassis number exists, update the `vsm_id`.
#     - If chassis number does not exist, append a new row.
#     """
#     if not doc.customer:
#         frappe.throw("Customer is required to update VSM ID in Customer doctype.")

#     customer_doc = frappe.get_doc("Customer", doc.customer)

#     for vin in doc.get("custom_vin"):
#         existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)

#         if existing_vin:
#             existing_vin.vsm_id = vsm_doc_name
#         else:
#             customer_doc.append("custom_vin", {
#                 "chassis_number": vin.chassis_number,
#                 "vsm_id": vsm_doc_name
#             })

#     customer_doc.save(ignore_permissions=True)


# def create_vehicle_sales_master(doc):
#     """Creates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
#     try:
#         if not doc.custom_vin:
#             frappe.throw("Chassis Number details are required in VIN table.")
#         vin = doc.custom_vin[0]
#         vsm_doc = frappe.get_doc({
#             "doctype": "Vehicle Sales Master",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "chassis_number": vin.chassis_number,
#             "engine_number": vin.engine_number,
#             "vehicle_color": vin.vehicle_color,
#             "manufacturing_date": vin.manufacturing_date,
#             "is_delivered": 1 if doc.update_stock else 0
#         })
#         vsm_doc.insert()
#         frappe.db.commit()
#         return vsm_doc.name
#     except frappe.DuplicateEntryError:
#         frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
#     except Exception as e:
#         frappe.log_error(f"Error creating VSM: {str(e)}")
#         raise


# def create_rto_registration(doc, vsm_doc_name):
#     """Creates an RTO Registration document if applicable."""
#     try:
#         rto_doc = frappe.get_doc({
#             "doctype": "RTO Registration",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "rto_office": doc.custom_rto_office,
#             "registration_charge": doc.custom_registration_charge,
#             "registration_status": "Pending"
#         })
#         rto_doc.insert()
#         frappe.db.commit()
#         return rto_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating RTO Registration: {str(e)}")
#         raise


# def create_vehicle_insurance(doc, vsm_doc_name):
#     """Creates a Vehicle Insurance document if applicable."""
#     try:
#         policies = get_insurance_policies(doc.custom_insurance_provider)
#         if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
#             frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
#         insurance_doc = frappe.get_doc({
#             "doctype": "Vehicle Insurance",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "insurance_provider": doc.custom_insurance_provider,
#             "policy_name": doc.custom_insurance_policy,
#             "insurance_amount": doc.custom_insurance_amount,
#             "insurance_status": "Applied"
#         })
#         insurance_doc.insert()
#         frappe.db.commit()
#         return insurance_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating Vehicle Insurance: {str(e)}")
#         raise


# def create_vehicle_finance(doc, vsm_doc_name):
#     """Creates a Vehicle Finance document if applicable."""
#     try:
#         finance_doc = frappe.get_doc({
#             "doctype": "Vehicle Finance",
#             "customer": doc.customer,
#             "sales_invoice": doc.name,
#             "vsm_id": vsm_doc_name,
#             "finance_provider": doc.custom_finance_provider,
#             "loan_amount": doc.custom_finance_amount,
#             "finance_status": "Pending"
#         })
#         finance_doc.insert()
#         frappe.db.commit()
#         return finance_doc.name
#     except Exception as e:
#         frappe.log_error(f"Error creating Vehicle Finance: {str(e)}")
#         raise

import frappe
from frappe import _
from frappe.utils import getdate


def before_submit(doc, method):
    """
    Before Submit Hook for Sales Invoice:
    - Validate `custom_sale_type`, item count, quantity, and VIN details.
    - Update `serial_no` in Items Table from `custom_vin`.
    - If Spare or Other, uncheck update_stock.
    - No document creation here to avoid issues if submission fails.
    """
    # Ensure `custom_sale_type` is set
    if not doc.custom_sale_type:
        frappe.throw("Sale Type (`custom_sale_type`) is required.")

    # If Spare or Other, uncheck update_stock and skip vehicle processes
    if doc.custom_sale_type in ["Spare", "Other"]:
        doc.update_stock = 0
        return

    # Ensure only 1 item and qty == 1 in Vehicle Sale
    if len(doc.items) > 1:
        frappe.throw("Only one item is allowed in the Items table for Vehicle sales.")

    if doc.items[0].qty > 1:
        frappe.throw("Quantity must be 1 for a Vehicle sale.")

    # Ensure `custom_vin` is populated for Vehicle Sales when `update_stock` is checked
    if doc.update_stock:
        if not doc.custom_vin:
            frappe.throw("Chassis Number details are required in VIN table.")

        # Validate each VIN entry for mandatory fields and match with items
        vin_item_codes = {vin.item for vin in doc.custom_vin}
        item_codes = {item.item_code for item in doc.items}
        if not vin_item_codes.issubset(item_codes):
            frappe.throw("VIN entries must correspond to items in the Items table.")

        for vin in doc.custom_vin:
            if not vin.chassis_number or not vin.engine_number or not vin.vehicle_color or not vin.manufacturing_date:
                frappe.throw(
                    f"VIN Entry for Item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
                )

    # Update `serial_no` in Items Table from `custom_vin`
    update_items_with_chassis_numbers(doc)


# def after_insert_sales_invoice(doc, method):
#     """Add suppliers with custom_show_in_sales_invoice = 1 and supplier_group = 'Misc Group' to custom_miscellaneous child table on Sales Invoice creation."""
#     suppliers = frappe.get_all(
#         "Supplier",
#         filters={
#             "custom_show_in_sales_invoice": 1,
#             "supplier_group": "Misc Group"
#         },
#         fields=["supplier_name"]
#     )

#     # Only add suppliers if custom_miscellaneous is empty
#     if not doc.custom_miscellaneous:
#         for supplier in suppliers:
#             doc.append("custom_miscellaneous", {
#                 "misc_account": supplier.supplier_name,
#                 "amount": 0
#             })
#         doc.save()

# import frappe

# def after_insert_sales_invoice(doc, method):
#     """Add suppliers to custom_miscellaneous child table based on custom_sub_sales_type's misc_accounts."""
#     if not doc.custom_sub_sales_type:
#         frappe.log_error(f"No custom_sub_sales_type found for Sales Invoice {doc.name}", "after_insert_sales_invoice")
#         return

#     # Fetch Sub Sale Type document where sub_sale_type matches custom_sub_sales_type and enabled = 1
#     try:
#         sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": doc.custom_sub_sales_type, "enabled": 1})
#     except frappe.DoesNotExistError:
#         frappe.log_error(f"Sub Sale Type {doc.custom_sub_sales_type} not found or not enabled for Sales Invoice {doc.name}", "after_insert_sales_invoice")
#         return

#     # Get misc_account values from Sub Sale Type's misc_accounts child table
#     misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
#     if not misc_accounts:
#         frappe.log_error(f"No misc_accounts found in Sub Sale Type {doc.custom_sub_sales_type} for Sales Invoice {doc.name}", "after_insert_sales_invoice")
#         return

#     # Only add suppliers if custom_miscellaneous is empty
#     if not doc.custom_miscellaneous:
#         # Fetch suppliers where supplier_name matches misc_account and supplier_group is 'Misc Group'
#         suppliers = frappe.get_all(
#             "Supplier",
#             filters={
#                 "supplier_name": ["in", misc_accounts],
#                 "supplier_group": "Misc Group"
#             },
#             fields=["supplier_name"]
#         )

#         if not suppliers:
#             frappe.log_error(f"No suppliers found in 'Misc Group' for misc_accounts {misc_accounts} in Sales Invoice {doc.name}", "after_insert_sales_invoice")
#             return

#         # Add matching suppliers to custom_miscellaneous child table
#         for supplier in suppliers:
#             doc.append("custom_miscellaneous", {
#                 "misc_account": supplier.supplier_name,
#                 "amount": 0
#             })

#         # Save the document to persist changes
#         try:
#             doc.save()
#             frappe.log_error(f"Successfully added suppliers {', '.join([s.supplier_name for s in suppliers])} to custom_miscellaneous for Sales Invoice {doc.name}", "after_insert_sales_invoice")
#         except Exception as e:
#             frappe.log_error(f"Failed to save Sales Invoice {doc.name}: {str(e)}", "after_insert_sales_invoice")
#     else:
#         frappe.log_error(f"custom_miscellaneous already populated for Sales Invoice {doc.name}, skipping supplier addition", "after_insert_sales_invoice")


import frappe

def after_insert_sales_invoice(doc, method):
    """Add suppliers to custom_miscellaneous child table based on custom_sub_sales_type's misc_accounts."""
    if not doc.custom_sub_sales_type:
        frappe.log_error(f"No custom_sub_sales_type found for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        return

    # Fetch Sub Sale Type document where sub_sale_type matches custom_sub_sales_type and enabled = 1
    try:
        sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": doc.custom_sub_sales_type, "enabled": 1})
    except frappe.DoesNotExistError:
        frappe.log_error(f"Sub Sale Type {doc.custom_sub_sales_type} not found or not enabled for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        return

    # Get misc_account values from Sub Sale Type's misc_accounts child table
    misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
    if not misc_accounts:
        frappe.log_error(f"No misc_accounts found in Sub Sale Type {doc.custom_sub_sales_type} for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        return

    # Only add suppliers if custom_miscellaneous is empty
    if not doc.custom_miscellaneous:
        # Fetch suppliers where supplier_name matches misc_account and supplier_group is 'Misc Group'
        suppliers = frappe.get_all(
            "Supplier",
            filters={
                "supplier_name": ["in", misc_accounts],
                "supplier_group": "Misc Group"
            },
            fields=["supplier_name"]
        )

        if not suppliers:
            frappe.log_error(f"No suppliers found in 'Misc Group' for misc_accounts {misc_accounts} in Sales Invoice {doc.name}", "after_insert_sales_invoice")
            return

        # Add matching suppliers to custom_miscellaneous child table
        for supplier in suppliers:
            doc.append("custom_miscellaneous", {
                "misc_account": supplier.supplier_name,
                "amount": 0
            })

        # Save the document to persist changes
        try:
            doc.save()
            frappe.log_error(f"Successfully added {len(suppliers)} suppliers to custom_miscellaneous for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        except Exception as e:
            frappe.log_error(f"Failed to save Sales Invoice {doc.name}: {str(e)}", "after_insert_sales_invoice")
    else:
        frappe.log_error(f"custom_miscellaneous already populated for Sales Invoice {doc.name}, skipping supplier addition", "after_insert_sales_invoice")
        
# import frappe
# from frappe.utils import getdate

# def on_submit_sales_invoice(doc, method):
#     """
#     On Submit Hook for Sales Invoice:
#     - Create or update VSM, RTO, Insurance, Finance, RSA, Extended Warranty, and Misc Sales documents.
#     - Create draft Journal Entries for RTO, Insurance, Finance, RSA, Extended Warranty, and Miscellaneous charges.
#     - Update journal_entry_id in respective documents.
#     - Update Serial No and Customer doctypes with VSM ID.
#     - If any document or journal entry creation fails, rollback all changes and prevent Sales Invoice submission.
#     """
#     if doc.custom_sale_type != "Vehicle":
#         return

#     try:
#         # Create or update Vehicle Sales Master (VSM)
#         vsm_doc_name = create_or_update_vehicle_sales_master(doc)

#         # Initialize document names
#         rto_doc_name = None
#         insurance_doc_name = None
#         finance_doc_name = None
#         rsa_doc_name = None
#         extended_warranty_doc_name = None
#         misc_sales_doc_name = None

#         # Create or update RTO Registration if applicable
#         if doc.custom_rto_office and doc.custom_registration_charge:
#             rto_doc_name = create_or_update_rto_registration(doc, vsm_doc_name)

#         # Create or update Vehicle Insurance if applicable
#         if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
#             insurance_doc_name = create_or_update_vehicle_insurance(doc, vsm_doc_name)

#         # Create or update Vehicle Finance if applicable
#         if doc.custom_finance_provider and doc.custom_finance_amount:
#             finance_doc_name = create_or_update_vehicle_finance(doc, vsm_doc_name)

#         # Create or update Vehicle RSA if applicable
#         if doc.custom_rsa_provider and doc.custom_rsa_amount > 0:
#             rsa_doc_name = create_or_update_vehicle_rsa(doc, vsm_doc_name)

#         # Create or update Vehicle Extended Warranty if applicable
#         if doc.custom_extended_warranty_provider and doc.custom_extended_warranty_amount > 0:
#             extended_warranty_doc_name = create_or_update_vehicle_extended_warranty(doc, vsm_doc_name)

#         # Create or update Vehicle Misc Sales if applicable
#         misc_entries = [misc for misc in doc.custom_miscellaneous if misc.amount > 0]
#         if misc_entries:
#             misc_sales_doc_name = create_or_update_vehicle_misc_sales(doc, vsm_doc_name)

#         # Update Serial No and Customer doctypes with VSM ID
#         if doc.update_stock:
#             update_serial_no_with_vsm(doc, vsm_doc_name)
#             update_customer_vsm(doc, vsm_doc_name)

#         # Update VSM with all relevant IDs and statuses
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         vsm_doc.is_delivered = 1 if doc.update_stock else 0

#         if rto_doc_name:
#             vsm_doc.rto_registration = 1
#             vsm_doc.rto_registration_id = rto_doc_name

#         if insurance_doc_name:
#             vsm_doc.is_insurance = 1
#             vsm_doc.insurance_id = insurance_doc_name

#         if finance_doc_name:
#             vsm_doc.is_finance = 1
#             vsm_doc.finance_id = finance_doc_name

#         if rsa_doc_name:
#             vsm_doc.is_rsa = 1
#             vsm_doc.rsa_id = rsa_doc_name

#         if extended_warranty_doc_name:
#             vsm_doc.is_extended_warranty = 1
#             vsm_doc.extended_warranty_id = extended_warranty_doc_name

#         if misc_sales_doc_name:
#             vsm_doc.vehicle_misc_sales_id = misc_sales_doc_name

#         # Save VSM updates
#         vsm_doc.save()

#         # Create Journal Entries and update journal_entry_id
#         # RTO Journal Entry
#         if rto_doc_name:
#             je_rto = frappe.new_doc("Journal Entry")
#             je_rto.voucher_type = "Journal Entry"
#             je_rto.company = doc.company
#             je_rto.posting_date = getdate()
#             je_rto.title = f"RTO - {doc.customer} - {doc.custom_rto_office}"
#             je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
#             je_rto.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_registration_charge,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": doc.custom_rto_office
#             })
#             je_rto.append("accounts", {
#                 # "account": "RTO Charges Payable - A",
#                 "account": f"{doc.custom_rto_office} Payable - A",
#                 "party_type": "Supplier",
#                 "party": doc.custom_rto_office,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_registration_charge,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_rto.save()
#             frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

#             # Update journal_entry_id in RTO Registration
#             rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#             rto_doc.journal_entry_id = je_rto.name
#             rto_doc.save()

#         # Insurance Journal Entry
#         if insurance_doc_name:
#             je_insurance = frappe.new_doc("Journal Entry")
#             je_insurance.voucher_type = "Journal Entry"
#             je_insurance.company = doc.company
#             je_insurance.posting_date = getdate()
#             je_insurance.title = f"Ins - {doc.customer} - {doc.custom_insurance_provider}"
#             je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
#             je_insurance.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_insurance_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": doc.custom_insurance_provider
#             })
#             je_insurance.append("accounts", {
#                 # "account": "Insurance Charges Payable - A",
#                 "account": f"{doc.custom_insurance_provider} Payable - A",
#                 "party_type": "Supplier",
#                 "party": doc.custom_insurance_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_insurance_amount,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_insurance.save()
#             frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

#             # Update journal_entry_id in Vehicle Insurance
#             insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
#             insurance_doc.journal_entry_id = je_insurance.name
#             insurance_doc.save()

#         # RSA Journal Entry
#         if rsa_doc_name:
#             je_rsa = frappe.new_doc("Journal Entry")
#             je_rsa.voucher_type = "Journal Entry"
#             je_rsa.company = doc.company
#             je_rsa.posting_date = getdate()
#             je_rsa.title = f"RSA - {doc.customer} - {doc.custom_rsa_provider}"
#             je_rsa.remark = f"RSA charge of ₹{doc.custom_rsa_amount} for Sales Invoice {doc.name} paid to {doc.custom_rsa_provider}."
#             je_rsa.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_rsa_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": doc.custom_rsa_provider
#             })
#             je_rsa.append("accounts", {
#                 "account": f"{doc.custom_rsa_provider} Payable - A",
#                 "party_type": "Supplier",
#                 "party": doc.custom_rsa_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_rsa_amount,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_rsa.save()
#             frappe.msgprint(_("Draft RSA Journal Entry {0} created.").format(je_rsa.name))

#             # Update journal_entry_id in Vehicle RSA
#             rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
#             rsa_doc.journal_entry_id = je_rsa.name
#             rsa_doc.save()

#         # Extended Warranty Journal Entry
#         if extended_warranty_doc_name:
#             je_warranty = frappe.new_doc("Journal Entry")
#             je_warranty.voucher_type = "Journal Entry"
#             je_warranty.company = doc.company
#             je_warranty.posting_date = getdate()
#             je_warranty.title = f"EW - {doc.customer} - {doc.custom_extended_warranty_provider}"
#             je_warranty.remark = f"Extended Warranty charge of ₹{doc.custom_extended_warranty_amount} for Sales Invoice {doc.name} paid to {doc.custom_extended_warranty_provider}."
#             je_warranty.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_extended_warranty_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": doc.custom_extended_warranty_provider
#             })
#             je_warranty.append("accounts", {
#                 "account": f"{doc.custom_extended_warranty_provider} Payable - A",
#                 "party_type": "Supplier",
#                 "party": doc.custom_extended_warranty_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_extended_warranty_amount,
#                 "cost_center": "Main - A",
#                 "against_account": "Debtors - A"
#             })
#             je_warranty.save()
#             frappe.msgprint(_("Draft Extended Warranty Journal Entry {0} created.").format(je_warranty.name))

#             # Update journal_entry_id in Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc("Vehicle Extended Warranty", extended_warranty_doc_name)
#             warranty_doc.journal_entry_id = je_warranty.name
#             warranty_doc.save()

#         # Finance Journal Entry
#         if finance_doc_name:
#             je_finance = frappe.new_doc("Journal Entry")
#             je_finance.voucher_type = "Journal Entry"
#             je_finance.company = doc.company
#             je_finance.posting_date = getdate()
#             je_finance.title = f"FIN - {doc.customer} - {doc.custom_finance_provider}"
#             je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
#             je_finance.append("accounts", {
#                 "account": f"{doc.custom_finance_provider} Receivable - A",
#                 "party_type": "Customer",
#                 "party": doc.custom_finance_provider,
#                 "debit_in_account_currency": doc.custom_finance_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": "Main - A",
#                 "against_account": doc.customer
#             })
#             je_finance.append("accounts", {
#                 "account": "Debtors - A",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_finance_amount,
#                 "cost_center": "Main - A",
#                 "against_account": doc.custom_finance_provider
#             })
#             je_finance.save()
#             frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

#             # Update journal_entry_id in Vehicle Finance
#             finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
#             finance_doc.journal_entry_id = je_finance.name
#             finance_doc.save()

#         # Miscellaneous Journal Entries
#         if misc_sales_doc_name:
#             misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
#             for misc in doc.custom_miscellaneous:
#                 if misc.amount > 0:
#                     je_misc = frappe.new_doc("Journal Entry")
#                     je_misc.voucher_type = "Journal Entry"
#                     je_misc.company = doc.company
#                     je_misc.posting_date = getdate()
#                     je_misc.title = f"Misc - {doc.customer} - {misc.misc_account}"
#                     je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
#                     je_misc.append("accounts", {
#                         "account": "Debtors - A",
#                         "party_type": "Customer",
#                         "party": doc.customer,
#                         "debit_in_account_currency": misc.amount,
#                         "credit_in_account_currency": 0,
#                         "cost_center": "Main - A",
#                         "against_account": misc.misc_account
#                     })
#                     je_misc.append("accounts", {
#                         "account": f"{misc.misc_account} Payable - A",
#                         "party_type": "Supplier",
#                         "party": misc.misc_account,
#                         "debit_in_account_currency": 0,
#                         "credit_in_account_currency": misc.amount,
#                         "cost_center": "Main - A",
#                         "against_account": "Debtors - A"
#                     })
#                     je_misc.save()
#                     frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))

#                     # Update journal_entry_id in Vehicle Misc Sales
#                     for misc_account in misc_sales_doc.misc_accounts:
#                         if misc_account.misc_account == misc.misc_account and not misc_account.journal_entry_id:
#                             misc_account.journal_entry_id = je_misc.name
#                             break
#                     misc_sales_doc.save()

#         # Commit all changes if everything is successful
#         frappe.db.commit()

#     except Exception as e:
#         # Rollback all changes
#         frappe.db.rollback()
#         frappe.log_error(f"Error in Sales Invoice submission: {str(e)}")
#         frappe.throw(f"Failed to process Sales Invoice due to: {str(e)}. No documents or journal entries were created.")

# @frappe.whitelist()
# def get_insurance_policies(provider):
#     """Fetch insurance policies from the custom_under_insurer child table of the Supplier doctype."""
#     policies = frappe.get_all(
#         "Insurance Policy",
#         filters={
#             "parent": provider,
#             "parenttype": "Supplier",
#             "parentfield": "custom_under_insurer"
#         },
#         fields=["policy_name"]
#     )
#     return policies


# def update_items_with_chassis_numbers(doc):
#     """Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers."""
#     item_chassis_map = {}

#     # Group chassis numbers by item code
#     for vin in doc.custom_vin:
#         if vin.item not in item_chassis_map:
#             item_chassis_map[vin.item] = []
#         item_chassis_map[vin.item].append(vin.chassis_number)

#     # Update items table
#     for item in doc.items:
#         if item.item_code in item_chassis_map:
#             item.serial_no = "\n".join(item_chassis_map[item.item_code])


# def update_serial_no_with_vsm(doc, vsm_doc_name):
#     """Update Serial No doctype with VSM ID when `update_stock` is checked."""
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
#             serial_no_doc.custom_vsm_id = vsm_doc_name
#             serial_no_doc.save()


# def update_customer_vsm(doc, vsm_doc_name):
#     """
#     Update the Customer doctype's `custom_vin` child table with VSM ID.
#     - If chassis number exists, update the `vsm_id`.
#     - If chassis number does not exist, append a new row.
#     """
#     if not doc.customer:
#         frappe.throw("Customer is required to update VSM ID in Customer doctype.")

#     customer_doc = frappe.get_doc("Customer", doc.customer)

#     for vin in doc.get("custom_vin"):
#         existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)

#         if existing_vin:
#             existing_vin.vsm_id = vsm_doc_name
#         else:
#             customer_doc.append("custom_vin", {
#                 "chassis_number": vin.chassis_number,
#                 "vsm_id": vsm_doc_name
#             })

#     customer_doc.save(ignore_permissions=True)


# def create_or_update_vehicle_sales_master(doc):
#     """Creates or updates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
#     if not doc.custom_vin:
#         frappe.throw("Chassis Number details are required in VIN table.")
#     vin = doc.custom_vin[0]

#     # Check for existing VSM
#     vsm_doc_name = frappe.db.get_value("Vehicle Sales Master", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if vsm_doc_name:
#             # Update existing VSM
#             vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#             vsm_doc.update({
#                 "customer": doc.customer,
#                 "chassis_number": vin.chassis_number,
#                 "engine_number": vin.engine_number,
#                 "vehicle_color": vin.vehicle_color,
#                 "manufacturing_date": vin.manufacturing_date,
#                 "is_delivered": 1 if doc.update_stock else 0
#             })
#             vsm_doc.save()
#         else:
#             # Create new VSM
#             vsm_doc = frappe.get_doc({
#                 "doctype": "Vehicle Sales Master",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "chassis_number": vin.chassis_number,
#                 "engine_number": vin.engine_number,
#                 "vehicle_color": vin.vehicle_color,
#                 "manufacturing_date": vin.manufacturing_date,
#                 "is_delivered": 1 if doc.update_stock else 0
#             })
#             vsm_doc.insert()
#             vsm_doc_name = vsm_doc.name
#         return vsm_doc_name
#     except frappe.DuplicateEntryError:
#         frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating VSM: {str(e)}")
#         raise


# def create_or_update_rto_registration(doc, vsm_doc_name):
#     """Creates or updates an RTO Registration document if applicable."""
#     # Check for existing RTO Registration
#     rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if rto_doc_name:
#             # Update existing RTO Registration
#             rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#             rto_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "rto_office": doc.custom_rto_office,
#                 "registration_charge": doc.custom_registration_charge,
#                 "registration_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rto_doc.save()
#         else:
#             # Create new RTO Registration
#             rto_doc = frappe.get_doc({
#                 "doctype": "RTO Registration",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "rto_office": doc.custom_rto_office,
#                 "registration_charge": doc.custom_registration_charge,
#                 "registration_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rto_doc.insert()
#             rto_doc_name = rto_doc.name
#         return rto_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating RTO Registration: {str(e)}")
#         raise


# def create_or_update_vehicle_insurance(doc, vsm_doc_name):
#     """Creates or updates a Vehicle Insurance document if applicable."""
#     # Check for existing Vehicle Insurance
#     insurance_doc_name = frappe.db.get_value("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         policies = get_insurance_policies(doc.custom_insurance_provider)
#         if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
#             frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
        
#         if insurance_doc_name:
#             # Update existing Vehicle Insurance
#             insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
#             insurance_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "insurance_provider": doc.custom_insurance_provider,
#                 "policy_name": doc.custom_insurance_policy,
#                 "insurance_amount": doc.custom_insurance_amount,
#                 "insurance_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             insurance_doc.save()
#         else:
#             # Create new Vehicle Insurance
#             insurance_doc = frappe.get_doc({
#                 "doctype": "Vehicle Insurance",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "insurance_provider": doc.custom_insurance_provider,
#                 "policy_name": doc.custom_insurance_policy,
#                 "insurance_amount": doc.custom_insurance_amount,
#                 "insurance_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             insurance_doc.insert()
#             insurance_doc_name = insurance_doc.name
#         return insurance_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Insurance: {str(e)}")
#         raise


# def create_or_update_vehicle_finance(doc, vsm_doc_name):
#     """Creates or updates a Vehicle Finance document if applicable."""
#     # Check for existing Vehicle Finance
#     finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if finance_doc_name:
#             # Update existing Vehicle Finance
#             finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
#             finance_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "finance_provider": doc.custom_finance_provider,
#                 "loan_amount": doc.custom_finance_amount,
#                 "loan_status": "Pending",
#                 "journal_status": "Draft",
#                 "loan_type": "New Vehicle"
#             })
#             finance_doc.save()
#         else:
#             # Create new Vehicle Finance
#             finance_doc = frappe.get_doc({
#                 "doctype": "Vehicle Finance",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "finance_provider": doc.custom_finance_provider,
#                 "loan_amount": doc.custom_finance_amount,
#                 "loan_status": "Pending",
#                 "journal_status": "Draft",
#                 "loan_type": "New Vehicle"
#             })
#             finance_doc.insert()
#             finance_doc_name = finance_doc.name
#         return finance_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Finance: {str(e)}")
#         raise


# def create_or_update_vehicle_rsa(doc, vsm_doc_name):
#     """Creates or updates a Vehicle RSA document if applicable."""
#     # Check for existing Vehicle RSA
#     rsa_doc_name = frappe.db.get_value("Vehicle RSA", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if rsa_doc_name:
#             # Update existing Vehicle RSA
#             rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
#             rsa_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "rsa_provider": doc.custom_rsa_provider,
#                 "rsa_amount": doc.custom_rsa_amount,
#                 "rsa_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rsa_doc.save()
#         else:
#             # Create new Vehicle RSA
#             rsa_doc = frappe.get_doc({
#                 "doctype": "Vehicle RSA",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "rsa_provider": doc.custom_rsa_provider,
#                 "rsa_amount": doc.custom_rsa_amount,
#                 "rsa_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rsa_doc.insert()
#             rsa_doc_name = rsa_doc.name
#         return rsa_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle RSA: {str(e)}")
#         raise


# def create_or_update_vehicle_extended_warranty(doc, vsm_doc_name):
#     """Creates or updates a Vehicle Extended Warranty document if applicable."""
#     # Check for existing Vehicle Extended Warranty
#     warranty_doc_name = frappe.db.get_value("Vehicle Extended Warranty", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if warranty_doc_name:
#             # Update existing Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc("Vehicle Extended Warranty", warranty_doc_name)
#             warranty_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "extended_warranty_provider": doc.custom_extended_warranty_provider,
#                 "extended_warranty_amount": doc.custom_extended_warranty_amount,
#                 "warranty_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             warranty_doc.save()
#         else:
#             # Create new Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc({
#                 "doctype": "Vehicle Extended Warranty",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "extended_warranty_provider": doc.custom_extended_warranty_provider,
#                 "extended_warranty_amount": doc.custom_extended_warranty_amount,
#                 "warranty_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             warranty_doc.insert()
#             warranty_doc_name = warranty_doc.name
#         return warranty_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Extended Warranty: {str(e)}")
#         raise


# def create_or_update_vehicle_misc_sales(doc, vsm_doc_name):
#     """Creates or updates a Vehicle Misc Sales document if applicable."""
#     # Check for existing Vehicle Misc Sales
#     misc_sales_doc_name = frappe.db.get_value("Vehicle Misc Sales", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         misc_accounts = [
#             {
#                 "misc_account": misc.misc_account,
#                 "amount": misc.amount
#             }
#             for misc in doc.custom_miscellaneous if misc.amount > 0
#         ]
        
#         if misc_sales_doc_name:
#             # Update existing Vehicle Misc Sales
#             misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
#             misc_sales_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "misc_accounts": misc_accounts
#             })
#             misc_sales_doc.save()
#         else:
#             # Create new Vehicle Misc Sales
#             misc_sales_doc = frappe.get_doc({
#                 "doctype": "Vehicle Misc Sales",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "misc_accounts": misc_accounts
#             })
#             misc_sales_doc.insert()
#             misc_sales_doc_name = misc_sales_doc.name
#         return misc_sales_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Misc Sales: {str(e)}")
#         raise

import frappe
from frappe.utils import getdate
from autowings_app.custom_scripts.utils import get_autowings_settings

def on_submit_sales_invoice(doc, method):
    """
    On Submit Hook for Sales Invoice:
    - Create or update VSM, RTO, Insurance, Finance, RSA, Extended Warranty, Smart Card, and Misc Sales documents.
    - Create draft Journal Entries for RTO, Insurance, Finance, RSA, Extended Warranty, Smart Card, Miscellaneous charges, and RTO Additional Accounts.
    - Update journal_entry_id and journal_status in respective documents and child tables.
    - Update Serial No and Customer doctypes with VSM ID.
    - If any document or journal entry creation fails, rollback all changes and prevent Sales Invoice submission.
    """
    if doc.custom_sale_type != "Vehicle":
        return

    try:
        # Get company and abbreviation from Autowings Settings
        settings = get_autowings_settings()
        company = settings["company"]
        company_abbr = settings["abbr"]

        # Create or update Vehicle Sales Master (VSM)
        vsm_doc_name = create_or_update_vehicle_sales_master(doc, company)

        # Initialize document names
        rto_doc_name = None
        insurance_doc_name = None
        finance_doc_name = None
        rsa_doc_name = None
        extended_warranty_doc_name = None
        smart_card_doc_name = None
        misc_sales_doc_name = None

        # Create or update RTO Registration if applicable
        if doc.custom_rto_office and doc.custom_registration_charge:
            rto_doc_name = create_or_update_rto_registration(doc, vsm_doc_name, company)

        # Create or update Vehicle Smart Card if applicable
        if hasattr(doc, "custom_rto_additional_accounts") and any(acc.account == "Smart Card" and acc.amount > 0 for acc in doc.custom_rto_additional_accounts):
            smart_card_doc_name = create_or_update_vehicle_smart_card(doc, vsm_doc_name, rto_doc_name, company)

        # Create or update Vehicle Insurance if applicable
        if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
            insurance_doc_name = create_or_update_vehicle_insurance(doc, vsm_doc_name, company)

        # Create or update Vehicle Finance if applicable
        if doc.custom_finance_provider and doc.custom_finance_amount:
            finance_doc_name = create_or_update_vehicle_finance(doc, vsm_doc_name, company)

        # Create or update Vehicle RSA if applicable
        if doc.custom_rsa_provider and doc.custom_rsa_amount > 0:
            rsa_doc_name = create_or_update_vehicle_rsa(doc, vsm_doc_name, company)

        # Create or update Vehicle Extended Warranty if applicable
        if doc.custom_extended_warranty_provider and doc.custom_extended_warranty_amount > 0:
            extended_warranty_doc_name = create_or_update_vehicle_extended_warranty(doc, vsm_doc_name, company)

        # Create or update Vehicle Misc Sales if applicable
        misc_entries = [misc for misc in doc.custom_miscellaneous if misc.amount > 0]
        if misc_entries:
            misc_sales_doc_name = create_or_update_vehicle_misc_sales(doc, vsm_doc_name, company)

        # Update Serial No and Customer doctypes with VSM ID
        if doc.update_stock:
            update_serial_no_with_vsm(doc, vsm_doc_name)
            update_customer_vsm(doc, vsm_doc_name)

        # Update VSM with all relevant IDs and statuses
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
        vsm_doc.is_delivered = 1 if doc.update_stock else 0

        if rto_doc_name:
            vsm_doc.rto_registration = 1
            vsm_doc.rto_registration_id = rto_doc_name

        if smart_card_doc_name:
            vsm_doc.is_smart_card = 1
            vsm_doc.smart_card_id = smart_card_doc_name

        if insurance_doc_name:
            vsm_doc.is_insurance = 1
            vsm_doc.insurance_id = insurance_doc_name

        if finance_doc_name:
            vsm_doc.is_finance = 1
            vsm_doc.finance_id = finance_doc_name

        if rsa_doc_name:
            vsm_doc.is_rsa = 1
            vsm_doc.rsa_id = rsa_doc_name

        if extended_warranty_doc_name:
            vsm_doc.is_extended_warranty = 1
            vsm_doc.extended_warranty_id = extended_warranty_doc_name

        if misc_sales_doc_name:
            vsm_doc.vehicle_misc_sales_id = misc_sales_doc_name

        # Save VSM updates
        vsm_doc.save()

        # Create Journal Entries and update journal_entry_id
        # RTO Journal Entry
        if rto_doc_name:
            je_rto = frappe.new_doc("Journal Entry")
            je_rto.voucher_type = "Journal Entry"
            je_rto.company = company
            je_rto.posting_date = getdate()
            je_rto.title = f"RTO - {doc.customer} - {doc.custom_rto_office}"
            je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
            je_rto.append("accounts", {
                "account": f"Debtors - {company_abbr}",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": doc.custom_registration_charge,
                "credit_in_account_currency": 0,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.custom_rto_office
            })
            je_rto.append("accounts", {
                "account": f"{doc.custom_rto_office} Payable - {company_abbr}",
                "party_type": "Supplier",
                "party": doc.custom_rto_office,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": doc.custom_registration_charge,
                "cost_center": f"Main - {company_abbr}",
                "against_account": f"Debtors - {company_abbr}"
            })
            je_rto.save()
            frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

            # Update journal_entry_id in RTO Registration
            rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
            rto_doc.journal_entry_id = je_rto.name
            rto_doc.journal_status = "Draft"
            rto_doc.save()

            # Process custom_rto_additional_accounts and create journal entries
            if hasattr(doc, "custom_rto_additional_accounts"):
                for rto_additional in doc.custom_rto_additional_accounts:
                    if rto_additional.amount > 0:
                        # Create Journal Entry for RTO Additional Account
                        je_rto_additional = frappe.new_doc("Journal Entry")
                        je_rto_additional.voucher_type = "Journal Entry"
                        je_rto_additional.company = company
                        je_rto_additional.posting_date = getdate()
                        je_rto_additional.title = f"RTO Addl - {doc.customer} - {rto_additional.account}"
                        je_rto_additional.remark = f"RTO Additional charge of ₹{rto_additional.amount} for Sales Invoice {doc.name} under {rto_additional.account}."
                        je_rto_additional.append("accounts", {
                            "account": f"Debtors - {company_abbr}",
                            "party_type": "Customer",
                            "party": doc.customer,
                            "debit_in_account_currency": rto_additional.amount,
                            "credit_in_account_currency": 0,
                            "cost_center": f"Main - {company_abbr}",
                            "against_account": rto_additional.account
                        })
                        je_rto_additional.append("accounts", {
                            "account": f"{rto_additional.account} Payable - {company_abbr}",
                            "party_type": "Supplier",
                            "party": rto_additional.account,
                            "debit_in_account_currency": 0,
                            "credit_in_account_currency": rto_additional.amount,
                            "cost_center": f"Main - {company_abbr}",
                            "against_account": f"Debtors - {company_abbr}"
                        })
                        je_rto_additional.save()
                        frappe.msgprint(_("Draft RTO Additional Journal Entry {0} created for {1}.").format(je_rto_additional.name, rto_additional.account))

                        # Update additional_accounts in RTO Registration with journal_entry_id and journal_status
                        if not hasattr(rto_doc, "additional_accounts"):
                            rto_doc.additional_accounts = []

                        # Check if the account already exists in additional_accounts
                        existing_entry = next((entry for entry in rto_doc.additional_accounts if entry.account == rto_additional.account), None)
                        if existing_entry:
                            existing_entry.journal_entry_id = je_rto_additional.name
                            existing_entry.status = "Draft"
                            if rto_additional.account == "Smart Card" and smart_card_doc_name:
                                existing_entry.smart_card_id = smart_card_doc_name
                        else:
                            entry_data = {
                                "account": rto_additional.account,
                                "amount": rto_additional.amount,
                                "journal_entry_id": je_rto_additional.name,
                                "status": "Draft"
                            }
                            if rto_additional.account == "Smart Card" and smart_card_doc_name:
                                entry_data["smart_card_id"] = smart_card_doc_name
                            rto_doc.append("additional_accounts", entry_data)
                        rto_doc.save()

                        # Update journal_entry_id in Vehicle Smart Card if applicable
                        if rto_additional.account == "Smart Card" and smart_card_doc_name:
                            smart_card_doc = frappe.get_doc("Vehicle Smart Card", smart_card_doc_name)
                            smart_card_doc.journal_entry_id = je_rto_additional.name
                            smart_card_doc.journal_status = "Draft"
                            smart_card_doc.smart_card_charge = rto_additional.amount
                            smart_card_doc.save()

        # Insurance Journal Entry
        if insurance_doc_name:
            je_insurance = frappe.new_doc("Journal Entry")
            je_insurance.voucher_type = "Journal Entry"
            je_insurance.company = company
            je_insurance.posting_date = getdate()
            je_insurance.title = f"Ins - {doc.customer} - {doc.custom_insurance_provider}"
            je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
            je_insurance.append("accounts", {
                "account": f"Debtors - {company_abbr}",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": doc.custom_insurance_amount,
                "credit_in_account_currency": 0,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.custom_insurance_provider
            })
            je_insurance.append("accounts", {
                "account": f"{doc.custom_insurance_provider} Payable - {company_abbr}",
                "party_type": "Supplier",
                "party": doc.custom_insurance_provider,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": doc.custom_insurance_amount,
                "cost_center": f"Main - {company_abbr}",
                "against_account": f"Debtors - {company_abbr}"
            })
            je_insurance.save()
            frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

            # Update journal_entry_id in Vehicle Insurance
            insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
            insurance_doc.journal_entry_id = je_insurance.name
            insurance_doc.save()

        # RSA Journal Entry
        if rsa_doc_name:
            je_rsa = frappe.new_doc("Journal Entry")
            je_rsa.voucher_type = "Journal Entry"
            je_rsa.company = company
            je_rsa.posting_date = getdate()
            je_rsa.title = f"RSA - {doc.customer} - {doc.custom_rsa_provider}"
            je_rsa.remark = f"RSA charge of ₹{doc.custom_rsa_amount} for Sales Invoice {doc.name} paid to {doc.custom_rsa_provider}."
            je_rsa.append("accounts", {
                "account": f"Debtors - {company_abbr}",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": doc.custom_rsa_amount,
                "credit_in_account_currency": 0,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.custom_rsa_provider
            })
            je_rsa.append("accounts", {
                "account": f"{doc.custom_rsa_provider} Payable - {company_abbr}",
                "party_type": "Supplier",
                "party": doc.custom_rsa_provider,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": doc.custom_rsa_amount,
                "cost_center": f"Main - {company_abbr}",
                "against_account": f"Debtors - {company_abbr}"
            })
            je_rsa.save()
            frappe.msgprint(_("Draft RSA Journal Entry {0} created.").format(je_rsa.name))

            # Update journal_entry_id in Vehicle RSA
            rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
            rsa_doc.journal_entry_id = je_rsa.name
            rsa_doc.save()

        # Extended Warranty Journal Entry
        if extended_warranty_doc_name:
            je_warranty = frappe.new_doc("Journal Entry")
            je_warranty.voucher_type = "Journal Entry"
            je_warranty.company = company
            je_warranty.posting_date = getdate()
            je_warranty.title = f"EW - {doc.customer} - {doc.custom_extended_warranty_provider}"
            je_warranty.remark = f"Extended Warranty charge of ₹{doc.custom_extended_warranty_amount} for Sales Invoice {doc.name} paid to {doc.custom_extended_warranty_provider}."
            je_warranty.append("accounts", {
                "account": f"Debtors - {company_abbr}",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": doc.custom_extended_warranty_amount,
                "credit_in_account_currency": 0,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.custom_extended_warranty_provider
            })
            je_warranty.append("accounts", {
                "account": f"{doc.custom_extended_warranty_provider} Payable - {company_abbr}",
                "party_type": "Supplier",
                "party": doc.custom_extended_warranty_provider,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": doc.custom_extended_warranty_amount,
                "cost_center": f"Main - {company_abbr}",
                "against_account": f"Debtors - {company_abbr}"
            })
            je_warranty.save()
            frappe.msgprint(_("Draft Extended Warranty Journal Entry {0} created.").format(je_warranty.name))

            # Update journal_entry_id in Vehicle Extended Warranty
            warranty_doc = frappe.get_doc("Vehicle Extended Warranty", extended_warranty_doc_name)
            warranty_doc.journal_entry_id = je_warranty.name
            warranty_doc.save()

        # Finance Journal Entry
        if finance_doc_name:
            je_finance = frappe.new_doc("Journal Entry")
            je_finance.voucher_type = "Journal Entry"
            je_finance.company = company
            je_finance.posting_date = getdate()
            je_finance.title = f"FIN - {doc.customer} - {doc.custom_finance_provider}"
            je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
            je_finance.append("accounts", {
                "account": f"{doc.custom_finance_provider} Receivable - {company_abbr}",
                "party_type": "Customer",
                "party": doc.custom_finance_provider,
                "debit_in_account_currency": doc.custom_finance_amount,
                "credit_in_account_currency": 0,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.customer
            })
            je_finance.append("accounts", {
                "account": f"Debtors - {company_abbr}",
                "party_type": "Customer",
                "party": doc.customer,
                "debit_in_account_currency": 0,
                "credit_in_account_currency": doc.custom_finance_amount,
                "cost_center": f"Main - {company_abbr}",
                "against_account": doc.custom_finance_provider
            })
            je_finance.save()
            frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

            # Update journal_entry_id in Vehicle Finance
            finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
            finance_doc.journal_entry_id = je_finance.name
            finance_doc.save()

        # Miscellaneous Journal Entries
        if misc_sales_doc_name:
            misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
            for misc in doc.custom_miscellaneous:
                if misc.amount > 0:
                    je_misc = frappe.new_doc("Journal Entry")
                    je_misc.voucher_type = "Journal Entry"
                    je_misc.company = company
                    je_misc.posting_date = getdate()
                    # je_misc.title = f"Misc - {doc.customer} - {misc.misc_account}"
                    je_misc.title = f"Misc - {doc.customer} - Multiple Accounts (Sales Invoice {doc.name})"
                    je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
                    je_misc.append("accounts", {
                        "account": f"Debtors - {company_abbr}",
                        "party_type": "Customer",
                        "party": doc.customer,
                        "debit_in_account_currency": misc.amount,
                        "credit_in_account_currency": 0,
                        "cost_center": f"Main - {company_abbr}",
                        "against_account": misc.misc_account
                    })
                    je_misc.append("accounts", {
                        "account": f"{misc.misc_account} Payable - {company_abbr}",
                        "party_type": "Supplier",
                        "party": misc.misc_account,
                        "debit_in_account_currency": 0,
                        "credit_in_account_currency": misc.amount,
                        "cost_center": f"Main - {company_abbr}",
                        "against_account": f"Debtors - {company_abbr}"
                    })
                    je_misc.save()
                    frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))

                    # Update journal_entry_id in Vehicle Misc Sales
                    for misc_account in misc_sales_doc.misc_accounts:
                        if misc_account.misc_account == misc.misc_account and not misc_account.journal_entry_id:
                            misc_account.journal_entry_id = je_misc.name
                            break
                    misc_sales_doc.save()

        # Commit all changes if everything is successful
        frappe.db.commit()

    except Exception as e:
        # Rollback all changes
        frappe.db.rollback()
        frappe.log_error(f"Error in Sales Invoice submission: {str(e)}")
        frappe.throw(f"Failed to process Sales Invoice due to: {str(e)}. No documents or journal entries were created.")

@frappe.whitelist()
def get_insurance_policies(provider):
    """Fetch insurance policies from the custom_under_insurer child table of the Supplier doctype."""
    policies = frappe.get_all(
        "Insurance Policy",
        filters={
            "parent": provider,
            "parenttype": "Supplier",
            "parentfield": "custom_under_insurer"
        },
        fields=["policy_name"]
    )
    return policies

def update_items_with_chassis_numbers(doc):
    """Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers."""
    item_chassis_map = {}

    # Group chassis numbers by item code
    for vin in doc.custom_vin:
        if vin.item not in item_chassis_map:
            item_chassis_map[vin.item] = []
        item_chassis_map[vin.item].append(vin.chassis_number)

    # Update items table
    for item in doc.items:
        if item.item_code in item_chassis_map:
            item.serial_no = "\n".join(item_chassis_map[item.item_code])

def update_serial_no_with_vsm(doc, vsm_doc_name):
    """Update Serial No doctype with VSM ID when `update_stock` is checked."""
    for vin in doc.get("custom_vin"):
        if frappe.db.exists("Serial No", vin.chassis_number):
            serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
            serial_no_doc.custom_vsm_id = vsm_doc_name
            serial_no_doc.save()

def update_customer_vsm(doc, vsm_doc_name):
    """
    Update the Customer doctype's `custom_vin` child table with VSM ID.
    - If chassis number exists, update the `vsm_id`.
    - If chassis number does not exist, append a new row.
    """
    if not doc.customer:
        frappe.throw("Customer is required to update VSM ID in Customer doctype.")

    customer_doc = frappe.get_doc("Customer", doc.customer)

    for vin in doc.get("custom_vin"):
        existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)

        if existing_vin:
            existing_vin.vsm_id = vsm_doc_name
        else:
            customer_doc.append("custom_vin", {
                "chassis_number": vin.chassis_number,
                "vsm_id": vsm_doc_name
            })

    customer_doc.save(ignore_permissions=True)

def create_or_update_vehicle_sales_master(doc, company):
    """Creates or updates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
    if not doc.custom_vin:
        frappe.throw("Chassis Number details are required in VIN table.")
    vin = doc.custom_vin[0]

    # Check for existing VSM
    vsm_doc_name = frappe.db.get_value("Vehicle Sales Master", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if vsm_doc_name:
            # Update existing VSM
            vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
            vsm_doc.update({
                "customer": doc.customer,
                "chassis_number": vin.chassis_number,
                "engine_number": vin.engine_number,
                "vehicle_color": vin.vehicle_color,
                "manufacturing_date": vin.manufacturing_date,
                "is_delivered": 1 if doc.update_stock else 0,
                "company": company
            })
            vsm_doc.save()
        else:
            # Create new VSM
            vsm_doc = frappe.get_doc({
                "doctype": "Vehicle Sales Master",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "chassis_number": vin.chassis_number,
                "engine_number": vin.engine_number,
                "vehicle_color": vin.vehicle_color,
                "manufacturing_date": vin.manufacturing_date,
                "is_delivered": 1 if doc.update_stock else 0,
                "company": company
            })
            vsm_doc.insert()
            vsm_doc_name = vsm_doc.name
        return vsm_doc_name
    except frappe.DuplicateEntryError:
        frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
    except Exception as e:
        frappe.log_error(f"Error creating/updating VSM: {str(e)}")
        raise

def create_or_update_rto_registration(doc, vsm_doc_name, company):
    """Creates or updates an RTO Registration document if applicable."""
    # Check for existing RTO Registration
    rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if rto_doc_name:
            # Update existing RTO Registration
            rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
            rto_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "rto_office": doc.custom_rto_office,
                "registration_charge": doc.custom_registration_charge,
                "registration_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Due",
                "status": "Due Application Entry"
            })
            rto_doc.save()
        else:
            # Create new RTO Registration
            rto_doc = frappe.get_doc({
                "doctype": "RTO Registration",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "rto_office": doc.custom_rto_office,
                "registration_charge": doc.custom_registration_charge,
                "registration_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Due",
                "status": "Due Application Entry"

            })
            rto_doc.insert()
            rto_doc_name = rto_doc.name
        return rto_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating RTO Registration: {str(e)}")
        raise

def create_or_update_vehicle_smart_card(doc, vsm_doc_name, rto_doc_name, company):
    """Creates or updates a Vehicle Smart Card document if applicable."""
    vin = doc.custom_vin[0]
    smart_card_entry = next((acc for acc in doc.custom_rto_additional_accounts if acc.account == "Smart Card" and acc.amount > 0), None)
    if not smart_card_entry:
        return None

    # Check for existing Vehicle Smart Card
    smart_card_doc_name = frappe.db.get_value("Vehicle Smart Card", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if smart_card_doc_name:
            # Update existing Vehicle Smart Card
            smart_card_doc = frappe.get_doc("Vehicle Smart Card", smart_card_doc_name)
            smart_card_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "sales_invoice": doc.name,
                "rto_registration_id": rto_doc_name,
                "chassis_number": vin.chassis_number,
                "smart_card_charge": smart_card_entry.amount,
                "smart_card_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Due",
                "status": "Registration Pending"
            })
            smart_card_doc.save()
        else:
            # Create new Vehicle Smart Card
            smart_card_doc = frappe.get_doc({
                "doctype": "Vehicle Smart Card",
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "sales_invoice": doc.name,
                "rto_registration_id": rto_doc_name,
                "chassis_number": vin.chassis_number,
                "smart_card_charge": smart_card_entry.amount,
                "smart_card_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Due",
                "status": "Registration Pending"

            })
            smart_card_doc.insert()
            smart_card_doc_name = smart_card_doc.name
        return smart_card_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle Smart Card: {str(e)}")
        raise

def create_or_update_vehicle_insurance(doc, vsm_doc_name, company):
    """Creates or updates a Vehicle Insurance document if applicable."""
    # Check for existing Vehicle Insurance
    insurance_doc_name = frappe.db.get_value("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        policies = get_insurance_policies(doc.custom_insurance_provider)
        if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
            frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
        
        if insurance_doc_name:
            # Update existing Vehicle Insurance
            insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
            insurance_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "insurance_provider": doc.custom_insurance_provider,
                "policy_name": doc.custom_insurance_policy,
                "insurance_amount": doc.custom_insurance_amount,
                "insurance_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            insurance_doc.save()
        else:
            # Create new Vehicle Insurance
            insurance_doc = frappe.get_doc({
                "doctype": "Vehicle Insurance",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "insurance_provider": doc.custom_insurance_provider,
                "policy_name": doc.custom_insurance_policy,
                "insurance_amount": doc.custom_insurance_amount,
                "insurance_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            insurance_doc.insert()
            insurance_doc_name = insurance_doc.name
        return insurance_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle Insurance: {str(e)}")
        raise

def create_or_update_vehicle_finance(doc, vsm_doc_name, company):
    """Creates or updates a Vehicle Finance document if applicable."""
    # Check for existing Vehicle Finance
    finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if finance_doc_name:
            # Update existing Vehicle Finance
            finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
            finance_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "finance_provider": doc.custom_finance_provider,
                "loan_amount": doc.custom_finance_amount,
                "loan_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Not Received",
                "status": "Due Update",
                "loan_type": "New Vehicle"
            })
            finance_doc.save()
        else:
            # Create new Vehicle Finance
            finance_doc = frappe.get_doc({
                "doctype": "Vehicle Finance",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "finance_provider": doc.custom_finance_provider,
                "loan_amount": doc.custom_finance_amount,
                "loan_status": "Pending",
                "journal_status": "Draft",
                "payment_status": "Not Received",
                "status": "Due Update",
                "loan_type": "New Vehicle"
            })
            finance_doc.insert()
            finance_doc_name = finance_doc.name
        return finance_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle Finance: {str(e)}")
        raise

def create_or_update_vehicle_rsa(doc, vsm_doc_name, company):
    """Creates or updates a Vehicle RSA document if applicable."""
    # Check for existing Vehicle RSA
    rsa_doc_name = frappe.db.get_value("Vehicle RSA", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if rsa_doc_name:
            # Update existing Vehicle RSA
            rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
            rsa_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "rsa_provider": doc.custom_rsa_provider,
                "rsa_amount": doc.custom_rsa_amount,
                "rsa_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            rsa_doc.save()
        else:
            # Create new Vehicle RSA
            rsa_doc = frappe.get_doc({
                "doctype": "Vehicle RSA",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "rsa_provider": doc.custom_rsa_provider,
                "rsa_amount": doc.custom_rsa_amount,
                "rsa_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            rsa_doc.insert()
            rsa_doc_name = rsa_doc.name
        return rsa_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle RSA: {str(e)}")
        raise

def create_or_update_vehicle_extended_warranty(doc, vsm_doc_name, company):
    """Creates or updates a Vehicle Extended Warranty document if applicable."""
    # Check for existing Vehicle Extended Warranty
    warranty_doc_name = frappe.db.get_value("Vehicle Extended Warranty", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        if warranty_doc_name:
            # Update existing Vehicle Extended Warranty
            warranty_doc = frappe.get_doc("Vehicle Extended Warranty", warranty_doc_name)
            warranty_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "extended_warranty_provider": doc.custom_extended_warranty_provider,
                "extended_warranty_amount": doc.custom_extended_warranty_amount,
                "warranty_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            warranty_doc.save()
        else:
            # Create new Vehicle Extended Warranty
            warranty_doc = frappe.get_doc({
                "doctype": "Vehicle Extended Warranty",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "extended_warranty_provider": doc.custom_extended_warranty_provider,
                "extended_warranty_amount": doc.custom_extended_warranty_amount,
                "warranty_status": "Pending",
                "status": "Due Update",
                "journal_status": "Draft"
            })
            warranty_doc.insert()
            warranty_doc_name = warranty_doc.name
        return warranty_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle Extended Warranty: {str(e)}")
        raise

def create_or_update_vehicle_misc_sales(doc, vsm_doc_name, company):
    """Creates or updates a Vehicle Misc Sales document if applicable."""
    # Check for existing Vehicle Misc Sales
    misc_sales_doc_name = frappe.db.get_value("Vehicle Misc Sales", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
    try:
        misc_accounts = [
            {
                "misc_account": misc.misc_account,
                "amount": misc.amount
            }
            for misc in doc.custom_miscellaneous if misc.amount > 0
        ]
        
        if misc_sales_doc_name:
            # Update existing Vehicle Misc Sales
            misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
            misc_sales_doc.update({
                "customer": doc.customer,
                "vsm_id": vsm_doc_name,
                "status": "Due Update",
                "misc_accounts": misc_accounts
            })
            misc_sales_doc.save()
        else:
            # Create new Vehicle Misc Sales
            misc_sales_doc = frappe.get_doc({
                "doctype": "Vehicle Misc Sales",
                "customer": doc.customer,
                "sales_invoice": doc.name,
                "vsm_id": vsm_doc_name,
                "status": "Due Update",
                "misc_accounts": misc_accounts
            })
            misc_sales_doc.insert()
            misc_sales_doc_name = misc_sales_doc.name
        return misc_sales_doc_name
    except Exception as e:
        frappe.log_error(f"Error creating/updating Vehicle Misc Sales: {str(e)}")
        raise


# import frappe
# from frappe.utils import getdate
# from autowings_app.custom_scripts.utils import get_autowings_settings

# def on_submit_sales_invoice(doc, method):
#     """
#     On Submit Hook for Sales Invoice:
#     - Create or update VSM, RTO, Insurance, Finance, RSA, Extended Warranty, and Misc Sales documents.
#     - Create draft Journal Entries for RTO, Insurance, Finance, RSA, Extended Warranty, Miscellaneous charges, and RTO Additional Accounts.
#     - Update journal_entry_id and journal_status in respective documents and child tables.
#     - Update Serial No and Customer doctypes with VSM ID.
#     - If any document or journal entry creation fails, rollback all changes and prevent Sales Invoice submission.
#     """
#     if doc.custom_sale_type != "Vehicle":
#         return

#     try:
#         # Get company and abbreviation from Autowings Settings
#         settings = get_autowings_settings()
#         company = settings["company"]
#         company_abbr = settings["abbr"]

#         # Create or update Vehicle Sales Master (VSM)
#         vsm_doc_name = create_or_update_vehicle_sales_master(doc, company)

#         # Initialize document names
#         rto_doc_name = None
#         insurance_doc_name = None
#         finance_doc_name = None
#         rsa_doc_name = None
#         extended_warranty_doc_name = None
#         misc_sales_doc_name = None

#         # Create or update RTO Registration if applicable
#         if doc.custom_rto_office and doc.custom_registration_charge:
#             rto_doc_name = create_or_update_rto_registration(doc, vsm_doc_name, company)

#         # Create or update Vehicle Insurance if applicable
#         if doc.custom_insurance_provider and doc.custom_insurance_amount and doc.custom_insurance_policy:
#             insurance_doc_name = create_or_update_vehicle_insurance(doc, vsm_doc_name, company)

#         # Create or update Vehicle Finance if applicable
#         if doc.custom_finance_provider and doc.custom_finance_amount:
#             finance_doc_name = create_or_update_vehicle_finance(doc, vsm_doc_name, company)

#         # Create or update Vehicle RSA if applicable
#         if doc.custom_rsa_provider and doc.custom_rsa_amount > 0:
#             rsa_doc_name = create_or_update_vehicle_rsa(doc, vsm_doc_name, company)

#         # Create or update Vehicle Extended Warranty if applicable
#         if doc.custom_extended_warranty_provider and doc.custom_extended_warranty_amount > 0:
#             extended_warranty_doc_name = create_or_update_vehicle_extended_warranty(doc, vsm_doc_name, company)

#         # Create or update Vehicle Misc Sales if applicable
#         misc_entries = [misc for misc in doc.custom_miscellaneous if misc.amount > 0]
#         if misc_entries:
#             misc_sales_doc_name = create_or_update_vehicle_misc_sales(doc, vsm_doc_name, company)

#         # Update Serial No and Customer doctypes with VSM ID
#         if doc.update_stock:
#             update_serial_no_with_vsm(doc, vsm_doc_name)
#             update_customer_vsm(doc, vsm_doc_name)

#         # Update VSM with all relevant IDs and statuses
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         vsm_doc.is_delivered = 1 if doc.update_stock else 0

#         if rto_doc_name:
#             vsm_doc.rto_registration = 1
#             vsm_doc.rto_registration_id = rto_doc_name

#         if insurance_doc_name:
#             vsm_doc.is_insurance = 1
#             vsm_doc.insurance_id = insurance_doc_name

#         if finance_doc_name:
#             vsm_doc.is_finance = 1
#             vsm_doc.finance_id = finance_doc_name

#         if rsa_doc_name:
#             vsm_doc.is_rsa = 1
#             vsm_doc.rsa_id = rsa_doc_name

#         if extended_warranty_doc_name:
#             vsm_doc.is_extended_warranty = 1
#             vsm_doc.extended_warranty_id = extended_warranty_doc_name

#         if misc_sales_doc_name:
#             vsm_doc.vehicle_misc_sales_id = misc_sales_doc_name

#         # Save VSM updates
#         vsm_doc.save()

#         # Create Journal Entries and update journal_entry_id
#         # RTO Journal Entry
#         if rto_doc_name:
#             je_rto = frappe.new_doc("Journal Entry")
#             je_rto.voucher_type = "Journal Entry"
#             je_rto.company = company
#             je_rto.posting_date = getdate()
#             je_rto.title = f"RTO - {doc.customer} - {doc.custom_rto_office}"
#             je_rto.remark = f"RTO charge of ₹{doc.custom_registration_charge} for Sales Invoice {doc.name} paid to {doc.custom_rto_office}."
#             je_rto.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_registration_charge,
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.custom_rto_office
#             })
#             je_rto.append("accounts", {
#                 "account": f"{doc.custom_rto_office} Payable - {company_abbr}",
#                 "party_type": "Supplier",
#                 "party": doc.custom_rto_office,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_registration_charge,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": f"Debtors - {company_abbr}"
#             })
#             je_rto.save()
#             frappe.msgprint(_("Draft RTO Journal Entry {0} created.").format(je_rto.name))

#             # Update journal_entry_id in RTO Registration
#             rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#             rto_doc.journal_entry_id = je_rto.name
#             rto_doc.journal_status = "Draft"
#             rto_doc.save()

#             # Process custom_rto_additional_accounts and create journal entries
#             if hasattr(doc, "custom_rto_additional_accounts"):
#                 for rto_additional in doc.custom_rto_additional_accounts:
#                     if rto_additional.amount > 0:
#                         # Create Journal Entry for RTO Additional Account
#                         je_rto_additional = frappe.new_doc("Journal Entry")
#                         je_rto_additional.voucher_type = "Journal Entry"
#                         je_rto_additional.company = company
#                         je_rto_additional.posting_date = getdate()
#                         je_rto_additional.title = f"RTO Addl - {doc.customer} - {rto_additional.account}"
#                         je_rto_additional.remark = f"RTO Additional charge of ₹{rto_additional.amount} for Sales Invoice {doc.name} under {rto_additional.account}."
#                         je_rto_additional.append("accounts", {
#                             "account": f"Debtors - {company_abbr}",
#                             "party_type": "Customer",
#                             "party": doc.customer,
#                             "debit_in_account_currency": rto_additional.amount,
#                             "credit_in_account_currency": 0,
#                             "cost_center": f"Main - {company_abbr}",
#                             "against_account": rto_additional.account
#                         })
#                         je_rto_additional.append("accounts", {
#                             "account": f"{rto_additional.account} Payable - {company_abbr}",
#                             "party_type": "Supplier",
#                             "party": rto_additional.account,
#                             "debit_in_account_currency": 0,
#                             "credit_in_account_currency": rto_additional.amount,
#                             "cost_center": f"Main - {company_abbr}",
#                             "against_account": f"Debtors - {company_abbr}"
#                         })
#                         je_rto_additional.save()
#                         frappe.msgprint(_("Draft RTO Additional Journal Entry {0} created for {1}.").format(je_rto_additional.name, rto_additional.account))

#                         # Update additional_accounts in RTO Registration with journal_entry_id and journal_status
#                         if not hasattr(rto_doc, "additional_accounts"):
#                             rto_doc.additional_accounts = []

#                         # Check if the account already exists in additional_accounts
#                         existing_entry = next((entry for entry in rto_doc.additional_accounts if entry.account == rto_additional.account), None)
#                         if existing_entry:
#                             existing_entry.journal_entry_id = je_rto_additional.name
#                             existing_entry.status = "Draft"
#                         else:
#                             rto_doc.append("additional_accounts", {
#                                 "account": rto_additional.account,
#                                 "amount": rto_additional.amount,
#                                 "journal_entry_id": je_rto_additional.name,
#                                 "status": "Draft"
#                             })
#                         rto_doc.save()

#         # Insurance Journal Entry
#         if insurance_doc_name:
#             je_insurance = frappe.new_doc("Journal Entry")
#             je_insurance.voucher_type = "Journal Entry"
#             je_insurance.company = company
#             je_insurance.posting_date = getdate()
#             je_insurance.title = f"Ins - {doc.customer} - {doc.custom_insurance_provider}"
#             je_insurance.remark = f"Insurance charge of ₹{doc.custom_insurance_amount} for Sales Invoice {doc.name} paid to {doc.custom_insurance_provider}."
#             je_insurance.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_insurance_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.custom_insurance_provider
#             })
#             je_insurance.append("accounts", {
#                 "account": f"{doc.custom_insurance_provider} Payable - {company_abbr}",
#                 "party_type": "Supplier",
#                 "party": doc.custom_insurance_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_insurance_amount,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": f"Debtors - {company_abbr}"
#             })
#             je_insurance.save()
#             frappe.msgprint(_("Draft Insurance Journal Entry {0} created.").format(je_insurance.name))

#             # Update journal_entry_id in Vehicle Insurance
#             insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
#             insurance_doc.journal_entry_id = je_insurance.name
#             insurance_doc.save()

#         # RSA Journal Entry
#         if rsa_doc_name:
#             je_rsa = frappe.new_doc("Journal Entry")
#             je_rsa.voucher_type = "Journal Entry"
#             je_rsa.company = company
#             je_rsa.posting_date = getdate()
#             je_rsa.title = f"RSA - {doc.customer} - {doc.custom_rsa_provider}"
#             je_rsa.remark = f"RSA charge of ₹{doc.custom_rsa_amount} for Sales Invoice {doc.name} paid to {doc.custom_rsa_provider}."
#             je_rsa.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_rsa_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.custom_rsa_provider
#             })
#             je_rsa.append("accounts", {
#                 "account": f"{doc.custom_rsa_provider} Payable - {company_abbr}",
#                 "party_type": "Supplier",
#                 "party": doc.custom_rsa_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_rsa_amount,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": f"Debtors - {company_abbr}"
#             })
#             je_rsa.save()
#             frappe.msgprint(_("Draft RSA Journal Entry {0} created.").format(je_rsa.name))

#             # Update journal_entry_id in Vehicle RSA
#             rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
#             rsa_doc.journal_entry_id = je_rsa.name
#             rsa_doc.save()

#         # Extended Warranty Journal Entry
#         if extended_warranty_doc_name:
#             je_warranty = frappe.new_doc("Journal Entry")
#             je_warranty.voucher_type = "Journal Entry"
#             je_warranty.company = company
#             je_warranty.posting_date = getdate()
#             je_warranty.title = f"EW - {doc.customer} - {doc.custom_extended_warranty_provider}"
#             je_warranty.remark = f"Extended Warranty charge of ₹{doc.custom_extended_warranty_amount} for Sales Invoice {doc.name} paid to {doc.custom_extended_warranty_provider}."
#             je_warranty.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": doc.custom_extended_warranty_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.custom_extended_warranty_provider
#             })
#             je_warranty.append("accounts", {
#                 "account": f"{doc.custom_extended_warranty_provider} Payable - {company_abbr}",
#                 "party_type": "Supplier",
#                 "party": doc.custom_extended_warranty_provider,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_extended_warranty_amount,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": f"Debtors - {company_abbr}"
#             })
#             je_warranty.save()
#             frappe.msgprint(_("Draft Extended Warranty Journal Entry {0} created.").format(je_warranty.name))

#             # Update journal_entry_id in Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc("Vehicle Extended Warranty", extended_warranty_doc_name)
#             warranty_doc.journal_entry_id = je_warranty.name
#             warranty_doc.save()

#         # Finance Journal Entry
#         if finance_doc_name:
#             je_finance = frappe.new_doc("Journal Entry")
#             je_finance.voucher_type = "Journal Entry"
#             je_finance.company = company
#             je_finance.posting_date = getdate()
#             je_finance.title = f"FIN - {doc.customer} - {doc.custom_finance_provider}"
#             je_finance.remark = f"Received ₹{doc.custom_finance_amount} from {doc.custom_finance_provider} for {doc.customer}’s vehicle purchase under Sales Invoice {doc.name}."
#             je_finance.append("accounts", {
#                 "account": f"{doc.custom_finance_provider} Receivable - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.custom_finance_provider,
#                 "debit_in_account_currency": doc.custom_finance_amount,
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.customer
#             })
#             je_finance.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": doc.customer,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": doc.custom_finance_amount,
#                 "cost_center": f"Main - {company_abbr}",
#                 "against_account": doc.custom_finance_provider
#             })
#             je_finance.save()
#             frappe.msgprint(_("Draft Finance Journal Entry {0} created.").format(je_finance.name))

#             # Update journal_entry_id in Vehicle Finance
#             finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
#             finance_doc.journal_entry_id = je_finance.name
#             finance_doc.save()

#         # Miscellaneous Journal Entries
#         if misc_sales_doc_name:
#             misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
#             for misc in doc.custom_miscellaneous:
#                 if misc.amount > 0:
#                     je_misc = frappe.new_doc("Journal Entry")
#                     je_misc.voucher_type = "Journal Entry"
#                     je_misc.company = company
#                     je_misc.posting_date = getdate()
#                     je_misc.title = f"Misc - {doc.customer} - {misc.misc_account}"
#                     je_misc.remark = f"Miscellaneous charge of ₹{misc.amount} for Sales Invoice {doc.name} paid to {misc.misc_account}."
#                     je_misc.append("accounts", {
#                         "account": f"Debtors - {company_abbr}",
#                         "party_type": "Customer",
#                         "party": doc.customer,
#                         "debit_in_account_currency": misc.amount,
#                         "credit_in_account_currency": 0,
#                         "cost_center": f"Main - {company_abbr}",
#                         "against_account": misc.misc_account
#                     })
#                     je_misc.append("accounts", {
#                         "account": f"{misc.misc_account} Payable - {company_abbr}",
#                         "party_type": "Supplier",
#                         "party": misc.misc_account,
#                         "debit_in_account_currency": 0,
#                         "credit_in_account_currency": misc.amount,
#                         "cost_center": f"Main - {company_abbr}",
#                         "against_account": f"Debtors - {company_abbr}"
#                     })
#                     je_misc.save()
#                     frappe.msgprint(_("Draft Miscellaneous Journal Entry {0} created for {1}.").format(je_misc.name, misc.misc_account))

#                     # Update journal_entry_id in Vehicle Misc Sales
#                     for misc_account in misc_sales_doc.misc_accounts:
#                         if misc_account.misc_account == misc.misc_account and not misc_account.journal_entry_id:
#                             misc_account.journal_entry_id = je_misc.name
#                             break
#                     misc_sales_doc.save()

#         # Commit all changes if everything is successful
#         frappe.db.commit()

#     except Exception as e:
#         # Rollback all changes
#         frappe.db.rollback()
#         frappe.log_error(f"Error in Sales Invoice submission: {str(e)}")
#         frappe.throw(f"Failed to process Sales Invoice due to: {str(e)}. No documents or journal entries were created.")

# @frappe.whitelist()
# def get_insurance_policies(provider):
#     """Fetch insurance policies from the custom_under_insurer child table of the Supplier doctype."""
#     policies = frappe.get_all(
#         "Insurance Policy",
#         filters={
#             "parent": provider,
#             "parenttype": "Supplier",
#             "parentfield": "custom_under_insurer"
#         },
#         fields=["policy_name"]
#     )
#     return policies

# def update_items_with_chassis_numbers(doc):
#     """Update the `serial_no` field in the `items` table based on `custom_vin` chassis numbers."""
#     item_chassis_map = {}

#     # Group chassis numbers by item code
#     for vin in doc.custom_vin:
#         if vin.item not in item_chassis_map:
#             item_chassis_map[vin.item] = []
#         item_chassis_map[vin.item].append(vin.chassis_number)

#     # Update items table
#     for item in doc.items:
#         if item.item_code in item_chassis_map:
#             item.serial_no = "\n".join(item_chassis_map[item.item_code])

# def update_serial_no_with_vsm(doc, vsm_doc_name):
#     """Update Serial No doctype with VSM ID when `update_stock` is checked."""
#     for vin in doc.get("custom_vin"):
#         if frappe.db.exists("Serial No", vin.chassis_number):
#             serial_no_doc = frappe.get_doc("Serial No", vin.chassis_number)
#             serial_no_doc.custom_vsm_id = vsm_doc_name
#             serial_no_doc.save()

# def update_customer_vsm(doc, vsm_doc_name):
#     """
#     Update the Customer doctype's `custom_vin` child table with VSM ID.
#     - If chassis number exists, update the `vsm_id`.
#     - If chassis number does not exist, append a new row.
#     """
#     if not doc.customer:
#         frappe.throw("Customer is required to update VSM ID in Customer doctype.")

#     customer_doc = frappe.get_doc("Customer", doc.customer)

#     for vin in doc.get("custom_vin"):
#         existing_vin = next((cv for cv in customer_doc.get("custom_vin") if cv.chassis_number == vin.chassis_number), None)

#         if existing_vin:
#             existing_vin.vsm_id = vsm_doc_name
#         else:
#             customer_doc.append("custom_vin", {
#                 "chassis_number": vin.chassis_number,
#                 "vsm_id": vsm_doc_name
#             })

#     customer_doc.save(ignore_permissions=True)

# def create_or_update_vehicle_sales_master(doc, company):
#     """Creates or updates a Vehicle Sales Master (VSM) for the Vehicle in the Sales Invoice."""
#     if not doc.custom_vin:
#         frappe.throw("Chassis Number details are required in VIN table.")
#     vin = doc.custom_vin[0]

#     # Check for existing VSM
#     vsm_doc_name = frappe.db.get_value("Vehicle Sales Master", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if vsm_doc_name:
#             # Update existing VSM
#             vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#             vsm_doc.update({
#                 "customer": doc.customer,
#                 "chassis_number": vin.chassis_number,
#                 "engine_number": vin.engine_number,
#                 "vehicle_color": vin.vehicle_color,
#                 "manufacturing_date": vin.manufacturing_date,
#                 "is_delivered": 1 if doc.update_stock else 0,
#                 "company": company
#             })
#             vsm_doc.save()
#         else:
#             # Create new VSM
#             vsm_doc = frappe.get_doc({
#                 "doctype": "Vehicle Sales Master",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "chassis_number": vin.chassis_number,
#                 "engine_number": vin.engine_number,
#                 "vehicle_color": vin.vehicle_color,
#                 "manufacturing_date": vin.manufacturing_date,
#                 "is_delivered": 1 if doc.update_stock else 0,
#                 "company": company
#             })
#             vsm_doc.insert()
#             vsm_doc_name = vsm_doc.name
#         return vsm_doc_name
#     except frappe.DuplicateEntryError:
#         frappe.throw(f"VSM already exists for chassis number {vin.chassis_number}.")
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating VSM: {str(e)}")
#         raise

# def create_or_update_rto_registration(doc, vsm_doc_name, company):
#     """Creates or updates an RTO Registration document if applicable."""
#     # Check for existing RTO Registration
#     rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if rto_doc_name:
#             # Update existing RTO Registration
#             rto_doc = frappe.get_doc("RTO Registration", rto_doc_name)
#             rto_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "rto_office": doc.custom_rto_office,
#                 "registration_charge": doc.custom_registration_charge,
#                 "registration_status": "Pending",
#                 "journal_status": "Draft",
#                 "payment_status": "Due"
#             })
#             rto_doc.save()
#         else:
#             # Create new RTO Registration
#             rto_doc = frappe.get_doc({
#                 "doctype": "RTO Registration",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "rto_office": doc.custom_rto_office,
#                 "registration_charge": doc.custom_registration_charge,
#                 "registration_status": "Pending",
#                 "journal_status": "Draft",
#                 "payment_status": "Due"
#             })
#             rto_doc.insert()
#             rto_doc_name = rto_doc.name
#         return rto_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating RTO Registration: {str(e)}")
#         raise

# def create_or_update_vehicle_insurance(doc, vsm_doc_name, company):
#     """Creates or updates a Vehicle Insurance document if applicable."""
#     # Check for existing Vehicle Insurance
#     insurance_doc_name = frappe.db.get_value("Vehicle Insurance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         policies = get_insurance_policies(doc.custom_insurance_provider)
#         if not policies or doc.custom_insurance_policy not in [p.policy_name for p in policies]:
#             frappe.throw(f"Invalid policy {doc.custom_insurance_policy} for provider {doc.custom_insurance_provider}. Available policies: {[p.policy_name for p in policies]}")
        
#         if insurance_doc_name:
#             # Update existing Vehicle Insurance
#             insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_name)
#             insurance_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "insurance_provider": doc.custom_insurance_provider,
#                 "policy_name": doc.custom_insurance_policy,
#                 "insurance_amount": doc.custom_insurance_amount,
#                 "insurance_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             insurance_doc.save()
#         else:
#             # Create new Vehicle Insurance
#             insurance_doc = frappe.get_doc({
#                 "doctype": "Vehicle Insurance",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "insurance_provider": doc.custom_insurance_provider,
#                 "policy_name": doc.custom_insurance_policy,
#                 "insurance_amount": doc.custom_insurance_amount,
#                 "insurance_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             insurance_doc.insert()
#             insurance_doc_name = insurance_doc.name
#         return insurance_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Insurance: {str(e)}")
#         raise

# def create_or_update_vehicle_finance(doc, vsm_doc_name, company):
#     """Creates or updates a Vehicle Finance document if applicable."""
#     # Check for existing Vehicle Finance
#     finance_doc_name = frappe.db.get_value("Vehicle Finance", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if finance_doc_name:
#             # Update existing Vehicle Finance
#             finance_doc = frappe.get_doc("Vehicle Finance", finance_doc_name)
#             finance_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "finance_provider": doc.custom_finance_provider,
#                 "loan_amount": doc.custom_finance_amount,
#                 "loan_status": "Pending",
#                 "journal_status": "Draft",
#                 "loan_type": "New Vehicle"
#             })
#             finance_doc.save()
#         else:
#             # Create new Vehicle Finance
#             finance_doc = frappe.get_doc({
#                 "doctype": "Vehicle Finance",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "finance_provider": doc.custom_finance_provider,
#                 "loan_amount": doc.custom_finance_amount,
#                 "loan_status": "Pending",
#                 "journal_status": "Draft",
#                 "loan_type": "New Vehicle"
#             })
#             finance_doc.insert()
#             finance_doc_name = finance_doc.name
#         return finance_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Finance: {str(e)}")
#         raise

# def create_or_update_vehicle_rsa(doc, vsm_doc_name, company):
#     """Creates or updates a Vehicle RSA document if applicable."""
#     # Check for existing Vehicle RSA
#     rsa_doc_name = frappe.db.get_value("Vehicle RSA", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if rsa_doc_name:
#             # Update existing Vehicle RSA
#             rsa_doc = frappe.get_doc("Vehicle RSA", rsa_doc_name)
#             rsa_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "rsa_provider": doc.custom_rsa_provider,
#                 "rsa_amount": doc.custom_rsa_amount,
#                 "rsa_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rsa_doc.save()
#         else:
#             # Create new Vehicle RSA
#             rsa_doc = frappe.get_doc({
#                 "doctype": "Vehicle RSA",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "rsa_provider": doc.custom_rsa_provider,
#                 "rsa_amount": doc.custom_rsa_amount,
#                 "rsa_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             rsa_doc.insert()
#             rsa_doc_name = rsa_doc.name
#         return rsa_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle RSA: {str(e)}")
#         raise

# def create_or_update_vehicle_extended_warranty(doc, vsm_doc_name, company):
#     """Creates or updates a Vehicle Extended Warranty document if applicable."""
#     # Check for existing Vehicle Extended Warranty
#     warranty_doc_name = frappe.db.get_value("Vehicle Extended Warranty", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         if warranty_doc_name:
#             # Update existing Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc("Vehicle Extended Warranty", warranty_doc_name)
#             warranty_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "extended_warranty_provider": doc.custom_extended_warranty_provider,
#                 "extended_warranty_amount": doc.custom_extended_warranty_amount,
#                 "warranty_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             warranty_doc.save()
#         else:
#             # Create new Vehicle Extended Warranty
#             warranty_doc = frappe.get_doc({
#                 "doctype": "Vehicle Extended Warranty",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "extended_warranty_provider": doc.custom_extended_warranty_provider,
#                 "extended_warranty_amount": doc.custom_extended_warranty_amount,
#                 "warranty_status": "Pending",
#                 "journal_status": "Draft"
#             })
#             warranty_doc.insert()
#             warranty_doc_name = warranty_doc.name
#         return warranty_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Extended Warranty: {str(e)}")
#         raise

# def create_or_update_vehicle_misc_sales(doc, vsm_doc_name, company):
#     """Creates or updates a Vehicle Misc Sales document if applicable."""
#     # Check for existing Vehicle Misc Sales
#     misc_sales_doc_name = frappe.db.get_value("Vehicle Misc Sales", {"sales_invoice": doc.name, "docstatus": ["!=", 2]}, "name")
#     try:
#         misc_accounts = [
#             {
#                 "misc_account": misc.misc_account,
#                 "amount": misc.amount
#             }
#             for misc in doc.custom_miscellaneous if misc.amount > 0
#         ]
        
#         if misc_sales_doc_name:
#             # Update existing Vehicle Misc Sales
#             misc_sales_doc = frappe.get_doc("Vehicle Misc Sales", misc_sales_doc_name)
#             misc_sales_doc.update({
#                 "customer": doc.customer,
#                 "vsm_id": vsm_doc_name,
#                 "misc_accounts": misc_accounts
#             })
#             misc_sales_doc.save()
#         else:
#             # Create new Vehicle Misc Sales
#             misc_sales_doc = frappe.get_doc({
#                 "doctype": "Vehicle Misc Sales",
#                 "customer": doc.customer,
#                 "sales_invoice": doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "misc_accounts": misc_accounts
#             })
#             misc_sales_doc.insert()
#             misc_sales_doc_name = misc_sales_doc.name
#         return misc_sales_doc_name
#     except Exception as e:
#         frappe.log_error(f"Error creating/updating Vehicle Misc Sales: {str(e)}")
#         raise
