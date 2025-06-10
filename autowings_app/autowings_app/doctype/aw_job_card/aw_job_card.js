// // frappe.ui.form.on('AW Job Card', {
// //     refresh: function(frm) {
// //         // Add custom button "Issue Items"
// //         frm.add_custom_button(__('Issue Items'), function() {
// //             // Create a new dialog (modal)
// //             let dialog = new frappe.ui.Dialog({
// //                 title: 'Issue Items',
// //                 fields: [
// //                     {
// //                         label: 'Posting Date',
// //                         fieldname: 'posting_date',
// //                         fieldtype: 'Date',
// //                         default: frappe.datetime.get_today(),
// //                         read_only: 1
// //                     },
// //                     {
// //                         label: 'Source Warehouse',
// //                         fieldname: 'source_warehouse',
// //                         fieldtype: 'Link',
// //                         options: 'Warehouse',
// //                         reqd: 1
// //                     },
// //                     {
// //                         label: 'Items',
// //                         fieldname: 'items',
// //                         fieldtype: 'Table',
// //                         cannot_add_rows: false,
// //                         reqd: 1,
// //                         data: [],
// //                         fields: [
// //                             {
// //                                 label: 'Item Code',
// //                                 fieldname: 'item_code',
// //                                 fieldtype: 'Link',
// //                                 options: 'Item',
// //                                 reqd: 1,
// //                                 in_list_view: 1
// //                             },
// //                             {
// //                                 label: 'Required Qty',
// //                                 fieldname: 'required_qty',
// //                                 fieldtype: 'Float',
// //                                 reqd: 1,
// //                                 in_list_view: 1
// //                             },
// //                             {
// //                                 label: 'Stock UOM',
// //                                 fieldname: 'stock_uom',
// //                                 fieldtype: 'Data',
// //                                 read_only: 1,
// //                                 hidden: 1 // Hidden but needed for Delivery Note and AW Job Card
// //                             }
// //                         ]
// //                     }
// //                 ],
// //                 primary_action_label: 'Create Delivery Note',
// //                 primary_action: function(values) {
// //                     // Validate items
// //                     if (!values.items || values.items.length === 0) {
// //                         frappe.msgprint(__('Please add at least one item.'));
// //                         return;
// //                     }

// //                     // Fetch item details for each item to get item_name and stock_uom
// //                     let promises = values.items.map(item => {
// //                         return frappe.db.get_value('Item', item.item_code, ['item_name', 'stock_uom'])
// //                             .then(r => ({
// //                                 item_code: item.item_code,
// //                                 item_name: r.message.item_name,
// //                                 qty: item.required_qty,
// //                                 warehouse: values.source_warehouse,
// //                                 stock_uom: r.message.stock_uom || 'Nos'
// //                             }));
// //                     });

// //                     // Wait for all item details to be fetched
// //                     Promise.all(promises).then(items => {
// //                         // Create Delivery Note
// //                         frappe.call({
// //                             method: 'frappe.client.insert',
// //                             args: {
// //                                 doc: {
// //                                     doctype: 'Delivery Note',
// //                                     customer: frm.doc.customer,
// //                                     posting_date: values.posting_date,
// //                                     company: frm.doc.company,
// //                                     custom_job_card_id: frm.doc.name,
// //                                     items: items,
// //                                     set_warehouse: values.source_warehouse,
// //                                 }
// //                             },
// //                             callback: function(r) {
// //                                 if (r.message) {
// //                                     let delivery_note_id = r.message.name;
// //                                     frappe.msgprint(__('Delivery Note {0} created successfully.').replace('{0}', delivery_note_id));

// //                                     // Append items to AW Job Card items table
// //                                     items.forEach(item => {
// //                                         let row = frm.add_child('items');
// //                                         row.item_code = item.item_code;
// //                                         row.item_name = item.item_name;
// //                                         row.required_qty = item.qty;
// //                                         row.transferred_qty = item.qty;
// //                                         row.source_warehouse = values.source_warehouse;
// //                                         row.item_group = 'Products';
// //                                         row.stock_uom = item.stock_uom;
// //                                         row.allow_alternative_item = 0;
// //                                         row.delivery_note_id = delivery_note_id;
// //                                     });

// //                                     // Save (not submit) the AW Job Card
// //                                     frm.save('Save', function() {
// //                                         frappe.msgprint(__('AW Job Card saved successfully.'));
// //                                         dialog.hide();
// //                                     });
// //                                 }
// //                             }
// //                         });
// //                     });
// //                 }
// //             });

// //             // Set modal width to 80% of screen
// //             dialog.$wrapper.find('.modal-dialog').css({
// //                 'width': '80%',
// //                 'max-width': 'none',
// //                 'min-width': '800px'
// //             });

// //             // Ensure table columns are flexible
// //             dialog.$wrapper.find('.grid-heading-row .data-row').css({
// //                 'flex': '1 1 auto',
// //                 'min-width': '100px'
// //             });
// //             dialog.$wrapper.find('.grid-row .data-row').css({
// //                 'flex': '1 1 auto',
// //                 'min-width': '100px'
// //             });

// //             dialog.show();
// //         });
// //     }
// // });


// // -------******
// frappe.ui.form.on('AW Job Card', {
//     refresh: function(frm) {
//         // Add custom button "Issue Items"
//         frm.add_custom_button(__('Issue Items'), function() {
//             let dialog = new frappe.ui.Dialog({
//                 title: 'Issue Items',
//                 fields: [
//                     {
//                         label: 'Posting Date',
//                         fieldname: 'posting_date',
//                         fieldtype: 'Date',
//                         default: frappe.datetime.get_today(),
//                         read_only: 1
//                     },
//                     {
//                         label: 'Source Warehouse',
//                         fieldname: 'source_warehouse',
//                         fieldtype: 'Link',
//                         options: 'Warehouse',
//                         reqd: 1
//                     },
//                     {
//                         label: 'Items',
//                         fieldname: 'items',
//                         fieldtype: 'Table',
//                         cannot_add_rows: false,
//                         reqd: 1,
//                         data: [],
//                         fields: [
//                             {
//                                 label: 'Item Code',
//                                 fieldname: 'item_code',
//                                 fieldtype: 'Link',
//                                 options: 'Item',
//                                 reqd: 1,
//                                 in_list_view: 1
//                             },
//                             {
//                                 label: 'Required Qty',
//                                 fieldname: 'required_qty',
//                                 fieldtype: 'Float',
//                                 reqd: 1,
//                                 in_list_view: 1
//                             },
//                             {
//                                 label: 'Stock UOM',
//                                 fieldname: 'stock_uom',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             }
//                         ]
//                     }
//                 ],
//                 primary_action_label: 'Create Delivery Note',
//                 primary_action: function(values) {
//                     if (!values.items || values.items.length === 0) {
//                         frappe.msgprint(__('Please add at least one item.'));
//                         return;
//                     }
//                     let promises = values.items.map(item => {
//                         return frappe.db.get_value('Item', item.item_code, ['item_name', 'stock_uom'])
//                             .then(r => ({
//                                 item_code: item.item_code,
//                                 item_name: r.message.item_name,
//                                 qty: item.required_qty,
//                                 warehouse: values.source_warehouse,
//                                 stock_uom: r.message.stock_uom || 'Nos'
//                             }));
//                     });
//                     Promise.all(promises).then(items => {
//                         frappe.call({
//                             method: 'frappe.client.insert',
//                             args: {
//                                 doc: {
//                                     doctype: 'Delivery Note',
//                                     customer: frm.doc.customer,
//                                     posting_date: values.posting_date,
//                                     company: frm.doc.company,
//                                     custom_job_card_id: frm.doc.name,
//                                     items: items
//                                 }
//                             },
//                             callback: function(r) {
//                                 if (r.message) {
//                                     let delivery_note_id = r.message.name;
//                                     frappe.msgprint(__('Delivery Note {0} created successfully.').replace('{0}', delivery_note_id));
//                                     items.forEach(item => {
//                                         let row = frm.add_child('items');
//                                         row.item_code = item.item_code;
//                                         row.item_name = item.item_name;
//                                         row.required_qty = item.qty;
//                                         row.transferred_qty = item.qty;
//                                         row.source_warehouse = values.source_warehouse;
//                                         row.item_group = 'Products';
//                                         row.stock_uom = item.stock_uom;
//                                         row.allow_alternative_item = 0;
//                                         row.delivery_note_id = delivery_note_id;
//                                     });
//                                     frm.save('Save', function() {
//                                         frappe.msgprint(__('AW Job Card saved successfully.'));
//                                         dialog.hide();
//                                     });
//                                 }
//                             }
//                         });
//                     });
//                 }
//             });
//             dialog.$wrapper.find('.modal-dialog').css({
//                 'width': '80%',
//                 'max-width': 'none',
//                 'min-width': '800px'
//             });
//             dialog.$wrapper.find('.grid-heading-row .data-row').css({
//                 'flex': '1 1 auto',
//                 'min-width': '100px'
//             });
//             dialog.$wrapper.find('.grid-row .data-row').css({
//                 'flex': '1 1 auto',
//                 'min-width': '100px'
//             });
//             dialog.show();
//         });

//         // Add custom button "Return Items"
//         frm.add_custom_button(__('Return Items'), function() {
//             // Fetch items from AW Job Card items table that have a delivery_note_id
//             let available_items = frm.doc.items.filter(item => item.delivery_note_id).map(item => ({
//                 item_code: item.item_code,
//                 item_name: item.item_name,
//                 delivery_note_id: item.delivery_note_id,
//                 stock_uom: item.stock_uom
//             }));

//             if (!available_items.length) {
//                 frappe.msgprint(__('No items with a Delivery Note ID available in the Items table to return.'));
//                 return;
//             }

//             // Create a new dialog (modal) for returns
//             let dialog = new frappe.ui.Dialog({
//                 title: 'Return Items',
//                 fields: [
//                     {
//                         label: 'Posting Date',
//                         fieldname: 'posting_date',
//                         fieldtype: 'Date',
//                         default: frappe.datetime.get_today(),
//                         read_only: 1
//                     },
//                     {
//                         label: 'Items',
//                         fieldname: 'items',
//                         fieldtype: 'Table',
//                         cannot_add_rows: false,
//                         reqd: 1,
//                         data: [],
//                         fields: [
//                             {
//                                 label: 'Item Code',
//                                 fieldname: 'item_code',
//                                 fieldtype: 'Select',
//                                 options: available_items.map(item => item.item_code),
//                                 reqd: 1,
//                                 in_list_view: 1,
//                                 onchange: function() {
//                                     let row = this.grid_row;
//                                     let item_code = row.get_value('item_code');
//                                     if (item_code) {
//                                         let selected_item = available_items.find(item => item.item_code === item_code);
//                                         if (selected_item) {
//                                             row.set_value('delivery_note_id', selected_item.delivery_note_id);
//                                             row.set_value('stock_uom', selected_item.stock_uom);
//                                             dialog.refresh_field('items');
//                                         }
//                                     } else {
//                                         row.set_value('delivery_note_id', '');
//                                         row.set_value('stock_uom', '');
//                                         dialog.refresh_field('items');
//                                     }
//                                 }
//                             },
//                             {
//                                 label: 'Delivery Note ID',
//                                 fieldname: 'delivery_note_id',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 in_list_view: 1
//                             },
//                             {
//                                 label: 'Required Qty',
//                                 fieldname: 'required_qty',
//                                 fieldtype: 'Float',
//                                 reqd: 1,
//                                 in_list_view: 1
//                             },
//                             {
//                                 label: 'Stock UOM',
//                                 fieldname: 'stock_uom',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             }
//                         ]
//                     }
//                 ],
//                 primary_action_label: 'Create Return Delivery Note',
//                 primary_action: function(values) {
//                     if (!values.items || values.items.length === 0) {
//                         frappe.msgprint(__('Please add at least one item to return.'));
//                         return;
//                     }

//                     // Validate that all items have a delivery_note_id
//                     let invalid_items = values.items.filter(item => !item.delivery_note_id);
//                     if (invalid_items.length > 0) {
//                         frappe.msgprint(__('All items must have a valid Delivery Note ID.'));
//                         return;
//                     }

//                     // Group items by delivery_note_id to create separate return Delivery Notes
//                     let items_by_dn = {};
//                     values.items.forEach(item => {
//                         let dn_id = item.delivery_note_id;
//                         if (!items_by_dn[dn_id]) {
//                             items_by_dn[dn_id] = [];
//                         }
//                         let selected_item = available_items.find(i => i.item_code === item.item_code);
//                         items_by_dn[dn_id].push({
//                             item_code: item.item_code,
//                             item_name: selected_item.item_name,
//                             qty: -Math.abs(item.required_qty),
//                             stock_uom: selected_item.stock_uom || 'Nos',
//                             warehouse: frm.doc.items.find(i => i.item_code === item.item_code && i.delivery_note_id === dn_id).source_warehouse
//                         });
//                     });

//                     // Create Delivery Notes for each return_against
//                     let promises = Object.keys(items_by_dn).map(dn_id => {
//                         return frappe.call({
//                             method: 'frappe.client.insert',
//                             args: {
//                                 doc: {
//                                     doctype: 'Delivery Note',
//                                     customer: frm.doc.customer,
//                                     posting_date: values.posting_date,
//                                     company: frm.doc.company,
//                                     custom_job_card_id: frm.doc.name,
//                                     is_return: 1,
//                                     return_against: dn_id,
//                                     items: items_by_dn[dn_id]
//                                 }
//                             }
//                         });
//                     });

//                     Promise.all(promises).then(responses => {
//                         let delivery_note_ids = responses.map(r => r.message.name);
//                         frappe.msgprint(__('Return Delivery Note(s) {0} created successfully.').replace('{0}', delivery_note_ids.join(', ')));

//                         // Append to return_items table and update items table
//                         values.items.forEach(item => {
//                             let selected_item = available_items.find(i => i.item_code === item.item_code);
//                             // Append to return_items
//                             let return_row = frm.add_child('return_items');
//                             return_row.item_code = item.item_code;
//                             return_row.item_name = selected_item.item_name;
//                             return_row.required_qty = item.required_qty;
//                             return_row.transferred_qty = 0;
//                             return_row.source_warehouse = frm.doc.items.find(i => i.item_code === item.item_code && i.delivery_note_id === item.delivery_note_id).source_warehouse;
//                             return_row.item_group = 'Products';
//                             return_row.stock_uom = selected_item.stock_uom || 'Nos';
//                             return_row.allow_alternative_item = 0;

//                             // Update items table quantities
//                             let item_row = frm.doc.items.find(i => i.item_code === item.item_code && i.delivery_note_id === item.delivery_note_id);
//                             if (item_row) {
//                                 item_row.required_qty = (item_row.required_qty || 0) - Math.abs(item.required_qty);
//                                 item_row.transferred_qty = (item_row.transferred_qty || 0) - Math.abs(item.required_qty);
//                                 if (item_row.required_qty < 0) item_row.required_qty = 0;
//                                 if (item_row.transferred_qty < 0) item_row.transferred_qty = 0;
//                             }
//                         });

//                         // Save (not submit) the AW Job Card
//                         frm.save('Save', function() {
//                             frappe.msgprint(__('AW Job Card saved successfully.'));
//                             dialog.hide();
//                         });
//                     }).catch(err => {
//                         frappe.msgprint(__('Error creating Return Delivery Note: ') + err.message);
//                     });
//                 }
//             });

//             // Set modal width to 80% of screen
//             dialog.$wrapper.find('.modal-dialog').css({
//                 'width': '80%',
//                 'max-width': 'none',
//                 'min-width': '800px'
//             });
//             dialog.$wrapper.find('.grid-heading-row .data-row').css({
//                 'flex': '1 1 auto',
//                 'min-width': '100px'
//             });
//             dialog.$wrapper.find('.grid-row .data-row').css({
//                 'flex': '1 1 auto',
//                 'min-width': '100px'
//             });
//             dialog.show();
//         });
//     }
// });