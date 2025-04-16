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