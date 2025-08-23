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



// frappe.ui.form.on('Customer', {
//   quick_entry_validate(frm) {
//     // this runs for the Customer Quick Entry dialog
//     if (!cur_dialog) return;

//     // mark Address Line 1 as required (adds the red star)
//     cur_dialog.set_df_property('address_line1', 'reqd', 1);

//     // if blank, stop save (same effect as other required fields)
//     const addr1 = cur_dialog.get_value('address_line1');
//     if (!addr1) {
//       // show the standard required-fields message
//       frappe.msgprint({
//         title: __('Missing Values Required'),
//         message: __('Following fields have missing values:<br><br>Address Line 1'),
//         indicator: 'red'
//       });
//       return false; // blocks the Quick Entry save
//     }
//   }
// });
