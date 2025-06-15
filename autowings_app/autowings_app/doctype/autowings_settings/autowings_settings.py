import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import money_in_words

class AutowingsSettings(Document):
    pass

@frappe.whitelist()
def update_document(doctype, doc_id, amount, posting_date):
    """
    Updates the amount and posting_date of a Journal Entry or Payment Entry using MariaDB queries.
    After the update, clears all relevant fields in Autowings Settings.
    Args:
        doctype (str): "Journal Entry" or "Payment Entry"
        doc_id (str): Name of the document to update (e.g., "ACC-JV-2025-00341")
        amount (float): New amount to set
        posting_date (str): New posting date in YYYY-MM-DD format
    Returns:
        dict: {success: bool, error: str (if failed)}
    """
    try:
        # Validate inputs
        if not doctype in ["Journal Entry", "Payment Entry"]:
            return {"success": False, "error": "Invalid doctype. Must be 'Journal Entry' or 'Payment Entry'."}
        if not doc_id:
            return {"success": False, "error": "Document ID is required."}
        if not amount or float(amount) <= 0:
            return {"success": False, "error": "A valid Amount greater than 0 is required."}
        if not posting_date:
            return {"success": False, "error": "Posting Date is required."}

        amount = float(amount)
        # Convert amount to words (e.g., "INR Five Thousand, Five Hundred And Fifty Five only.")
        amount_in_words = money_in_words(amount, main_currency="INR")

        # Begin transaction
        frappe.db.begin()

        if doctype == "Journal Entry":
            # Update the main Journal Entry table
            frappe.db.sql("""
                UPDATE `tabJournal Entry`
                SET
                    total_debit = %s,
                    total_credit = %s,
                    total_amount = %s,
                    total_amount_in_words = %s,
                    posting_date = %s,
                    modified = NOW(),
                    modified_by = %s
                WHERE name = %s
            """, (amount, amount, amount, amount_in_words, posting_date, frappe.session.user, doc_id))

            # Update the accounts child table (first row: debit, second row: credit)
            frappe.db.sql("""
                UPDATE `tabJournal Entry Account`
                SET
                    debit_in_account_currency = %s,
                    debit = %s,
                    modified = NOW(),
                    modified_by = %s
                WHERE parent = %s AND idx = 1
            """, (amount, amount, frappe.session.user, doc_id))

            frappe.db.sql("""
                UPDATE `tabJournal Entry Account`
                SET
                    credit_in_account_currency = %s,
                    credit = %s,
                    modified = NOW(),
                    modified_by = %s
                WHERE parent = %s AND idx = 2
            """, (amount, amount, frappe.session.user, doc_id))

        elif doctype == "Payment Entry":
            # Update the main Payment Entry table
            frappe.db.sql("""
                UPDATE `tabPayment Entry`
                SET
                    paid_amount = %s,
                    paid_amount_after_tax = %s,
                    base_paid_amount = %s,
                    base_paid_amount_after_tax = %s,
                    received_amount = %s,
                    received_amount_after_tax = %s,
                    base_received_amount = %s,
                    base_received_amount_after_tax = %s,
                    total_allocated_amount = %s,
                    base_total_allocated_amount = %s,
                    base_in_words = %s,
                    in_words = %s,
                    posting_date = %s,
                    modified = NOW(),
                    modified_by = %s
                WHERE name = %s
            """, (
                amount, amount, amount, amount,
                amount, amount, amount, amount,
                amount, amount, amount_in_words, amount_in_words,
                posting_date, frappe.session.user, doc_id
            ))

        # Clear all relevant fields in Autowings Settings (stored in tabSingles)
        fields_to_clear = [
            ("update_doc", ""),
            ("journal_entry_id", ""),
            ("payment_entry_id", ""),
            ("customer", ""),
            ("customer_name", ""),
            ("posting_date", ""),
            ("doc_status", ""),
            ("amount", 0)
        ]

        for field, value in fields_to_clear:
            frappe.db.sql("""
                UPDATE `tabSingles`
                SET
                    value = %s
                WHERE doctype = 'Autowings Settings' AND field = %s
            """, (value, field))

        # Commit the transaction
        frappe.db.commit()

        # Reload the Autowings Settings document to reflect the cleared fields
        autowings_settings = frappe.get_doc("Autowings Settings")
        autowings_settings.save(ignore_permissions=True)

        return {"success": True}

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error updating {doctype} {doc_id}", str(e))
        return {"success": False, "error": str(e)}