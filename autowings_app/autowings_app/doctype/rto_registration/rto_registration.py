# # Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class RTORegistration(Document):
# 	pass

# # import frappe
# # from frappe.model.document import Document

# # class RTORegistration(Document):
# #     pass

# # @frappe.whitelist()
# # def create_rto_registration(sales_invoice):
# #     sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)

# #     rto_doc = frappe.get_doc({
# #         "doctype": "RTO Registration",
# #         "customer": sales_doc.customer,
# #         "sales_invoice": sales_doc.name,
# #         "vehicle_sale": frappe.db.get_value("Vehicle Sale", {"sales_invoice": sales_invoice}, "name"),
# #         "rto_office": sales_doc.rto_office,
# #         "registration_fee": sales_doc.registration_fee,
# #         "registration_status": "Pending"
# #     })
    
# #     rto_doc.insert()
# #     return rto_doc.name


# on update or change 



import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, date_diff

class RTORegistration(Document):
    pass

@frappe.whitelist()
def create_rto_registration_from_sales_invoice(sales_invoice, rto_office, registration_charge, chassis_number=None):
    try:
        # Validate inputs
        if not sales_invoice:
            frappe.throw(_("Please select a valid Sales Invoice."))
        if not rto_office:
            frappe.throw(_("Please select an RTO Office."))
        if not registration_charge or float(registration_charge) <= 0:
            frappe.throw(_("Please enter a valid Registration Charge > 0."))

        # Validate Sales Invoice
        sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
        if sales_doc.docstatus != 1:
            frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

        # Validate Vehicle Sales Master
        vsm_doc_name = sales_doc.get("custom_vsm_id")
        if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
            frappe.throw(_("No Vehicle Sales Master for Sales Invoice {0}.").format(sales_invoice))
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
        if vsm_doc.docstatus == 2:
            frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

        # Check if RTO Registration already exists
        rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
        if rto_doc_name:
            frappe.throw(_("RTO Registration {0} already exists.").format(rto_doc_name))

        # Validate RTO Office
        if not frappe.db.exists("Supplier", {"name": rto_office, "supplier_group": "RTO"}):
            frappe.throw(_("RTO Office {0} must be a valid RTO Supplier.").format(rto_office))

        # Get chassis_number from custom_vin if not provided
        if not chassis_number:
            vin_entries = sales_doc.get("custom_vin", [])
            if not vin_entries:
                frappe.throw(_("No VIN details in Sales Invoice {0}.").format(sales_invoice))
            elif len(vin_entries) > 1:
                frappe.throw(_("Multiple VINs in {0}. Specify Chassis Number.").format(sales_invoice))
            chassis_number = vin_entries[0].chassis_number
        else:
            vin_entries = sales_doc.get("custom_vin", [])
            if not any(vin.chassis_number == chassis_number for vin in vin_entries):
                frappe.throw(_("Chassis {0} not in {1} VIN details.").format(chassis_number, sales_invoice))

        # Rest of the method remains unchanged...
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        accounts_to_validate = ["Debtors", f"{rto_office} Payable"]
        accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(accounts=accounts_to_validate, company=company)
        if not accounts_valid:
            frappe.throw(_("Accounts (Debtors, {0} Payable) missing for {1}.").format(rto_office, company))

        posting_date = sales_doc.posting_date
        if date_diff(posting_date, getdate()) > 0:
            frappe.throw(_("Posting date {0} cannot be future.").format(posting_date))

        rto_doc = frappe.get_doc({
            "doctype": "RTO Registration",
            "customer": sales_doc.customer,
            "customer_name": sales_doc.customer_name,
            "sales_invoice": sales_doc.name,
            "vsm_id": vsm_doc_name,
            "rto_office": rto_office,
            "registration_charge": float(registration_charge),
            "chassis_number": chassis_number,
            "registration_status": "Pending",
            "journal_status": "Draft",
            "payment_status": "Due",
            "status": "Due Application Entry",
            # "due_documents_flag": 0,
            "number_plate_ordered": 0,
            "number_plate_received": 0,
            "number_plate_installed": 0,
            "document_submitted_to_dto": 0,
            "document_received_from_dto": 0,
            "handover_to_customer": 0
        })
        rto_doc.insert(ignore_permissions=True)
        rto_doc_name = rto_doc.name

        je_rto = frappe.new_doc("Journal Entry")
        je_rto.voucher_type = "Journal Entry"
        je_rto.company = company
        je_rto.posting_date = posting_date
        je_rto.title = f"RTO - {sales_doc.customer} - {rto_office}"
        je_rto.remark = f"RTO charge ₹{registration_charge} for {sales_doc.customer}'s vehicle under {sales_doc.name}."
        je_rto.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": sales_doc.customer,
            "debit_in_account_currency": float(registration_charge),
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}"
        })
        je_rto.append("accounts", {
            "account": f"{rto_office} Payable - {company_abbr}",
            "party_type": "Supplier",
            "party": rto_office,
            "debit_in_account_currency": 0,
            "credit_in_account_currency": float(registration_charge),
            "cost_center": f"Main - {company_abbr}"
        })
        je_rto.insert(ignore_permissions=True)
        je_rto_name = je_rto.name

        rto_doc.journal_entry_id = je_rto_name
        rto_doc.save(ignore_permissions=True)

        vsm_doc.rto_registration = 1
        vsm_doc.rto_registration_id = rto_doc_name
        vsm_doc.rto_office = rto_office
        vsm_doc.registration_charge = float(registration_charge)
        vsm_doc.save(ignore_permissions=True)

        activity_log = {
            "doctype": "RTO Activity Log",
            "activity": "RTO Registration Created",
            "status": "Created",
            "user": frappe.session.user,
            "update_on": now_datetime(),
            "remarks": f"RTO created for {sales_invoice} with charge ₹{registration_charge}.",
            "parent": rto_doc_name,
            "parentfield": "rto_activity",
            "parenttype": "RTO Registration"
        }
        frappe.get_doc(activity_log).insert(ignore_permissions=True)

        frappe.db.commit()
        return rto_doc_name

    except Exception as e:
        frappe.db.rollback()
        error_message = str(e)
        frappe.log_error(f"RTO Creation Failed for {sales_invoice}: {error_message}")
        if "rto_doc_name" in locals():
            activity_log = {
                "doctype": "RTO Activity Log",
                "activity": "RTO Creation Failed",
                "status": "Failed",
                "user": frappe.session.user,
                "update_on": now_datetime(),
                "remarks": f"Failed: {error_message}",
                "parent": rto_doc_name,
                "parentfield": "rto_activity",
                "parenttype": "RTO Registration"
            }
            frappe.get_doc(activity_log).insert(ignore_permissions=True)
        frappe.throw(_("RTO Creation Failed: {0}").format(error_message[:137]))  # Limit to 140 chars

# @frappe.whitelist()
# def create_rto_registration_from_sales_invoice(sales_invoice, rto_office, registration_charge, chassis_number=None):
#     """
#     Creates an RTO Registration document and associated Journal Entry from a Sales Invoice.
#     - Validates the Sales Invoice, Vehicle Sales Master, and RTO Office.
#     - Fetches chassis_number from Sales Invoice's custom_vin if not provided.
#     - Creates RTO Registration with specified fields and status 'Due Application Entry'.
#     - Creates a draft Journal Entry linked to the RTO Registration with posting date matching Sales Invoice.
#     - Updates Vehicle Sales Master with RTO details.
#     - Logs activity in rto_activity child table.
#     - Returns the name of the created RTO Registration document.
#     """
#     try:
#         # Validate inputs
#         if not sales_invoice:
#             frappe.throw(_("Please select a valid Sales Invoice."))
#         if not rto_office:
#             frappe.throw(_("Please select an RTO Office."))
#         if not registration_charge or float(registration_charge) <= 0:
#             frappe.throw(_("Please enter a valid Registration Charge greater than 0."))

#         # Validate Sales Invoice
#         sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
#         if sales_doc.docstatus != 1:
#             frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

#         # Validate Vehicle Sales Master
#         vsm_doc_name = sales_doc.get("custom_vsm_id")
#         if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
#             frappe.throw(_("No Vehicle Sales Master found for Sales Invoice {0}.").format(sales_invoice))
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         if vsm_doc.docstatus == 2:
#             frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

#         # Check if RTO Registration already exists
#         rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
#         if rto_doc_name:
#             frappe.throw(_("RTO Registration {0} already exists for Sales Invoice {1}.").format(rto_doc_name, sales_invoice))

#         # Validate RTO Office
#         if not frappe.db.exists("Supplier", {"name": rto_office, "supplier_group": "RTO"}):
#             frappe.throw(_("RTO Office {0} must be a valid Supplier in the RTO supplier group.").format(rto_office))

#         # Get chassis_number from custom_vin if not provided
#         if not chassis_number:
#             vin_entries = sales_doc.get("custom_vin", [])
#             if not vin_entries:
#                 frappe.throw(_("No VIN details found in Sales Invoice {0}. Please provide a Chassis Number.").format(sales_invoice))
#             elif len(vin_entries) > 1:
#                 frappe.throw(_("Multiple VIN entries found in Sales Invoice {0}. Please specify a Chassis Number.").format(sales_invoice))
#             chassis_number = vin_entries[0].chassis_number
#         elif not frappe.db.exists("VIN Sales Child", {"parent": sales_invoice, "chassis_number": chassis_number}):
#             frappe.throw(_("Chassis Number {0} not found in Sales Invoice {1}'s VIN details.").format(chassis_number, sales_invoice))

#         # Get company and abbreviation
#         company = sales_doc.company
#         company_abbr = frappe.db.get_value("Company", company, "abbr")

#         # Validate accounts
#         accounts_to_validate = ["Debtors", f"{rto_office} Payable"]
#         accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
#             accounts=accounts_to_validate, company=company
#         )
#         if not accounts_valid:
#             frappe.throw(_("One or more accounts (Debtors, {0} Payable) do not exist for company {1}.").format(rto_office, company))

#         # Validate posting date
#         posting_date = sales_doc.posting_date
#         if date_diff(posting_date, getdate()) > 0:
#             frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(posting_date))

#         # Create RTO Registration document
#         rto_doc = frappe.get_doc({
#             "doctype": "RTO Registration",
#             "customer": sales_doc.customer,
#             "customer_name": sales_doc.customer_name,
#             "sales_invoice": sales_doc.name,
#             "vsm_id": vsm_doc_name,
#             "rto_office": rto_office,
#             "registration_charge": float(registration_charge),
#             "chassis_number": chassis_number,
#             "registration_status": "Pending",
#             "journal_status": "Draft",
#             "payment_status": "Due",
#             "status": "Due Application Entry",
#             "due_documents_flag": 0,
#             "number_plate_ordered": 0,
#             "number_plate_received": 0,
#             "number_plate_installed": 0,
#             "document_submitted_to_dto": 0,
#             "document_received_from_dto": 0,
#             "handover_to_customer": 0
#         })
#         rto_doc.insert(ignore_permissions=True)
#         rto_doc_name = rto_doc.name

#         # Create draft Journal Entry
#         je_rto = frappe.new_doc("Journal Entry")
#         je_rto.voucher_type = "Journal Entry"
#         je_rto.company = company
#         je_rto.posting_date = posting_date
#         je_rto.title = f"RTO - {sales_doc.customer} - {rto_office}"
#         je_rto.remark = f"RTO Registration charge ₹{registration_charge} for {sales_doc.customer}'s vehicle under Sales Invoice {sales_doc.name}."
#         je_rto.append("accounts", {
#             "account": f"Debtors - {company_abbr}",
#             "party_type": "Customer",
#             "party": sales_doc.customer,
#             "debit_in_account_currency": float(registration_charge),
#             "credit_in_account_currency": 0,
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_rto.append("accounts", {
#             "account": f"{rto_office} Payable - {company_abbr}",
#             "party_type": "Supplier",
#             "party": rto_office,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": float(registration_charge),
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_rto.insert(ignore_permissions=True)
#         je_rto_name = je_rto.name

#         # Update journal_entry_id in RTO Registration
#         rto_doc.journal_entry_id = je_rto_name
#         rto_doc.save(ignore_permissions=True)

#         # Update Vehicle Sales Master
#         vsm_doc.rto_registration = 1
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.rto_office = rto_office
#         vsm_doc.registration_charge = float(registration_charge)
#         vsm_doc.save(ignore_permissions=True)

#         # Log activity in rto_activity child table
#         activity_log = {
#             "doctype": "RTO Activity Log",
#             "activity": "RTO Registration Created",
#             "status": "Created",
#             "user": frappe.session.user,
#             "update_on": now_datetime(),
#             "remarks": f"RTO Registration created for Sales Invoice {sales_invoice} with charge ₹{registration_charge}.",
#             "parent": rto_doc_name,
#             "parentfield": "rto_activity",
#             "parenttype": "RTO Registration"
#         }
#         frappe.get_doc(activity_log).insert(ignore_permissions=True)

#         frappe.db.commit()
#         return rto_doc_name

#     except Exception as e:
#         frappe.db.rollback()
#         error_message = str(e)
#         frappe.log_error(f"Failed to create RTO Registration for Sales Invoice {sales_invoice}: {error_message}")
#         if "rto_doc_name" in locals():
#             activity_log = {
#                 "doctype": "RTO Activity Log",
#                 "activity": "RTO Registration Creation Failed",
#                 "status": "Failed",
#                 "user": frappe.session.user,
#                 "update_on": now_datetime(),
#                 "remarks": f"Failed to create RTO Registration: {error_message}",
#                 "parent": rto_doc_name,
#                 "parentfield": "rto_activity",
#                 "parenttype": "RTO Registration"
#             }
#             frappe.get_doc(activity_log).insert(ignore_permissions=True)
#         frappe.throw(_("Failed to create RTO Registration: {0}").format(error_message))

@frappe.whitelist()
def create_vehicle_smart_card(sales_invoice, rto_registration_id, smart_card_charge, chassis_number=None):
    """
    Creates a Vehicle Smart Card document and associated Journal Entry from a Sales Invoice.
    - Validates the Sales Invoice, Vehicle Sales Master, RTO Registration, and Smart Card Charge.
    - Fetches chassis_number from Sales Invoice's custom_vin if not provided.
    - Checks custom_rto_additional_accounts for Smart Card entry with zero amount.
    - Creates Vehicle Smart Card with specified fields and status 'Registration Pending'.
    - Creates a draft Journal Entry linked to the Vehicle Smart Card with posting date matching Sales Invoice.
    - Updates Vehicle Sales Master and RTO Registration with Smart Card details.
    - Logs activity in rto_activity child table.
    - Returns the name of the created Vehicle Smart Card document.
    """
    try:
        # Validate inputs
        if not sales_invoice:
            frappe.throw(_("Please select a valid Sales Invoice."))
        if not rto_registration_id:
            frappe.throw(_("Please select a valid RTO Registration."))
        if not smart_card_charge or float(smart_card_charge) <= 0:
            frappe.throw(_("Please enter a valid Smart Card Charge greater than 0."))

        # Validate Sales Invoice
        sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
        if sales_doc.docstatus != 1:
            frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

        # Validate custom_rto_additional_accounts
        smart_card_entry = next(
            (row for row in sales_doc.get("custom_rto_additional_accounts", []) if row.account == "Smart Card" and row.amount == 0),
            None
        )
        if not smart_card_entry:
            frappe.throw(_("No Smart Card entry with zero amount found in Sales Invoice {0}.").format(sales_invoice))

        # Validate Vehicle Sales Master
        vsm_doc_name = sales_doc.get("custom_vsm_id")
        if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
            frappe.throw(_("No Vehicle Sales Master found for Sales Invoice {0}.").format(sales_invoice))
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
        if vsm_doc.docstatus == 2:
            frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

        # Validate RTO Registration
        rto_doc = frappe.get_doc("RTO Registration", rto_registration_id)
        if rto_doc.docstatus == 2:
            frappe.throw(_("RTO Registration {0} is cancelled.").format(rto_registration_id))
        if rto_doc.sales_invoice != sales_invoice:
            frappe.throw(_("RTO Registration {0} does not belong to Sales Invoice {1}.").format(rto_registration_id, sales_invoice))

        # Check if Vehicle Smart Card already exists
        sc_doc_name = frappe.db.get_value("Vehicle Smart Card", {
            "sales_invoice": sales_invoice,
            "rto_registration_id": rto_registration_id,
            "docstatus": ["!=", 2]
        }, "name")
        if sc_doc_name:
            frappe.throw(_("Vehicle Smart Card {0} already exists for Sales Invoice {1} and RTO Registration {2}.").format(
                sc_doc_name, sales_invoice, rto_registration_id))

        # Get chassis_number from custom_vin if not provided
        if not chassis_number:
            vin_entries = sales_doc.get("custom_vin", [])
            if not vin_entries:
                frappe.throw(_("No VIN details found in Sales Invoice {0}. Please provide a Chassis Number.").format(sales_invoice))
            elif len(vin_entries) > 1:
                frappe.throw(_("Multiple VIN entries found in Sales Invoice {0}. Please specify a Chassis Number.").format(sales_invoice))
            chassis_number = vin_entries[0].chassis_number
        elif not frappe.db.exists("VIN Sales Child", {"parent": sales_invoice, "chassis_number": chassis_number}):
            frappe.throw(_("Chassis Number {0} not found in Sales Invoice {1}'s VIN details.").format(chassis_number, sales_invoice))

        # Get company and abbreviation
        company = sales_doc.company
        company_abbr = frappe.db.get_value("Company", company, "abbr")

        # Validate accounts
        accounts_to_validate = ["Debtors", "Smart Card Payable"]
        accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
            accounts=accounts_to_validate, company=company
        )
        if not accounts_valid:
            frappe.throw(_("One or more accounts (Debtors, Smart Card Payable) do not exist for company {0}.").format(company))

        # Validate posting date
        posting_date = sales_doc.posting_date
        if date_diff(posting_date, getdate()) > 0:
            frappe.throw(_("Sales Invoice posting date {0} cannot be in the future.").format(posting_date))

        # Create Vehicle Smart Card document
        sc_doc = frappe.get_doc({
            "doctype": "Vehicle Smart Card",
            "customer": sales_doc.customer,
            "customer_name": sales_doc.customer_name,
            "sales_invoice": sales_doc.name,
            "vsm_id": vsm_doc_name,
            "rto_registration_id": rto_registration_id,
            "smart_card_charge": float(smart_card_charge),
            "chassis_number": chassis_number,
            "smart_card_status": "Pending",
            "journal_status": "Draft",
            "smart_card_payment_status": "Due",
            "status": "Registration Pending"
        })
        sc_doc.insert(ignore_permissions=True)
        sc_doc_name = sc_doc.name

        # Create draft Journal Entry
        je_sc = frappe.new_doc("Journal Entry")
        je_sc.voucher_type = "Journal Entry"
        je_sc.company = company
        je_sc.posting_date = posting_date  # Use Sales Invoice's posting date
        je_sc.title = f"Smart Card - {sales_doc.customer} - Smart Card Charge"
        je_sc.remark = f"Smart Card charge ₹{smart_card_charge} for {sales_doc.customer}'s vehicle under Sales Invoice {sales_doc.name}."
        je_sc.append("accounts", {
            "account": f"Debtors - {company_abbr}",
            "party_type": "Customer",
            "party": sales_doc.customer,
            "debit_in_account_currency": float(smart_card_charge),
            "credit_in_account_currency": 0,
            "cost_center": f"Main - {company_abbr}"
        })
        je_sc.append("accounts", {
            "account": f"Smart Card Payable - {company_abbr}",
            "party_type": "Supplier",
            "party": "Smart Card",
            "debit_in_account_currency": 0,
            "credit_in_account_currency": float(smart_card_charge),
            "cost_center": f"Main - {company_abbr}"
        })
        je_sc.insert(ignore_permissions=True)
        je_sc_name = je_sc.name

        # Update journal_entry_id in Vehicle Smart Card
        sc_doc.journal_entry_id = je_sc_name
        sc_doc.save(ignore_permissions=True)

        # Update RTO Registration additional_accounts
        rto_doc.append("additional_accounts", {
            "account": "Smart Card",
            "amount": float(smart_card_charge),
            "smart_card_id": sc_doc_name,
            "journal_entry_id": je_sc_name,
            "status": "Draft",
            "payment_status": "Due"
        })
        rto_doc.save(ignore_permissions=True)

        # Update Vehicle Sales Master
        vsm_doc.is_smart_card = 1
        vsm_doc.smart_card_id = sc_doc_name
        vsm_doc.save(ignore_permissions=True)

        # Log activity in rto_activity child table
        activity_log = {
            "doctype": "RTO Activity Log",
            "activity": "Vehicle Smart Card Created",
            "status": "Created",
            "user": frappe.session.user,
            "update_on": now_datetime(),
            "remarks": f"Vehicle Smart Card created for Sales Invoice {sales_invoice} with charge ₹{smart_card_charge}.",
            "parent": rto_registration_id,
            "parentfield": "rto_activity",
            "parenttype": "RTO Registration"
        }
        frappe.get_doc(activity_log).insert(ignore_permissions=True)

        frappe.db.commit()
        return sc_doc_name

    except Exception as e:
        frappe.db.rollback()
        error_message = str(e)
        frappe.log_error(f"Failed to create Vehicle Smart Card for Sales Invoice {sales_invoice}: {error_message}")
        if "rto_registration_id" in locals():
            activity_log = {
                "doctype": "RTO Activity Log",
                "activity": "Vehicle Smart Card Creation Failed",
                "status": "Failed",
                "user": frappe.session.user,
                "update_on": now_datetime(),
                "remarks": f"Failed to create Vehicle Smart Card: {error_message}",
                "parent": rto_registration_id,
                "parentfield": "rto_activity",
                "parenttype": "RTO Registration"
            }
            frappe.get_doc(activity_log).insert(ignore_permissions=True)
        frappe.throw(_("Failed to create Vehicle Smart Card: {0}").format(error_message))
        
# import frappe
# from frappe import _
# from frappe.model.document import Document
# from frappe.utils import getdate, now_datetime

# class RTORegistration(Document):
#     pass

# @frappe.whitelist()
# def create_rto_registration_from_sales_invoice(sales_invoice, rto_office, registration_charge, smart_card_amount=0, chassis_number=None):
#     """
#     Creates an RTO Registration document, associated Journal Entry, optional Smart Card, and updates Vehicle Sales Master.
#     - Validates the Sales Invoice and linked Vehicle Sales Master.
#     - Fetches chassis_number from Sales Invoice's custom_vin child table if not provided.
#     - Creates an RTO Registration document with provided rto_office, registration_charge, optional smart_card_amount.
#     - Uses customer from Sales Invoice.
#     - Creates draft Journal Entries for RTO registration and optional Smart Card.
#     - Creates a Vehicle Smart Card document if smart_card_amount is provided.
#     - Updates Vehicle Sales Master with rto_registration, rto_registration_id, rto_office, registration_charge, is_smart_card, and smart_card_id.
#     - Logs activity in rto_activity child table.
#     - Returns the name of the created RTO Registration document.
#     """
#     try:
#         # Validate inputs
#         if not sales_invoice:
#             frappe.throw(_("Please select a valid Sales Invoice."))
#         if not rto_office:
#             frappe.throw(_("Please select an RTO Office."))
#         if not registration_charge or float(registration_charge) <= 0:
#             frappe.throw(_("Please enter a valid Registration Charge greater than 0."))
#         if smart_card_amount and float(smart_card_amount) < 0:
#             frappe.throw(_("Smart Card Amount cannot be negative."))

#         # Validate Sales Invoice
#         sales_doc = frappe.get_doc("Sales Invoice", sales_invoice)
#         if sales_doc.docstatus != 1:
#             frappe.throw(_("Sales Invoice {0} must be submitted.").format(sales_invoice))

#         # Validate Vehicle Sales Master
#         vsm_doc_name = sales_doc.get("custom_vsm_id")
#         if not vsm_doc_name:
#             vsm_doc_name = frappe.db.get_value("Vehicle Sales Master", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
#         if not vsm_doc_name or not frappe.db.exists("Vehicle Sales Master", vsm_doc_name):
#             frappe.throw(_("No Vehicle Sales Master found for Sales Invoice {0}.").format(sales_invoice))
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         if vsm_doc.docstatus == 2:
#             frappe.throw(_("Vehicle Sales Master {0} is cancelled.").format(vsm_doc_name))

#         # Check if RTO Registration already exists
#         rto_doc_name = frappe.db.get_value("RTO Registration", {"sales_invoice": sales_invoice, "docstatus": ["!=", 2]}, "name")
#         if rto_doc_name:
#             frappe.throw(_("RTO Registration {0} already exists for Sales Invoice {1}.").format(rto_doc_name, sales_invoice))

#         # Validate RTO Office (must be a Supplier)
#         if not frappe.db.exists("Supplier", {"name": rto_office}):
#             frappe.throw(_("RTO Office {0} must be a valid Supplier.").format(rto_office))

#         # Get chassis_number from custom_vin child table if not provided
#         if not chassis_number:
#             vin_entries = sales_doc.get("custom_vin", [])
#             if not vin_entries:
#                 frappe.throw(_("No VIN details found in Sales Invoice {0}. Please provide a Chassis Number.").format(sales_invoice))
#             elif len(vin_entries) > 1:
#                 frappe.throw(_("Multiple VIN entries found in Sales Invoice {0}. Please specify a Chassis Number.").format(sales_invoice))
#             chassis_number = vin_entries[0].chassis_number
#         elif not frappe.db.exists("VIN Sales Child", {"parent": sales_invoice, "chassis_number": chassis_number}):
#             frappe.throw(_("Chassis Number {0} not found in Sales Invoice {1}'s VIN details.").format(chassis_number, sales_invoice))

#         # Get company and abbreviation
#         company = sales_doc.company
#         company_abbr = frappe.db.get_value("Company", company, "abbr")

#         # Validate accounts
#         accounts_to_validate = ["Debtors", f"{rto_office} Payable", "Smart Card Payable"]
#         accounts_valid = frappe.get_attr("autowings_app.custom_scripts.utils.validate_accounts")(
#             accounts=accounts_to_validate, company=company
#         )
#         if not accounts_valid:
#             frappe.throw(_("One or more accounts (Debtors, {0} Payable, Smart Card Payable) do not exist for company {1}.").format(rto_office, company))

#         # Set status and registration_status
#         status = "Due Application Entry"
#         registration_status = "Pending"

#         # Create RTO Registration document
#         rto_doc = frappe.get_doc({
#             "doctype": "RTO Registration",
#             "customer": sales_doc.customer,
#             "sales_invoice": sales_doc.name,
#             "vsm_id": vsm_doc_name,
#             "rto_office": rto_office,
#             "registration_charge": float(registration_charge),
#             "chassis_number": chassis_number,
#             "registration_status": registration_status,
#             "journal_status": "Draft",
#             "payment_status": "Due",
#             "status": status,
#             "due_documents_flag": 0,
#             "number_plate_ordered": 0,
#             "number_plate_received": 0,
#             "number_plate_installed": 0,
#             "document_submitted_to_dto": 0,
#             "document_received_from_dto": 0,
#             "handover_to_customer": 0
#         })

#         # Add Smart Card to additional_accounts if provided
#         smart_card_id = None
#         if smart_card_amount and float(smart_card_amount) > 0:
#             smart_card_id = f"SCARD-{getdate().strftime('%y-%m-%d')}-{frappe.utils.random_string(4)}"
#             rto_doc.append("additional_accounts", {
#                 "doctype": "RTO Additional AC",
#                 "smart_card_id": smart_card_id,
#                 "account": "Smart Card",
#                 "amount": float(smart_card_amount),
#                 "status": "Draft",
#                 "payment_status": "Due"
#             })

#         rto_doc.insert(ignore_permissions=True)
#         rto_doc_name = rto_doc.name

#         # Create draft Journal Entry for RTO Registration
#         je_rto = frappe.new_doc("Journal Entry")
#         je_rto.voucher_type = "Journal Entry"
#         je_rto.company = company
#         je_rto.posting_date = getdate()
#         je_rto.title = f"RTO - {sales_doc.customer} - {rto_office}"
#         je_rto.remark = f"RTO Registration charge ₹{rto_doc.registration_charge} for {sales_doc.customer}'s vehicle under Sales Invoice {sales_doc.name}."
#         je_rto.append("accounts", {
#             "account": f"Debtors - {company_abbr}",
#             "party_type": "Customer",
#             "party": sales_doc.customer,
#             "debit_in_account_currency": float(registration_charge),
#             "credit_in_account_currency": 0,
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_rto.append("accounts", {
#             "account": f"{rto_office} Payable - {company_abbr}",
#             "party_type": "Supplier",
#             "party": rto_office,
#             "debit_in_account_currency": 0,
#             "credit_in_account_currency": float(registration_charge),
#             "cost_center": f"Main - {company_abbr}"
#         })
#         je_rto.insert(ignore_permissions=True)
#         je_rto_name = je_rto.name

#         # Update journal_entry_id in RTO Registration
#         rto_doc.journal_entry_id = je_rto_name

#         # Create Vehicle Smart Card and Journal Entry for Smart Card if applicable
#         smart_card_doc_name = None
#         if smart_card_amount and float(smart_card_amount) > 0:
#             # Create Vehicle Smart Card
#             smart_card_doc = frappe.get_doc({
#                 "doctype": "Vehicle Smart Card",
#                 "rto_registration_id": rto_doc_name,
#                 "smart_card_charge": float(smart_card_amount),
#                 "smart_card_status": "Pending",
#                 "smart_card_payment_status": "Due",
#                 "customer": sales_doc.customer,
#                 "sales_invoice": sales_doc.name,
#                 "vsm_id": vsm_doc_name,
#                 "chassis_number": chassis_number
#             })
#             smart_card_doc.insert(ignore_permissions=True)
#             smart_card_doc_name = smart_card_doc.name

#             # Create draft Journal Entry for Smart Card
#             je_smart_card = frappe.new_doc("Journal Entry")
#             je_smart_card.voucher_type = "Journal Entry"
#             je_smart_card.company = company
#             je_smart_card.posting_date = getdate()
#             je_smart_card.title = f"Smart Card - {sales_doc.customer} - {rto_office}"
#             je_smart_card.remark = f"Smart Card charge ₹{smart_card_amount} for {sales_doc.customer}'s vehicle under Sales Invoice {sales_doc.name}."
#             je_smart_card.append("accounts", {
#                 "account": f"Debtors - {company_abbr}",
#                 "party_type": "Customer",
#                 "party": sales_doc.customer,
#                 "debit_in_account_currency": float(smart_card_amount),
#                 "credit_in_account_currency": 0,
#                 "cost_center": f"Main - {company_abbr}"
#             })
#             je_smart_card.append("accounts", {
#                 "account": f"Smart Card Payable - {company_abbr}",
#                 "party_type": "Supplier",
#                 "party": rto_office,
#                 "debit_in_account_currency": 0,
#                 "credit_in_account_currency": float(smart_card_amount),
#                 "cost_center": f"Main - {company_abbr}"
#             })
#             je_smart_card.insert(ignore_permissions=True)
#             je_smart_card_name = je_smart_card.name

#             # Update Smart Card Journal Entry ID in additional_accounts
#             for row in rto_doc.additional_accounts:
#                 if row.smart_card_id == smart_card_id:
#                     row.journal_entry_id = je_smart_card_name
#             rto_doc.save(ignore_permissions=True)

#             # Update Vehicle Smart Card with journal_entry_id
#             smart_card_doc.journal_entry_id = je_smart_card_name
#             smart_card_doc.save(ignore_permissions=True)

#         # Update Vehicle Sales Master
#         vsm_doc.rto_registration = 1
#         vsm_doc.rto_registration_id = rto_doc_name
#         vsm_doc.rto_office = rto_office
#         vsm_doc.registration_charge = rto_doc.registration_charge
#         if smart_card_amount and float(smart_card_amount) > 0:
#             vsm_doc.is_smart_card = 1
#             vsm_doc.smart_card_id = smart_card_doc_name
#         vsm_doc.save(ignore_permissions=True)

#         # Log activity in rto_activity child table
#         activity_log = {
#             "doctype": "RTO Activity Log",
#             "activity": "RTO Registration Created",
#             "status": "Created",
#             "user": frappe.session.user,
#             "update_on": now_datetime(),
#             "remarks": f"RTO Registration created for Sales Invoice {sales_invoice} with charge ₹{registration_charge}." + (f" Smart Card created with ID {smart_card_doc_name}." if smart_card_doc_name else ""),
#             "parent": rto_doc_name,
#             "parentfield": "rto_activity",
#             "parenttype": "RTO Registration"
#         }
#         frappe.get_doc(activity_log).insert(ignore_permissions=True)

#         frappe.db.commit()

#         frappe.msgprint(
#             _("RTO Registration {0} and Journal Entry {1} created successfully. Vehicle Sales Master {2} updated.")
#             .format(rto_doc_name, je_rto_name, vsm_doc_name)
#         )

#         return rto_doc_name

#     except Exception as e:
#         frappe.db.rollback()
#         error_message = str(e)
#         frappe.log_error(f"Failed to create RTO Registration for Sales Invoice {sales_invoice}: {error_message}")
#         # Log activity in rto_activity child table
#         if "rto_doc_name" in locals():
#             activity_log = {
#                 "doctype": "RTO Activity Log",
#                 "activity": "RTO Registration Creation Failed",
#                 "status": "Failed",
#                 "user": frappe.session.user,
#                 "update_on": now_datetime(),
#                 "remarks": f"Failed to create RTO Registration: {error_message}",
#                 "parent": rto_doc_name,
#                 "parentfield": "rto_activity",
#                 "parenttype": "RTO Registration"
#             }
#             frappe.get_doc(activity_log).insert(ignore_permissions=True)
#         frappe.throw(_("Failed to create RTO Registration: {0}").format(error_message))