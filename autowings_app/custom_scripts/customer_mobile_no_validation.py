import frappe
from frappe.model.document import Document

class Customer(Document):
    def before_save(self):
        if self.mobile_no:
            if frappe.db.exists('Customer', {'mobile_no': self.mobile_no, 'name': ['!=', self.name]}):
                frappe.throw("A customer with this mobile number already exists.")