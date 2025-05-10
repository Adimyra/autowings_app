// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Firebase Auth OTP", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Firebase Auth OTP', {
    refresh: function (frm) {
        if (!frm.is_new()) {
            if (!frm.doc.otp_sent) {
                frm.add_custom_button('Send OTP', () => {
                    if (!frm.doc.customer_mobile) {
                        frappe.msgprint("Please enter Customer Mobile.");
                        return;
                    }
                    sendOTP(frm.doc.customer_mobile);
                });
            }

            if (!frm.doc.otp_verified) {
                frm.add_custom_button('Verify OTP', () => {
                    if (!frm.doc.user_entered_otp) {
                        frappe.msgprint("Please enter the OTP.");
                        return;
                    }
                    verifyOTP(frm);
                });
            }
        }
    }
});
