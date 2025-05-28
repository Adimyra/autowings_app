frappe.ui.form.on('Customer', {
    before_save: function(frm) {
        if (frm.doc.mobile_no) {
            frappe.db.exists('Customer', { 'mobile_no': frm.doc.mobile_no, 'name': ['!=', frm.doc.name] })
                .then(exists => {
                    if (exists) {
                        frappe.throw(__('A customer with this mobile number already exists.'));
                    }
                });
        }
    }
});