# import frappe
# from frappe import _

# @frappe.whitelist()
# def cancel_rto_journal(vsm_name):
#     """
#     Cancel or delete the journal entry linked to the RTO Registration of a Vehicle Sales Master.
#     Updates the RTO Registration's journal_entry_id and journal_status fields.
#     """
#     # Fetch the Vehicle Sales Master document
#     try:
#         vsm_doc = frappe.get_doc("Vehicle Sales Master", vsm_name)
#     except frappe.DoesNotExistError:
#         frappe.throw(_("Vehicle Sales Master {0} not found").format(vsm_name))
#         return

#     # Check if RTO Registration ID exists
#     if not vsm_doc.rto_registration_id:
#         frappe.throw(_("No RTO Registration linked to VSM {0}").format(vsm_name))
#         return

#     # Fetch the RTO Registration document
#     try:
#         rto_doc = frappe.get_doc("RTO Registration", vsm_doc.rto_registration_id)
#     except frappe.DoesNotExistError:
#         frappe.throw(_("RTO Registration {0} not found").format(vsm_doc.rto_registration_id))
#         return

#     # Check if journal_entry_id exists
#     if not rto_doc.journal_entry_id:
#         frappe.throw(_("No Journal Entry linked to RTO {0}").format(rto_doc.name))
#         return

#     # Process the Journal Entry
#     try:
#         journal = frappe.get_doc("Journal Entry", rto_doc.journal_entry_id)
#         # Clear journal_entry_id in RTO Registration to remove the link
#         frappe.db.set_value("RTO Registration", rto_doc.name, "journal_entry_id", "")
        
#         if journal.docstatus == 1:  # Submitted
#             journal.cancel()
#             frappe.db.set_value("RTO Registration", rto_doc.name, "journal_status", "Cancelled")
#         elif journal.docstatus == 0:  # Draft
#             journal.delete()
#             frappe.db.set_value("RTO Registration", rto_doc.name, "journal_status", "Deleted")
#     except Exception as e:
#         # Shortened error message to fit within 140 characters
#         error_msg = f"Failed to process journal {rto_doc.journal_entry_id}: {str(e)}"[:100]
#         frappe.log_error(error_msg, title=f"Journal {rto_doc.journal_entry_id} Error")
#         frappe.throw(_("Failed to process journal {0}: {1}").format(rto_doc.journal_entry_id, str(e)))

#     return _("RTO Journal processed successfully")
import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_rto(doc):
    """
    Custom button action for RTO Registration to cancel or delete linked Journal Entry and multiple journal entries in additional_accounts.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from RTO Registration and additional_accounts before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft, for both main and additional_accounts journal entries.
    - Updates journal_status to 'Cancelled' or 'Deleted' in RTO Registration, and status in additional_accounts.
    - Clears journal_entry_id for both cancellation and deletion.
    - Adds activity log entries for each journal entry action in rto_activity child table.
    - Updates Vehicle Smart Card document (if smart_card_id exists in additional_accounts):
      - Clears journal_entry_id.
      - Updates journal_status to 'Cancelled' or 'Deleted'.
      - Adds activity log entry in rto_activity child table of Vehicle Smart Card.
    """
    try:
        # Ensure frappe is available
        if not frappe:
            raise ImportError("Frappe module is not available")

        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the RTO Registration document
        rto_doc = frappe.get_doc("RTO Registration", doc_dict["name"])

        # Check if journal_entry_id exists
        journal_entry_id = rto_doc.get("journal_entry_id")
        if not journal_entry_id and not any(account.journal_entry_id for account in rto_doc.get("additional_accounts", [])):
            frappe.msgprint(_("No Journal Entries linked to this RTO Registration."))
            return

        # Store journal entry IDs to process
        journal_entries_to_process = []
        if journal_entry_id:
            journal_entries_to_process.append({"id": journal_entry_id, "is_main": True})

        # Collect journal_entry_id and smart_card_id from additional_accounts
        smart_card_updates = []
        for account in rto_doc.get("additional_accounts", []):
            if account.journal_entry_id:
                journal_entries_to_process.append({"id": account.journal_entry_id, "is_main": False, "account": account})
            if account.get("smart_card_id"):
                smart_card_updates.append({"smart_card_id": account.smart_card_id, "journal_entry_id": account.journal_entry_id})

        # Unlink all journal entries in RTO Registration
        if journal_entry_id:
            rto_doc.journal_entry_id = ""
        for account in rto_doc.get("additional_accounts", []):
            if account.journal_entry_id:
                account.journal_entry_id = ""

        # Save the RTO Registration document to persist unlinking
        rto_doc.save()
        frappe.db.commit()

        # Process each journal entry
        for entry in journal_entries_to_process:
            journal_entry = frappe.get_doc("Journal Entry", entry["id"])
            action = ""
            if journal_entry.docstatus == 1:  # Submitted
                action = "cancelled"
                journal_entry.cancel()
                if entry["is_main"]:
                    rto_doc.journal_status = "Cancelled"
                else:
                    entry["account"].status = "Cancelled"
            elif journal_entry.docstatus == 0:  # Draft
                action = "deleted"
                journal_entry.delete()
                if entry["is_main"]:
                    rto_doc.journal_status = "Deleted"
                else:
                    entry["account"].status = "Deleted"
            else:
                action = "already cancelled"
                if entry["is_main"]:
                    rto_doc.journal_status = "Cancelled"
                else:
                    entry["account"].status = "Cancelled"

            # Add activity log entry for RTO Registration
            activity_log = {
                "doctype": "RTO Activity Log",
                "activity": "Journal Entry Action",
                "status": f"Journal Entry {action.capitalize()}",
                "user": frappe.session.user,
                "update_on": frappe.utils.now(),
                "remarks": f"Journal Entry {entry['id']} {action}."
            }
            rto_doc.append("rto_activity", activity_log)

        # Process Vehicle Smart Card updates
        for sc_update in smart_card_updates:
            if sc_update["smart_card_id"]:
                try:
                    sc_doc = frappe.get_doc("Vehicle Smart Card", sc_update["smart_card_id"])
                    if sc_doc.journal_entry_id:
                        action = ""
                        journal_entry = frappe.get_doc("Journal Entry", sc_doc.journal_entry_id)
                        if journal_entry.docstatus == 1:  # Submitted
                            action = "cancelled"
                            journal_entry.cancel()
                            sc_doc.journal_status = "Cancelled"
                        elif journal_entry.docstatus == 0:  # Draft
                            action = "deleted"
                            journal_entry.delete()
                            sc_doc.journal_status = "Deleted"
                        else:
                            action = "already cancelled"
                            sc_doc.journal_status = "Cancelled"

                        # Clear journal_entry_id
                        sc_doc.journal_entry_id = ""

                        # Add activity log entry for Vehicle Smart Card
                        sc_activity_log = {
                            "doctype": "RTO Activity Log",
                            "activity": "Journal Entry Action",
                            "status": f"Journal Entry {action.capitalize()}",
                            "user": frappe.session.user,
                            "update_on": frappe.utils.now(),
                            "remarks": f"Journal Entry {sc_doc.journal_entry_id} {action} for Smart Card."
                        }
                        sc_doc.append("rto_activity", sc_activity_log)

                        # Save the Vehicle Smart Card document
                        sc_doc.save()
                        frappe.db.commit()

                except Exception as sc_e:
                    frappe.log_error(f"Error updating Vehicle Smart Card {sc_update['smart_card_id']}: {str(sc_e)}")
                    # Continue processing other smart cards or journal entries
                    continue

        # Save the RTO Registration document again to update statuses and activity log
        rto_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entries and Vehicle Smart Card(s) have been processed, statuses updated, and activity logs added.")
        )

    except Exception as e:
        # Ensure rollback even if frappe is partially unavailable
        try:
            frappe.db.rollback()
        except Exception as rollback_e:
            # Log rollback failure
            print(f"Rollback failed: {str(rollback_e)}")
        # Log the original error
        try:
            frappe.log_error(f"Error in Cancel Journal Entry for RTO Registration {doc_dict.get('name', 'Unknown')}: {str(e)}")
        except Exception:
            print(f"Error logging failed: {str(e)}")
        raise frappe.ValidationError(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )
    
    
    # for insurance

import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_insurance(doc):
    """
    Custom button action for Vehicle Insurance to cancel or delete the linked Journal Entry.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from Vehicle Insurance before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft.
    - Updates journal_status to 'Cancelled' or 'Deleted' in Vehicle Insurance.
    - Clears journal_entry_id for both cancellation and deletion.
    - Adds activity log entries for the journal entry action in insurance_activity child table.
    """
    try:
        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the Vehicle Insurance document
        insurance_doc = frappe.get_doc("Vehicle Insurance", doc_dict["name"])

        # Check if journal_entry_id exists
        journal_entry_id = insurance_doc.get("journal_entry_id")
        if not journal_entry_id:
            frappe.msgprint(_("No Journal Entry linked to this Vehicle Insurance."))
            return

        # Unlink journal_entry_id
        insurance_doc.journal_entry_id = ""

        # Save the document to persist unlinking
        insurance_doc.save()
        frappe.db.commit()

        # Process the journal entry
        journal_entry = frappe.get_doc("Journal Entry", journal_entry_id)
        action = ""
        if journal_entry.docstatus == 1:  # Submitted
            action = "cancelled"
            journal_entry.cancel()
            insurance_doc.journal_status = "Cancelled"
        elif journal_entry.docstatus == 0:  # Draft
            action = "deleted"
            journal_entry.delete()
            insurance_doc.journal_status = "Deleted"
        else:
            action = "already cancelled"
            insurance_doc.journal_status = "Cancelled"

        # Add activity log entry for the journal entry
        activity_log = {
            "doctype": "Insurance Activity",
            "activity": "Journal Entry Action",
            "status": f"Journal Entry {action.capitalize()}",
            "user": frappe.session.user,
            "update_on": frappe.utils.now(),
            "remarks": f"Journal Entry {journal_entry_id} {action}."
        }
        insurance_doc.append("insurance_activity", activity_log)

        # Save the document again to update status and activity log
        insurance_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entry has been processed, status updated, and activity log added.")
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in Cancel Journal Entry for Vehicle Insurance {doc_dict.get('name', 'Unknown')}: {str(e)}")
        frappe.throw(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )



        # for vehicle finance

        import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_finance(doc):
    """
    Custom button action for Vehicle Finance to cancel or delete the linked Journal Entry.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from Vehicle Finance before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft.
    - Updates journal_status to 'Cancelled' or 'Deleted' in Vehicle Finance.
    - Clears journal_entry_id for both cancellation and deletion.
    - Adds activity log entries for the journal entry action in finance_activity child table.
    """
    try:
        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the Vehicle Finance document
        finance_doc = frappe.get_doc("Vehicle Finance", doc_dict["name"])

        # Check if journal_entry_id exists
        journal_entry_id = finance_doc.get("journal_entry_id")
        if not journal_entry_id:
            frappe.msgprint(_("No Journal Entry linked to this Vehicle Finance."))
            return

        # Unlink journal_entry_id
        finance_doc.journal_entry_id = ""

        # Save the document to persist unlinking
        finance_doc.save()
        frappe.db.commit()

        # Process the journal entry
        journal_entry = frappe.get_doc("Journal Entry", journal_entry_id)
        action = ""
        if journal_entry.docstatus == 1:  # Submitted
            action = "cancelled"
            journal_entry.cancel()
            finance_doc.journal_status = "Cancelled"
        elif journal_entry.docstatus == 0:  # Draft
            action = "deleted"
            journal_entry.delete()
            finance_doc.journal_status = "Deleted"
        else:
            action = "already cancelled"
            finance_doc.journal_status = "Cancelled"

        # Add activity log entry for the journal entry
        activity_log = {
            "doctype": "Finance Activity",
            "activity": "Journal Entry Action",
            "status": f"Journal Entry {action.capitalize()}",
            "user": frappe.session.user,
            "update_on": frappe.utils.now(),
            "remarks": f"Journal Entry {journal_entry_id} {action}."
        }
        finance_doc.append("finance_activity", activity_log)

        # Save the document again to update status and activity log
        finance_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entry has been processed, status updated, and activity log added.")
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in Cancel Journal Entry for Vehicle Finance {doc_dict.get('name', 'Unknown')}: {str(e)}")
        frappe.throw(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )


        # for vehicle rsa
    import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_rsa(doc):
    """
    Custom button action for Vehicle RSA to cancel or delete the linked Journal Entry.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from Vehicle RSA before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft.
    - Updates journal_status to 'Cancelled' or 'Deleted' in Vehicle RSA.
    - Clears journal_entry_id for both cancellation and deletion.
    - Adds activity log entries for the journal entry action in rsa_activity child table.
    """
    try:
        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the Vehicle RSA document
        rsa_doc = frappe.get_doc("Vehicle RSA", doc_dict["name"])

        # Check if journal_entry_id exists
        journal_entry_id = rsa_doc.get("journal_entry_id")
        if not journal_entry_id:
            frappe.msgprint(_("No Journal Entry linked to this Vehicle RSA."))
            return

        # Unlink journal_entry_id
        rsa_doc.journal_entry_id = ""

        # Save the document to persist unlinking
        rsa_doc.save()
        frappe.db.commit()

        # Process the journal entry
        journal_entry = frappe.get_doc("Journal Entry", journal_entry_id)
        action = ""
        if journal_entry.docstatus == 1:  # Submitted
            action = "cancelled"
            journal_entry.cancel()
            rsa_doc.journal_status = "Cancelled"
        elif journal_entry.docstatus == 0:  # Draft
            action = "deleted"
            journal_entry.delete()
            rsa_doc.journal_status = "Deleted"
        else:
            action = "already cancelled"
            rsa_doc.journal_status = "Cancelled"

        # Add activity log entry for the journal entry
        activity_log = {
            "doctype": "RSA Activity",
            "activity": "Journal Entry Action",
            "status": f"Journal Entry {action.capitalize()}",
            "user": frappe.session.user,
            "update_on": frappe.utils.now(),
            "remarks": f"Journal Entry {journal_entry_id} {action}."
        }
        rsa_doc.append("rsa_activity", activity_log)

        # Save the document again to update status and activity log
        rsa_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entry has been processed, status updated, and activity log added.")
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in Cancel Journal Entry for Vehicle RSA {doc_dict.get('name', 'Unknown')}: {str(e)}")
        frappe.throw(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )




        import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_extended_warranty(doc):
    """
    Custom button action for Vehicle Extended Warranty to cancel or delete the linked Journal Entry.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from Vehicle Extended Warranty before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft.
    - Updates journal_status to 'Cancelled' or 'Deleted' in Vehicle Extended Warranty.
    - Clears journal_entry_id for both cancellation and deletion.
    - Adds activity log entries for the journal entry action in extended_warranty_activity child table.
    """
    try:
        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the Vehicle Extended Warranty document
        ew_doc = frappe.get_doc("Vehicle Extended Warranty", doc_dict["name"])

        # Check if journal_entry_id exists
        journal_entry_id = ew_doc.get("journal_entry_id")
        if not journal_entry_id:
            frappe.msgprint(_("No Journal Entry linked to this Vehicle Extended Warranty."))
            return

        # Unlink journal_entry_id
        ew_doc.journal_entry_id = ""

        # Save the document to persist unlinking
        ew_doc.save()
        frappe.db.commit()

        # Process the journal entry
        journal_entry = frappe.get_doc("Journal Entry", journal_entry_id)
        action = ""
        if journal_entry.docstatus == 1:  # Submitted
            action = "cancelled"
            journal_entry.cancel()
            ew_doc.journal_status = "Cancelled"
        elif journal_entry.docstatus == 0:  # Draft
            action = "deleted"
            journal_entry.delete()
            ew_doc.journal_status = "Deleted"
        else:
            action = "already cancelled"
            ew_doc.journal_status = "Cancelled"

        # Add activity log entry for the journal entry
        activity_log = {
            "doctype": "Extended Warranty Activity",
            "activity": "Journal Entry Action",
            "status": f"Journal Entry {action.capitalize()}",
            "user": frappe.session.user,
            "update_on": frappe.utils.now(),
            "remarks": f"Journal Entry {journal_entry_id} {action}."
        }
        ew_doc.append("extended_warranty_activity", activity_log)

        # Save the document again to update status and activity log
        ew_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entry has been processed, status updated, and activity log added.")
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in Cancel Journal Entry for Vehicle Extended Warranty {doc_dict.get('name', 'Unknown')}: {str(e)}")
        frappe.throw(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )





    import frappe
from frappe import _

@frappe.whitelist()
def cancel_journal_entry_misc_sales(doc):
    """
    Custom button action for Vehicle Misc Sales to cancel or delete linked Journal Entries in misc_accounts.
    - Expects doc as a JSON string, parses it, and retrieves the Frappe document.
    - Unlinks journal_entry_id from misc_accounts before cancellation/deletion.
    - Cancels Journal Entry if Submitted, deletes if Draft, for all journal entries in misc_accounts.
    - Updates journal_status to 'Cancelled' or 'Deleted' in Vehicle Misc Sales based on actions.
    - Clears journal_entry_id in misc_accounts for both cancellation and deletion.
    - Adds activity log entries for each journal entry action in misc_activity child table.
    """
    try:
        # Parse JSON string to dictionary
        doc_dict = frappe.parse_json(doc)
        if not doc_dict.get("name"):
            frappe.throw(_("Invalid document data: No 'name' field found."))

        # Get the Vehicle Misc Sales document
        misc_doc = frappe.get_doc("Vehicle Misc Sales", doc_dict["name"])

        # Check if any journal_entry_id exists in misc_accounts
        journal_entries_to_process = [
            {"id": account.journal_entry_id, "account": account}
            for account in misc_doc.get("misc_accounts", [])
            if account.journal_entry_id
        ]
        if not journal_entries_to_process:
            frappe.msgprint(_("No Journal Entries linked to this Vehicle Misc Sales."))
            return

        # Unlink all journal_entry_id in misc_accounts
        for account in misc_doc.get("misc_accounts", []):
            if account.journal_entry_id:
                account.journal_entry_id = ""

        # Save the document to persist unlinking
        misc_doc.save()
        frappe.db.commit()

        # Track if all actions are the same (to set journal_status)
        actions = set()
        for entry in journal_entries_to_process:
            journal_entry = frappe.get_doc("Journal Entry", entry["id"])
            action = ""
            if journal_entry.docstatus == 1:  # Submitted
                action = "cancelled"
                journal_entry.cancel()
            elif journal_entry.docstatus == 0:  # Draft
                action = "deleted"
                journal_entry.delete()
            else:
                action = "already cancelled"

            actions.add(action)

            # Add activity log entry for each journal entry
            activity_log = {
                "doctype": "Misc Activity",
                "activity": "Journal Entry Action",
                "status": f"Journal Entry {action.capitalize()}",
                "user": frappe.session.user,
                "update_on": frappe.utils.now(),
                "remarks": f"Journal Entry {entry['id']} {action} for account {entry['account'].misc_account}."
            }
            misc_doc.append("misc_activity", activity_log)

        # Update journal_status based on actions
        if len(actions) == 1:
            action = actions.pop()
            misc_doc.journal_status = "Cancelled" if action == "cancelled" else "Deleted" if action == "deleted" else "Cancelled"
        else:
            # If mixed actions (e.g., some cancelled, some deleted), default to Cancelled
            misc_doc.journal_status = "Cancelled"

        # Save the document again to update status and activity log
        misc_doc.save()
        frappe.db.commit()

        frappe.msgprint(
            _("Journal Entries have been processed, status updated, and activity logs added.")
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error in Cancel Journal Entry for Vehicle Misc Sales {doc_dict.get('name', 'Unknown')}: {str(e)}")
        frappe.throw(
            _("Failed to process Journal Entry cancellation/deletion: {0}").format(str(e))
        )