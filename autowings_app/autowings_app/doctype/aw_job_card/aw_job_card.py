# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class AWJobCard(Document):
# 	pass


import frappe
from frappe.model.document import Document

class AWJobCard(Document):
    def after_insert(self):
        # Get the chassis number from the AW Job Card
        chassis_number = self.chassis_number
        if not chassis_number:
            frappe.log_error("Chassis Number is not set in AW Job Card: {}".format(self.name))
            return

        # Search for a Serial No document with matching chassis number
        serial_no_doc = frappe.get_all(
            "Serial No",
            filters={
                "custom_chassis_number": chassis_number
            },
            limit=1
        )

        if not serial_no_doc:
            # If no match found with custom_chassis_number, try serial_no
            serial_no_doc = frappe.get_all(
                "Serial No",
                filters={
                    "serial_no": chassis_number
                },
                limit=1
            )

        if not serial_no_doc:
            frappe.log_error("No Serial No found for chassis number: {}".format(chassis_number))
            return

        # Get the Serial No document
        serial_no_name = serial_no_doc[0].name
        serial_no = frappe.get_doc("Serial No", serial_no_name)

        # Append the AW Job Card ID to the custom_job_cards child table
        serial_no.append("custom_job_cards", {
            "job_card_id": self.name
        })

        # Save the Serial No document
        try:
            serial_no.save()
            frappe.db.commit()
            frappe.log_error("Updated Serial No {} with Job Card {}".format(serial_no_name, self.name))
        except Exception as e:
            frappe.log_error("Failed to update Serial No {} with Job Card {}: {}".format(serial_no_name, self.name, str(e)))
            frappe.db.rollback()