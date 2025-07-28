

# import frappe
# from frappe import _
# from frappe.utils import getdate


# def before_submit(doc, method):
#     """
#     Before Submit Hook for Sales Invoice:
#     - Validate `custom_sale_type`, item count, quantity, and VIN details.
#     - Update `serial_no` in Items Table from `custom_vin`.
#     - If Spare or Other, uncheck update_stock.
#     - No document creation here to avoid issues if submission fails.
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

import frappe
from frappe import _
from frappe.utils import getdate

def before_submit(doc, method):
    """
    Before Submit Hook for Sales Invoice:
    - Validates `custom_sale_type`, and for `Vehicle` type, checks item count, quantity, and VIN details.
    - Updates `serial_no` in Items Table from `custom_vin` for `Vehicle` type.
    - For `Spare` or `Other`, unchecks `update_stock`.
    - No document creation to avoid issues if submission fails.
    """
    # Ensure `custom_sale_type` is set
    if not doc.custom_sale_type:
        frappe.throw(_("Sale Type (`custom_sale_type`) is required."))

    # If Spare or Other, uncheck update_stock and skip vehicle processes
    if doc.custom_sale_type in ["Spare", "Other"]:
        doc.update_stock = 0
        return

    # Vehicle sales validations
    if doc.custom_sale_type == "Vehicle":
        # Ensure only 1 item is allowed
        if len(doc.items) > 1:
            frappe.throw(_("Only one item is allowed in the items table for a Sales Invoice Vehicle Sale Type."))
        if doc.items[0].qty > 1:
            frappe.throw(_("Quantity must be 1 for a Sales Invoice Vehicle Sale Item."))

        # Ensure `custom_vin` is populated when `update_stock` is checked
        if doc.update_stock:
            if not doc.custom_vin or not len(doc.custom_vin):
                frappe.throw(_("Chassis number details are required."))

            # Validate each VIN entry for mandatory fields and match with items
            try:
                vin_item_codes = {vin.item for vin in doc.custom_vin}
                item_codes = {item.item_code for item in doc.items}
                if not vin_item_codes.issubset(item_codes):
                    frappe.throw(_("VIN entries must correspond to items in the items table."))
            except AttributeError as e:
                frappe.log_error(
                    f"Sales Invoice VIN Validation Error - {doc.name}",
                    f"Error accessing item in custom_vin: {str(e)}"
                )
                frappe.throw(_("Invalid VIN entry: {0}").format(str(e)))

            for vin in doc.custom_vin:
                if not (vin.chassis_number and vin.engine_number and vin.vehicle_color and vin.manufacturing_date):
                    frappe.throw(
                        f"VIN Entry ({vin.item}) for item {vin.item} is incomplete. Please enter Chassis Number, Engine Number, Vehicle Color, and Manufacturing Date."
                    )

        # Update `serial_no` in Items Table from `custom_vin`
        update_items_with_chassis_numbers(doc)


import frappe

def after_insert_sales_invoice(doc, method):
    """Add suppliers to custom_miscellaneous and custom_rto_additional_accounts child tables based on custom_sub_sales_type's misc_accounts and rto_other_accounts."""
    if not doc.custom_sub_sales_type:
        frappe.log_error(f"No custom_sub_sales_type found for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        return

    # Fetch Sub Sale Type document where sub_sale_type matches custom_sub_sales_type and enabled = 1
    try:
        sub_sale_type_doc = frappe.get_doc("Sub Sale Type", {"sub_sale_type": doc.custom_sub_sales_type, "enabled": 1})
    except frappe.DoesNotExistError:
        frappe.log_error(f"Sub Sale Type {doc.custom_sub_sales_type} not found or not enabled for Sales Invoice {doc.name}", "after_insert_sales_invoice")
        return

    # Flag to track if any updates were made
    updates_made = False

    # --- Handle misc_accounts for custom_miscellaneous ---
    misc_accounts = [account.misc_account for account in sub_sale_type_doc.get("misc_accounts", [])]
    if not misc_accounts:
        frappe.log_error(f"No misc_accounts found in Sub Sale Type {doc.custom_sub_sales_type} for Sales Invoice {doc.name}", "after_insert_sales_invoice")
    else:
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
            else:
                # Add matching suppliers to custom_miscellaneous child table
                for supplier in suppliers:
                    doc.append("custom_miscellaneous", {
                        "misc_account": supplier.supplier_name,
                        "amount": 0
                    })
                updates_made = True
                frappe.msgprint(f"Misc accounts head updated", title="Success")

                # frappe.msgprint(f"Successfully added {len(suppliers)} suppliers to custom_miscellaneous for Sales Invoice {doc.name}", title="Success")
                # write short msg print inshort

        else:
            frappe.log_error(f"custom_miscellaneous already populated for Sales Invoice {doc.name}, skipping supplier addition", "after_insert_sales_invoice")

    # --- Handle rto_other_accounts for custom_rto_additional_accounts ---
    rto_other_accounts = [account.rto_other_account for account in sub_sale_type_doc.get("rto_other_accounts", [])]
    if not rto_other_accounts:
        frappe.log_error(f"No rto_other_accounts found in Sub Sale Type {doc.custom_sub_sales_type} for Sales Invoice {doc.name}", "after_insert_sales_invoice")
    else:
        # Only add accounts if custom_rto_additional_accounts is empty
        if not doc.custom_rto_additional_accounts:
            # Note: If supplier validation is needed for rto_other_accounts, add similar logic to misc_accounts here
            for rto_account in rto_other_accounts:
                doc.append("custom_rto_additional_accounts", {
                    "account": rto_account,  # Corrected field name from rto_additional_account to account
                    "amount": 0
                })
            updates_made = True
            # frappe.msgprint(f"Successfully added {len(rto_other_accounts)} accounts to custom_rto_additional_accounts for Sales Invoice {doc.name}", title="Success")
            frappe.msgprint(f"RTO other accounts head updated", title="Success")

        else:
            frappe.log_error(f"custom_rto_additional_accounts already populated for Sales Invoice {doc.name}, skipping account addition", "after_insert_sales_invoice")

    # Save the document to persist changes if any updates were made
    if updates_made:
        try:
            doc.save()
            frappe.msgprint(f"Successfully saved Sales Invoice {doc.name} with updated child tables", title="Success")
        except Exception as e:
            frappe.log_error(f"Failed to save Sales Invoice {doc.name}: {str(e)}", "after_insert_sales_invoice")

# -----------********-------------------


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
            # je_rto.posting_date = getdate()
            # i want sales invoice posting date to be used here
            je_rto.posting_date = doc.posting_date
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
                        # je_rto_additional.posting_date = getdate()
                        # Use Sales Invoice posting date for RTO Additional JE
                        je_rto_additional.posting_date = doc.posting_date
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
            # je_insurance.posting_date = getdate()
            # Use Sales Invoice posting date for Insurance JE
            je_insurance.posting_date = doc.posting_date
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
            je_rsa.posting_date = doc.posting_date
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
            je_warranty.posting_date = doc.posting_date
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
            je_finance.posting_date = doc.posting_date
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
                    je_misc.posting_date = doc.posting_date
                    je_misc.title = f"Misc - {doc.customer} - {misc.misc_account}"
                    # je_misc.title = f"Misc - {doc.customer} - Multiple Accounts (Sales Invoice {doc.name})"
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

        frappe.db.set_value("Sales Invoice", doc.name, "custom_vsm_id", vsm_doc_name)
        

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
                "journal_status": "Draft",
                "payment_status": "Due"


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
                "journal_status": "Draft",
                "payment_status": "Due"

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
                "journal_status": "Draft",
                "payment_status": "Due"
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
                "journal_status": "Draft",
                "payment_status": "Due"

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
                "journal_status": "Draft",
                "payment_status": "Due"

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
                "journal_status": "Draft",
                "payment_status": "Due"

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



# on cancel sales invoice cancelled all link document status to cancelled

# import frappe

# def on_cancel_sales_invoice(doc, method):
#     """
#     On Cancel Hook for Sales Invoice:
#     - Retrieve custom_vsm_id to locate Vehicle Sales Master (VSM).
#     - Update VSM status and linked status fields (rto_status, smart_card_status, etc.) to 'Cancelled', except smart_card_status to ''.
#     - Update two status fields for linked non-submittable documents (RTO Registration, Vehicle Insurance, Vehicle Finance, Vehicle RSA,
#       Vehicle Extended Warranty, Vehicle Smart Card): specific status field to 'Cancelled' (or '' for Smart Card) and status to 'Cancelled'.
#     - Update only status field for Vehicle Misc Sales to 'Cancelled'.
#     - Rollback changes if any error occurs.
#     """
#     if doc.custom_sale_type != "Vehicle":
#         return

#     try:
#         # Get VSM ID from Sales Invoice
#         vsm_doc_name = doc.custom_vsm_id
#         if not vsm_doc_name:
#             frappe.msgprint(_("No Vehicle Sales Master linked to this Sales Invoice."))
#             return

#         # Get VSM document and update status fields
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)
#         vsm_doc.status = "Cancelled"
#         vsm_doc.rto_status = "Cancelled"
#         vsm_doc.smart_card_status = "Cancelled"
#         vsm_doc.insurance_status = "Cancelled"
#         vsm_doc.loan_status = "Cancelled"
#         vsm_doc.rsa_status = "Cancelled"
#         vsm_doc.warranty_status = "Cancelled"
#         vsm_doc.misc_sales_status = "Cancelled"

#         vsm_doc.save()
#         frappe.msgprint(_("Vehicle Sales Master {0} status updated to Cancelled.").format(vsm_doc_name))

#         # Dictionary of document types, their VSM field, specific status field, and status values
#         doc_types = {
#             "RTO Registration": {
#                 "vsm_field": "rto_registration_id",
#                 "specific_status_field": "registration_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle Smart Card": {
#                 "vsm_field": "smart_card_id",
#                 "specific_status_field": "smart_card_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle Insurance": {
#                 "vsm_field": "insurance_id",
#                 "specific_status_field": "insurance_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle Finance": {
#                 "vsm_field": "finance_id",
#                 "specific_status_field": "loan_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle RSA": {
#                 "vsm_field": "rsa_id",
#                 "specific_status_field": "rsa_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle Extended Warranty": {
#                 "vsm_field": "extended_warranty_id",
#                 "specific_status_field": "warranty_status",
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             },
#             "Vehicle Misc Sales": {
#                 "vsm_field": "vehicle_misc_sales_id",
#                 "specific_status_field": "status",  # Only one status field exists
#                 "specific_status_value": "Cancelled",
#                 "status_field": "status",
#                 "status_value": "Cancelled"
#             }
#         }

#         # Update status for linked documents
#         for doc_type, fields in doc_types.items():
#             doc_id = vsm_doc.get(fields["vsm_field"])
#             if doc_id:
#                 related_doc = frappe.get_doc(doc_type, doc_id)
#                 related_doc.set(fields["specific_status_field"], fields["specific_status_value"])
#                 if fields["specific_status_field"] != fields["status_field"]:
#                     related_doc.set(fields["status_field"], fields["status_value"])
#                 related_doc.save()
#                 if fields["specific_status_field"] == fields["status_field"]:
#                     frappe.msgprint(_("{0} {1} {2} updated to {3}.").format(
#                         doc_type, doc_id,
#                         fields["specific_status_field"], fields["specific_status_value"]
#                     ))
#                 else:
#                     frappe.msgprint(_("{0} {1} {2} updated to {3} and {4} updated to {5}.").format(
#                         doc_type, doc_id,
#                         fields["specific_status_field"], fields["specific_status_value"],
#                         fields["status_field"], fields["status_value"]
#                     ))

#         # Commit changes
#         frappe.db.commit()

#     except Exception as e:
#         # Rollback changes
#         frappe.db.rollback()
#         frappe.log_error(f"Sales Invoice Cancel Error: {str(e)}")
#         frappe.throw(f"Failed to cancel Sales Invoice: {str(e)}. No statuses updated.")


import frappe

def on_cancel_sales_invoice(doc, method):
    """
    On Cancel Hook for Sales Invoice:
    - Retrieve custom_vsm_id to locate Vehicle Sales Master (VSM).
    - Validate if RTO Registration or Vehicle Insurance has journal_status 'Submitted'.
    - If journal_status is 'Submitted' for RTO Registration, stop cancellation and skip updates for RTO Registration and Vehicle Smart Card.
    - If journal_status is 'Submitted' for Vehicle Insurance, stop cancellation and skip updates for Vehicle Insurance and all other documents.
    - Update VSM status and linked status fields (rto_status, smart_card_status, etc.) to 'Cancelled', except smart_card_status to ''.
    - Update two status fields for linked non-submittable documents (RTO Registration, Vehicle Insurance, Vehicle Finance, Vehicle RSA,
      Vehicle Extended Warranty, Vehicle Smart Card): specific status field to 'Cancelled' (or '' for Smart Card) and status to 'Cancelled'.
    - Update only status field for Vehicle Misc Sales to 'Cancelled'.
    - Rollback changes if any error occurs.
    """
    if doc.custom_sale_type != "Vehicle":
        return

    try:
        # Get VSM ID from Sales Invoice
        vsm_doc_name = doc.custom_vsm_id
        if not vsm_doc_name:
            frappe.msgprint(_("No Vehicle Sales Master linked to this Sales Invoice."))
            return

        # Get VSM document
        vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_doc_name)

        # Dictionary of document types, their VSM field, specific status field, and status values
        doc_types = {
            "RTO Registration": {
                "vsm_field": "rto_registration_id",
                "specific_status_field": "registration_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle Smart Card": {
                "vsm_field": "smart_card_id",
                "specific_status_field": "smart_card_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle Insurance": {
                "vsm_field": "insurance_id",
                "specific_status_field": "insurance_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle Finance": {
                "vsm_field": "finance_id",
                "specific_status_field": "loan_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle RSA": {
                "vsm_field": "rsa_id",
                "specific_status_field": "rsa_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle Extended Warranty": {
                "vsm_field": "extended_warranty_id",
                "specific_status_field": "warranty_status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            },
            "Vehicle Misc Sales": {
                "vsm_field": "vehicle_misc_sales_id",
                "specific_status_field": "status",
                "specific_status_value": "Cancelled",
                "status_field": "status",
                "status_value": "Cancelled"
            }
        }

        # Validate RTO Registration journal_status
        rto_doc_id = vsm_doc.get(doc_types["RTO Registration"]["vsm_field"])
        rto_submitted = False
        if rto_doc_id:
            rto_doc = frappe.get_doc("RTO Registration", rto_doc_id)
            if rto_doc.get("journal_status") == "Submitted":
                rto_submitted = True
                frappe.throw(
                    _("Cannot cancel Sales Invoice because RTO Registration {0} has journal_status 'Submitted'.").format(rto_doc_id)
                )

        # Validate Vehicle Insurance journal_status
        insurance_doc_id = vsm_doc.get(doc_types["Vehicle Insurance"]["vsm_field"])
        insurance_submitted = False
        if insurance_doc_id:
            insurance_doc = frappe.get_doc("Vehicle Insurance", insurance_doc_id)
            if insurance_doc.get("journal_status") == "Submitted":
                insurance_submitted = True
                frappe.throw(
                    _("Cannot cancel Sales Invoice because Vehicle Insurance {0} has journal_status 'Submitted'.").format(insurance_doc_id)
                )

        # Update VSM status fields
        vsm_doc.status = "Cancelled"
        vsm_doc.rto_status = "Cancelled" if not rto_submitted else vsm_doc.rto_status
        vsm_doc.smart_card_status = "Cancelled" if not rto_submitted else vsm_doc.smart_card_status
        vsm_doc.insurance_status = "Cancelled" if not insurance_submitted else vsm_doc.insurance_status
        vsm_doc.loan_status = "Cancelled" if not insurance_submitted else vsm_doc.loan_status
        vsm_doc.rsa_status = "Cancelled" if not insurance_submitted else vsm_doc.rsa_status
        vsm_doc.warranty_status = "Cancelled" if not insurance_submitted else vsm_doc.warranty_status
        vsm_doc.misc_sales_status = "Cancelled" if not insurance_submitted else vsm_doc.misc_sales_status

        vsm_doc.save()
        frappe.msgprint(_("Vehicle Sales Master {0} status updated to Cancelled.").format(vsm_doc_name))

        # Update status for linked documents
        for doc_type, fields in doc_types.items():
            # Skip RTO Registration and Vehicle Smart Card if RTO journal_status is Submitted
            if rto_submitted and doc_type in ["RTO Registration", "Vehicle Smart Card"]:
                continue
            # Skip all documents if Vehicle Insurance journal_status is Submitted
            if insurance_submitted:
                continue

            doc_id = vsm_doc.get(fields["vsm_field"])
            if doc_id:
                related_doc = frappe.get_doc(doc_type, doc_id)
                related_doc.set(fields["specific_status_field"], fields["specific_status_value"])
                if fields["specific_status_field"] != fields["status_field"]:
                    related_doc.set(fields["status_field"], fields["status_value"])
                related_doc.save()
                if fields["specific_status_field"] == fields["status_field"]:
                    frappe.msgprint(_("{0} {1} {2} updated to {3}.").format(
                        doc_type, doc_id,
                        fields["specific_status_field"], fields["specific_status_value"]
                    ))
                else:
                    frappe.msgprint(_("{0} {1} {2} updated to {3} and {4} updated to {5}.").format(
                        doc_type, doc_id,
                        fields["specific_status_field"], fields["specific_status_value"],
                        fields["status_field"], fields["status_value"]
                    ))

        # Commit changes
        frappe.db.commit()

    except Exception as e:
        # Rollback changes
        frappe.db.rollback()
        frappe.log_error(f"Sales Invoice Cancel Error: {str(e)}")
        frappe.throw(f"Failed to cancel Sales Invoice: {str(e)}. No statuses updated.")



