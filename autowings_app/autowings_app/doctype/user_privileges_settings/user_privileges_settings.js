// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("User Privileges Settings", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('User Privileges Settings', {
    onload: function(frm) {
        frappe.call({
            method: "autowings_app.api.get_sales_invoice_series",
            callback: function(r) {
                if (r.message) {
                    let options = r.message.join("\n");  // Convert list to newline-separated string
                    frm.fields_dict['users'].grid.fields_map['sales_invoice_series'].options = options;
                    frm.refresh_field('users');
                }
            }
        });
    }
});
