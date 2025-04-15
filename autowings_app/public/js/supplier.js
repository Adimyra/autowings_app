// frappe.ui.form.on('Supplier', {
//     refresh: function(frm) {
//         if (frm.doc.supplier_group === "Insurance") {
//             frm.fields_dict['insurance_policy'].grid.get_field('insurance_provider').get_query = function() {
//                 return {
//                     filters: {
//                         'name': frm.doc.name
//                     }
//                 };
//             };
//         }
//     }
// });

// frappe.ui.form.on('Insurance Policy', {
//     insurance_policy_add: function(frm, cdt, cdn) {
//         if (frm.doc.supplier_group === "Insurance") {
//             frappe.model.set_value(cdt, cdn, 'insurance_provider', frm.doc.name);
//         }
//     }
// });