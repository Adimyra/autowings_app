import frappe


def validate_chassis_and_engine_number(doc, method):
    if doc.custom_purchase_type != "Vehicle":
        return

    duplicate_chassis = []
    duplicate_engine = []

    for vin in doc.custom_vin:
        # Check for duplicate chassis number
        if vin.chassis_number:
            exists_chassis = frappe.db.exists("Serial No", {"name": vin.chassis_number})
            if exists_chassis:
                duplicate_chassis.append(vin.chassis_number)

        # Check for duplicate engine number
        if vin.engine_number:
            exists_engine = frappe.db.exists("Serial No", {"custom_engine_number": vin.engine_number})
            if exists_engine:
                duplicate_engine.append(vin.engine_number)

    # If any duplicates found, throw error
    messages = []
    if duplicate_chassis:
        messages.append(f"🚫 Duplicate Chassis Numbers: {', '.join(duplicate_chassis)}")
    if duplicate_engine:
        messages.append(f"🚫 Duplicate Engine Numbers: {', '.join(duplicate_engine)}")

    if messages:
        frappe.throw("<br>".join(messages))


# update 2

import frappe

@frappe.whitelist()
def validate_vin_data_dict(doc):
    """
    Validates VIN entries passed as raw dict (unsaved Purchase Invoice).
    This is useful when validating right after VIN CSV upload, before submit/save.
    """
    import json

    if isinstance(doc, str):
        doc = json.loads(doc)

    if doc.get("custom_purchase_type") != "Vehicle":
        return

    duplicate_chassis = []
    duplicate_engine = []

    for vin in doc.get("custom_vin", []):
        chassis = vin.get("chassis_number")
        engine = vin.get("engine_number")

        if chassis and frappe.db.exists("Serial No", {"name": chassis}):
            duplicate_chassis.append(chassis)

        if engine and frappe.db.exists("Serial No", {"custom_engine_number": engine}):
            duplicate_engine.append(engine)

    if duplicate_chassis or duplicate_engine:
        msg = ""
        if duplicate_chassis:
            msg += f"🚫 Duplicate Chassis Numbers: {', '.join(duplicate_chassis)}<br>"
        if duplicate_engine:
            msg += f"🚫 Duplicate Engine Numbers: {', '.join(duplicate_engine)}"
        frappe.throw(msg)
