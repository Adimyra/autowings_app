// frappe.ui.form.on('Vehicle Sales Master', {
//     refresh(frm) {
//         if (frm.doc.invoice_status === 'Cancelled') {
//             frm.add_custom_button(__('Cancel RTO Journal'), function() {
//                 frappe.call({
//                     method: 'autowings_app.custom_scripts.vehicle_sales_journal_cancel.cancel_rto_journal',
//                     args: {
//                         vsm_name: frm.doc.name
//                     },
//                     callback: function(r) {
//                         if (r.message) {
//                             frappe.msgprint(r.message);
//                         }
//                         frm.refresh();
//                     }
//                 });
//             });
//         }
//     }
// });