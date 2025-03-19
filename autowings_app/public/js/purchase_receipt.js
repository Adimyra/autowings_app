// frappe.ui.form.on('Purchase Receipt', {
//     refresh: function(frm) {
//         // Ensure Add Row Manually button is hidden for custom_vin
//         frm.fields_dict['custom_vin'].grid.wrapper.find('.grid-add-row').show(); // Allow manual addition
//     }
// });

// frappe.ui.form.on('Purchase Receipt Item', {
//     item_code: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         // If qty is not set, default to 1 when selecting the item for the first time
//         if (!row.qty || row.qty <= 0) {
//             frappe.model.set_value(cdt, cdn, 'qty', 1);
//         }

//         // Ensure VIN is added when item is selected
//         if (row.item_code) {
//             add_vin_entry(frm, row.item_code, row.qty);
//         }
//     },
    
//     qty: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         // Ensure correct number of VIN rows match item quantity
//         if (row.item_code && row.qty) {
//             update_vin_entries(frm, row.item_code, row.qty);
//         }
//     }
// });

// // Function to add a VIN entry in `custom_vin` when an item is added
// function add_vin_entry(frm, item_code, qty) {
//     let existing_vin_rows = frm.doc.custom_vin.filter(row => row.item === item_code);

//     if (existing_vin_rows.length < qty) {
//         let diff = qty - existing_vin_rows.length;

//         for (let i = 0; i < diff; i++) {
//             let child = frm.add_child("custom_vin");
//             child.item = item_code;  // Set item in custom_vin
//         }
//         frm.refresh_field("custom_vin");
//     }
// }

// // Function to ensure `custom_vin` rows match item quantity
// function update_vin_entries(frm, item_code, qty) {
//     let existing_vin_rows = frm.doc.custom_vin.filter(row => row.item === item_code);
    
//     if (existing_vin_rows.length > qty) {
//         // Remove extra rows
//         let extra = existing_vin_rows.length - qty;
//         for (let i = 0; i < extra; i++) {
//             let row_idx = frm.doc.custom_vin.findIndex(row => row.item === item_code);
//             frm.doc.custom_vin.splice(row_idx, 1);
//         }
//         frm.refresh_field("custom_vin");
//     } else if (existing_vin_rows.length < qty) {
//         // Add missing rows
//         let missing = qty - existing_vin_rows.length;
//         for (let i = 0; i < missing; i++) {
//             let child = frm.add_child("custom_vin");
//             child.item = item_code;
//         }
//         frm.refresh_field("custom_vin");
//     }
// }



// // add custom button for update table of VIN

// frappe.ui.form.on("Purchase Receipt", {
//     refresh: function(frm) {
//         // Add a custom button
//         frm.add_custom_button(__('Update VIN Data'), function() {
//             open_vin_modal(frm);
//         }, __("Autowings"));
//     }
// });

// function open_vin_modal(frm) {
//     let d = new frappe.ui.Dialog({
//         title: __("Update VIN Data"),
//         fields: [
//             {
//                 label: __("Download VIN CSV"),
//                 fieldname: "download_vin",
//                 fieldtype: "Button",
//                 click: function() {
//                     download_vin_csv(frm);
//                 }
//             },
//             {
//                 label: __("Upload VIN CSV"),
//                 fieldname: "upload_vin",
//                 fieldtype: "Attach",
//                 reqd: 1
//             }
//         ],
//         primary_action_label: __("Upload & Update"),
//         primary_action(values) {
//             if (values.upload_vin) {
//                 update_vin_data(frm, values.upload_vin);
//             }
//             d.hide();
//         }
//     });

//     d.show();
// }

// // Function to download existing VIN Data as CSV
// function download_vin_csv(frm) {
//     frappe.call({
//         method: "autowings_app.custom_scripts.purchase_receipt.download_vin_csv",
//         args: { docname: frm.doc.name },
//         callback: function(r) {
//             if (r.message) {
//                 let csvData = r.message;
//                 let blob = new Blob([csvData], { type: "text/csv" });
//                 let url = window.URL.createObjectURL(blob);
//                 let a = document.createElement("a");
//                 a.setAttribute("href", url);
//                 a.setAttribute("download", `VIN_Details_${frm.doc.name}.csv`);
//                 document.body.appendChild(a);
//                 a.click();
//                 document.body.removeChild(a);
//             }
//         }
//     });
// }

// // Function to update VIN data from uploaded CSV
// function update_vin_data(frm, file_url) {
//     frappe.call({
//         method: "autowings_app.custom_scripts.purchase_receipt.upload_vin_csv",
//         args: {
//             docname: frm.doc.name,
//             file_url: file_url
//         },
//         callback: function(r) {
//             if (!r.exc) {
//                 frappe.msgprint(__("VIN data updated successfully."));
//                 frm.reload_doc();
//             }
//         }
//     });
// }


