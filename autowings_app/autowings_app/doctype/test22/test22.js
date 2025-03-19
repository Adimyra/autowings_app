// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("test22", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("test22", {
    refresh: function(frm) {
        frm.fields_dict.test_button.$wrapper.find("button").on("click", function() {
            frappe.msgprint({
                title: __('Notification'),
                indicator: 'blue',
                message: __('Hi!')
            });
        });
    }
});
