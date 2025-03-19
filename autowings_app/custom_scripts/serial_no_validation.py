import frappe

def validate_serial_no_and_engine_number(doc, method):
    """Ensure serial_no and engine_number are not duplicated incorrectly"""
    
    # Check if a Serial No with the same serial_no already exists
    existing_serial = frappe.db.exists("Serial No", {"serial_no": doc.serial_no})

    if existing_serial:
        # Fetch the existing document details
        existing_doc = frappe.get_doc("Serial No", existing_serial)

        # Validate that the engine number is the same as the existing entry
        if doc.custom_engine_number != existing_doc.custom_engine_number:
            frappe.throw(f"Engine Number mismatch! Serial No {doc.serial_no} already exists "
                         f"with a different engine number: {existing_doc.custom_engine_number}. "
                         f"Ensure the correct engine number is used.")

    # Check if an engine number already exists in another Serial No
    existing_engine = frappe.db.exists("Serial No", {"custom_engine_number": doc.custom_engine_number})
    
    if existing_engine and not existing_serial:
        frappe.throw(f"Engine Number {doc.custom_engine_number} is already assigned to another Serial No. "
                     f"Duplicate engine numbers are not allowed.")

    # If everything is fine, allow saving
