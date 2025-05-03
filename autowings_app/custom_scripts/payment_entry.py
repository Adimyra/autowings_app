import frappe
from frappe import _

def update_custom_party_name(doc, method):
    """
    Automatically populate custom_party_name in Payment Entry Reference child table
    based on reference_doctype and reference_name.
    
    For Sales Invoice: Use the customer field.
    For Journal Entry: Use the party field where party_type is Customer and account is 'Finance Receivable - A'.
    """
    for reference in doc.references:
        custom_party_name = None
        
        try:
            if reference.reference_doctype == "Sales Invoice":
                # Fetch customer from Sales Invoice
                if reference.reference_name:
                    sales_invoice = frappe.get_doc("Sales Invoice", reference.reference_name)
                    custom_party_name = sales_invoice.customer
            
            elif reference.reference_doctype == "Journal Entry":
                # Fetch party from Journal Entry where party_type is Customer and account is 'Debtors - A'
                if reference.reference_name:
                    journal_entry = frappe.get_doc("Journal Entry", reference.reference_name)
                    for account in journal_entry.accounts:
                        if account.party_type == "Customer" and account.account == "Debtors - A" and account.party:
                            custom_party_name = account.party
                            break
        
            # Update custom_party_name in the reference row
            if custom_party_name:
                reference.custom_party_name = custom_party_name
            else:
                reference.custom_party_name = None  # Clear field if no valid party found
                
        except frappe.DoesNotExistError:
            # Handle case where referenced document does not exist
            frappe.log_error(
                f"Failed to fetch {reference.reference_doctype} {reference.reference_name} for Payment Entry {doc.name}",
                "Payment Entry Custom Party Name Update"
            )
            reference.custom_party_name = None
        except Exception as e:
            # Log unexpected errors but continue processing other references
            frappe.log_error(
                f"Error updating custom_party_name for Payment Entry {doc.name}, Reference {reference.reference_name}: {str(e)}",
                "Payment Entry Custom Party Name Update"
            )
            reference.custom_party_name = None

def validate_payment_entry(doc, method):
    """
    Hook to run the custom_party_name update logic during validate event.
    """
    update_custom_party_name(doc, method)

def before_save_payment_entry(doc, method):
    """
    Hook to run the custom_party_name update logic during before_save event.
    """
    update_custom_party_name(doc, method)



import frappe
from frappe import _

@frappe.whitelist()
def update_rto_registration_on_payment(payment_entry_name, posting_date, reference_no, journal_entries):
    try:
        # Validate inputs
        if not payment_entry_name or not posting_date or not reference_no or not journal_entries:
            frappe.log_error(f"Missing parameters: payment_entry_name={payment_entry_name}, posting_date={posting_date}, reference_no={reference_no}, journal_entries={journal_entries}", "RTO Registration Update")
            return {"updated": 0}

        logger = frappe.logger("autowings_app")
        logger.info(f"Processing Payment Entry {payment_entry_name} with journal_entries: {journal_entries}")

        updated_count = 0

        # Find RTO Registration documents with matching journal_entry_id
        rto_docs = frappe.get_all(
            "RTO Registration",
            filters={"journal_entry_id": ["in", journal_entries]},
            fields=["name", "journal_entry_id"]
        )
        logger.info(f"Found {len(rto_docs)} RTO Registration documents: {rto_docs}")

        for rto in rto_docs:
            logger.info(f"Updating RTO Registration {rto.name}")
            rto_doc = frappe.get_doc("RTO Registration", rto.name)
            rto_doc.payment_date = posting_date
            rto_doc.payment_status = "Paid"
            rto_doc.payment_reference = reference_no
            rto_doc.payment_entry_id = payment_entry_name
            try:
                rto_doc.save(ignore_permissions=True, ignore_mandatory=True, ignore_workflow=True)
                updated_count += 1
                frappe.db.commit()
                logger.info(f"Updated RTO Registration {rto.name} successfully")
            except Exception as e:
                logger.error(f"Failed to update RTO Registration {rto.name}: {str(e)}")
                frappe.log_error(f"Failed to update RTO Registration {rto.name}: {str(e)}", "RTO Registration Update")

        # Find RTO Registration documents with matching journal_entry_id in additional_accounts
        additional_accounts = frappe.get_all(
            "RTO Additional AC",
            filters={"journal_entry_id": ["in", journal_entries]},
            fields=["name", "parent", "journal_entry_id"]
        )
        logger.info(f"Found {len(additional_accounts)} RTO Additional AC rows: {additional_accounts}")

        # Group by parent RTO Registration
        parent_rto_names = set([acc.parent for acc in additional_accounts])
        for rto_name in parent_rto_names:
            logger.info(f"Updating RTO Registration {rto_name} additional_accounts")
            rto_doc = frappe.get_doc("RTO Registration", rto_name)
            updated = False

            for row in rto_doc.additional_accounts:
                if row.journal_entry_id in journal_entries:
                    row.payment_reference = reference_no
                    row.payment_date = posting_date
                    row.payment_status = "Paid"
                    row.payment_entry_id = payment_entry_name
                    updated = True
                    logger.info(f"Updated RTO Additional AC row {row.name} in {rto_name}")

            if updated:
                try:
                    rto_doc.save(ignore_permissions=True, ignore_mandatory=True, ignore_workflow=True)
                    updated_count += 1
                    frappe.db.commit()
                    logger.info(f"Updated RTO Registration {rto_name} additional_accounts successfully")
                except Exception as e:
                    logger.error(f"Failed to update RTO Registration {rto_name} additional_accounts: {str(e)}")
                    frappe.log_error(f"Failed to update RTO Registration {rto_name} additional_accounts: {str(e)}", "RTO Registration Update")

        logger.info(f"Total updated RTO Registration documents: {updated_count}")
        return {"updated": updated_count}

    except Exception as e:
        frappe.log_error(f"Error updating RTO Registration for Payment Entry {payment_entry_name}: {str(e)}", "RTO Registration Update")
        frappe.throw(_("Failed to update RTO Registration documents: {0}").format(str(e)))