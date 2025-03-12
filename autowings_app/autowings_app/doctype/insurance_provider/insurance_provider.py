# Copyright (c) 2025, Adimyra Systems Private Limited and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class InsuranceProvider(Document):
# 	pass

import frappe
from frappe.model.document import Document

class InsuranceProvider(Document):
    def before_save(self):
        """Ensure provider_name is set in all rows of policy_types child table"""
        for policy in self.get("policy_types"):
            policy.insurance_provider = self.provider_name  # Set insurance provider in child table
