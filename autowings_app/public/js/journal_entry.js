frappe.ui.form.on("Journal Entry", {
	refresh: function(frm) {
		frm.remove_custom_button(__("Quick Entry"));
	}
});

// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         // Check if the document is new
//         if (frm.doc.__islocal) {
//             // Add custom button "Quick Entry"
//             frm.add_custom_button(__("My Quick Entry"), function() {
//                 // Fetch company abbreviation
//                 frappe.db.get_value('Company', frm.doc.company, 'abbr', function(r) {
//                     let company_abbr = r.abbr || 'A'; // Fallback to 'A' if abbr not found
//                     // Create a new dialog
//                     let d = new frappe.ui.Dialog({
//                         title: 'Quick Entry',
//                         fields: [
//                             {
//                                 label: 'Debit Account',
//                                 fieldname: 'debit_account',
//                                 fieldtype: 'Data',
//                                 reqd: 1,
//                                 get_query: function() {
//                                     let search_text = d.get_value('debit_account') || '';
//                                     return {
//                                         query: "frappe.desk.search.search_link",
//                                         filters: {
//                                             doctype: ["in", ["Customer", "Supplier", "Account"]],
//                                             query: `
//                                                 SELECT 
//                                                     CASE 
//                                                         WHEN doctype = 'Customer' THEN name
//                                                         WHEN doctype = 'Supplier' THEN name
//                                                         WHEN doctype = 'Account' THEN name
//                                                     END AS name,
//                                                     doctype
//                                                 FROM (
//                                                     SELECT name, 'Customer' AS doctype FROM \`tabCustomer\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Supplier' AS doctype FROM \`tabSupplier\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Account' AS doctype FROM \`tabAccount\` WHERE name LIKE '%${search_text}%' AND company = '${frm.doc.company}'
//                                                 ) AS combined
//                                                 ORDER BY name
//                                             `
//                                         }
//                                     };
//                                 },
//                                 onchange: function() {
//                                     let value = d.get_value('debit_account');
//                                     if (value) {
//                                         // Determine doctype and fetch details
//                                         frappe.db.get_value('Customer', value, 'name', function(c) {
//                                             if (c && c.name) {
//                                                 d.set_value('debit_doctype', 'Customer');
//                                             } else {
//                                                 frappe.db.get_value('Supplier', value, 'name', function(s) {
//                                                     if (s && s.name) {
//                                                         d.set_value('debit_doctype', 'Supplier');
//                                                     } else {
//                                                         frappe.db.get_value('Account', value, 'name', function(a) {
//                                                             if (a && a.name) {
//                                                                 d.set_value('debit_doctype', 'Account');
//                                                             } else {
//                                                                 d.set_value('debit_doctype', '');
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     } else {
//                                         d.set_value('debit_doctype', '');
//                                     }
//                                     // Refresh the field to trigger new search
//                                     d.fields_dict.debit_account.refresh();
//                                 }
//                             },
//                             {
//                                 label: 'Debit Doctype',
//                                 fieldname: 'debit_doctype',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             },
//                             {
//                                 label: 'Credit Account',
//                                 fieldname: 'credit_account',
//                                 fieldtype: 'Data',
//                                 reqd: 1,
//                                 get_query: function() {
//                                     let search_text = d.get_value('credit_account') || '';
//                                     return {
//                                         query: "frappe.desk.search.search_link",
//                                         filters: {
//                                             doctype: ["in", ["Customer", "Supplier", "Account"]],
//                                             query: `
//                                                 SELECT 
//                                                     CASE 
//                                                         WHEN doctype = 'Customer' THEN name
//                                                         WHEN doctype = 'Supplier' THEN name
//                                                         WHEN doctype = 'Account' THEN name
//                                                     END AS name,
//                                                     doctype
//                                                 FROM (
//                                                     SELECT name, 'Customer' AS doctype FROM \`tabCustomer\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Supplier' AS doctype FROM \`tabSupplier\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Account' AS doctype FROM \`tabAccount\` WHERE name LIKE '%${search_text}%' AND company = '${frm.doc.company}'
//                                                 ) AS combined
//                                                 ORDER BY name
//                                             `
//                                         }
//                                     };
//                                 },
//                                 onchange: function() {
//                                     let value = d.get_value('credit_account');
//                                     if (value) {
//                                         // Determine doctype and fetch details
//                                         frappe.db.get_value('Customer', value, 'name', function(c) {
//                                             if (c && c.name) {
//                                                 d.set_value('credit_doctype', 'Customer');
//                                             } else {
//                                                 frappe.db.get_value('Supplier', value, 'name', function(s) {
//                                                     if (s && s.name) {
//                                                         d.set_value('credit_doctype', 'Supplier');
//                                                     } else {
//                                                         frappe.db.get_value('Account', value, 'name', function(a) {
//                                                             if (a && a.name) {
//                                                                 d.set_value('credit_doctype', 'Account');
//                                                             } else {
//                                                                 d.set_value('credit_doctype', '');
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     } else {
//                                         d.set_value('credit_doctype', '');
//                                     }
//                                     // Refresh the field to trigger new search
//                                     d.fields_dict.credit_account.refresh();
//                                 }
//                             },
//                             {
//                                 label: 'Credit Doctype',
//                                 fieldname: 'credit_doctype',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             },
//                             {
//                                 label: 'Amount',
//                                 fieldname: 'amount',
//                                 fieldtype: 'Float',
//                                 reqd: 1
//                             }
//                         ],
//                         primary_action_label: 'Add',
//                         primary_action(values) {
//                             // Add debit row to the accounts child table
//                             let debit_row = frm.add_child('accounts');
//                             debit_row.debit_in_account_currency = values.amount;

//                             if (values.debit_doctype === 'Customer') {
//                                 debit_row.party_type = 'Customer';
//                                 debit_row.party = values.debit_account;
//                                 debit_row.account = 'Debtors - ' + company_abbr;
//                             } else if (values.debit_doctype === 'Supplier') {
//                                 debit_row.party_type = 'Supplier';
//                                 debit_row.party = values.debit_account;
//                                 debit_row.account = values.debit_account + ' Payable - ' + company_abbr;
//                             } else if (values.debit_doctype === 'Account') {
//                                 debit_row.account = values.debit_account;
//                             }

//                             // Add credit row to the accounts child table
//                             let credit_row = frm.add_child('accounts');
//                             credit_row.credit_in_account_currency = values.amount;

//                             if (values.credit_doctype === 'Customer') {
//                                 credit_row.party_type = 'Customer';
//                                 credit_row.party = values.credit_account;
//                                 credit_row.account = 'Debtors - ' + company_abbr;
//                             } else if (values.credit_doctype === 'Supplier') {
//                                 credit_row.party_type = 'Supplier';
//                                 credit_row.party = values.credit_account;
//                                 credit_row.account = values.credit_account + ' Payable - ' + company_abbr;
//                             } else if (values.credit_doctype === 'Account') {
//                                 credit_row.account = values.credit_account;
//                             }

//                             // Refresh the accounts table
//                             frm.refresh_field('accounts');

//                             // Close the dialog
//                             d.hide();

//                             // Show confirmation modal
//                             let confirm_dialog = new frappe.ui.Dialog({
//                                 title: 'Confirm Save',
//                                 fields: [
//                                     {
//                                         label: 'Do you want to save?',
//                                         fieldname: 'save_confirmation',
//                                         fieldtype: 'HTML',
//                                         options: '<p>Do you want to save the Journal Entry?</p>'
//                                     }
//                                 ],
//                                 primary_action_label: 'Yes',
//                                 primary_action() {
//                                     // Save the form
//                                     frm.save();
//                                     confirm_dialog.hide();
//                                 },
//                                 secondary_action_label: 'No',
//                                 secondary_action() {
//                                     // Close the confirmation dialog without saving
//                                     confirm_dialog.hide();
//                                 }
//                             });
//                             confirm_dialog.show();
//                         }
//                     });
//                     // Show the dialog
//                     d.show();
//                 });
//             });
//         }
//     }
// });


// // ------------

// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         // Check if the document is new
//         if (frm.doc.__islocal) {
//             // Add custom button "Quick Entry"
//             frm.add_custom_button(("Quick Entry"), function() {
//                 // Fetch company abbreviation
//                 frappe.db.get_value('Company', frm.doc.company, 'abbr').then(function(r) {
//                     let company_abbr = r.abbr || 'A'; // Fallback to 'A' if abbr not found
//                     // Create a new dialog for quick entry
//                     let quick_entry_dialog = new frappe.ui.Dialog({
//                         title: 'Quick Entry',
//                         fields: [
//                             {
//                                 fieldtype: 'Section Break',
//                                 label: 'Debit Details'
//                             },
//                             {
//                                 label: 'Debit Account',
//                                 fieldname: 'debit_account',
//                                 fieldtype: 'Link',
//                                 options: 'Account',
//                                 reqd: 1,
//                                 get_query: function() {
//                                     let search_text = quick_entry_dialog.get_value('debit_account') || '';
//                                     return {
//                                         query: "frappe.desk.search.search_link",
//                                         filters: {
//                                             doctype: ["in", ["Customer", "Supplier", "Account"]],
//                                             query: `
//                                                 SELECT 
//                                                     CASE 
//                                                         WHEN doctype = 'Customer' THEN name
//                                                         WHEN doctype = 'Supplier' THEN name
//                                                         WHEN doctype = 'Account' THEN name
//                                                     END AS name,
//                                                     doctype
//                                                 FROM (
//                                                     SELECT name, 'Customer' AS doctype FROM \`tabCustomer\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Supplier' AS doctype FROM \`tabSupplier\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Account' AS doctype FROM \`tabAccount\` WHERE name LIKE '%${search_text}%' AND company = '${frm.doc.company}'
//                                                 ) AS combined
//                                                 ORDER BY name
//                                             `
//                                         }
//                                     };
//                                 },
//                                 onchange: function() {
//                                     let value = quick_entry_dialog.get_value('debit_account');
//                                     if (value) {
//                                         // Determine doctype
//                                         frappe.db.get_value('Customer', value, 'name').then(function(c) {
//                                             if (c && c.name) {
//                                                 quick_entry_dialog.set_value('debit_doctype', 'Customer');
//                                             } else {
//                                                 frappe.db.get_value('Supplier', value, 'name').then(function(s) {
//                                                     if (s && s.name) {
//                                                         quick_entry_dialog.set_value('debit_doctype', 'Supplier');
//                                                     } else {
//                                                         frappe.db.get_value('Account', value, 'name').then(function(a) {
//                                                             if (a && a.name) {
//                                                                 quick_entry_dialog.set_value('debit_doctype', 'Account');
//                                                             } else {
//                                                                 quick_entry_dialog.set_value('debit_doctype', '');
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     } else {
//                                         quick_entry_dialog.set_value('debit_doctype', '');
//                                     }
//                                 }
//                             },
//                             {
//                                 label: 'Browse',
//                                 fieldname: 'debit_browse',
//                                 fieldtype: 'Button',
//                                 click: function() {
//                                     open_search_modal('debit_account', frm.doc.company, quick_entry_dialog);
//                                 }
//                             },
//                             {
//                                 label: 'Debit Doctype',
//                                 fieldname: 'debit_doctype',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             },
//                             {
//                                 fieldtype: 'Section Break',
//                                 label: ' transistor Details'
//                             },
//                             {
//                                 label: 'Credit Account',
//                                 fieldname: 'credit_account',
//                                 fieldtype: 'Link',
//                                 options: 'Account',
//                                 reqd: 1,
//                                 get_query: function() {
//                                     let search_text = quick_entry_dialog.get_value('credit_account') || '';
//                                     return {
//                                         query: "frappe.desk.search.search_link",
//                                         filters: {
//                                             doctype: ["in", ["Customer", "Supplier", "Account"]],
//                                             query: `
//                                                 SELECT 
//                                                     CASE 
//                                                         WHEN doctype = 'Customer' THEN name
//                                                         WHEN doctype = 'Supplier' THEN name
//                                                         WHEN doctype = 'Account' THEN name
//                                                     END AS name,
//                                                     doctype
//                                                 FROM (
//                                                     SELECT name, 'Customer' AS doctype FROM \`tabCustomer\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Supplier' AS doctype FROM \`tabSupplier\` WHERE name LIKE '%${search_text}%'
//                                                     UNION
//                                                     SELECT name, 'Account' AS doctype FROM \`tabAccount\` WHERE name LIKE '%${search_text}%' AND company = '${frm.doc.company}'
//                                                 ) AS combined
//                                                 ORDER BY name
//                                             `
//                                         }
//                                     };
//                                 },
//                                 onchange: function() {
//                                     let value = quick_entry_dialog.get_value('credit_account');
//                                     if (value) {
//                                         // Determine doctype
//                                         frappe.db.get_value('Customer', value, 'name').then(function(c) {
//                                             if (c && c.name) {
//                                                 quick_entry_dialog.set_value('credit_doctype', 'Customer');
//                                             } else {
//                                                 frappe.db.get_value('Supplier', value, 'name').then(function(s) {
//                                                     if (s && s.name) {
//                                                         quick_entry_dialog.set_value('credit_doctype', 'Supplier');
//                                                     } else {
//                                                         frappe.db.get_value('Account', value, 'name').then(function(a) {
//                                                             if (a && a.name) {
//                                                                 quick_entry_dialog.set_value('credit_doctype', 'Account');
//                                                             } else {
//                                                                 quick_entry_dialog.set_value('credit_doctype', '');
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     } else {
//                                         quick_entry_dialog.set_value('credit_doctype', '');
//                                     }
//                                 }
//                             },
//                             {
//                                 label: 'Browse',
//                                 fieldname: 'credit_browse',
//                                 fieldtype: 'Button',
//                                 click: function() {
//                                     open_search_modal('credit_account', frm.doc.company, quick_entry_dialog);
//                                 }
//                             },
//                             {
//                                 label: 'Credit Doctype',
//                                 fieldname: 'credit_doctype',
//                                 fieldtype: 'Data',
//                                 read_only: 1,
//                                 hidden: 1
//                             },
//                             {
//                                 fieldtype: 'Section Break'
//                             },
//                             {
//                                 label: 'Amount',
//                                 fieldname: 'debit',
//                                 fieldtype: 'Float',
//                                 reqd: 1
//                             }
//                         ],
//                         primary_action_label: 'Add',
//                         primary_action(values) {
//                             // Add debit row to accounts child table
//                             let debit_row = frm.add_child('accounts');
//                             debit_row.debit_in_account_currency = values.debit;

//                             if (values.debit_doctype === 'Customer') {
//                                 debit_row.party_type = 'Customer';
//                                 debit_row.party = values.debit_account;
//                                 debit_row.account = 'Debtors - ' + company_abbr;
//                             } else if (values.debit_doctype === 'Supplier') {
//                                 debit_row.party_type = 'Supplier';
//                                 debit_row.party = values.debit_account;
//                                 debit_row.account = values.debit_account + ' Payable - ' + company_abbr;
//                             } else if (values.debit_doctype === 'Account') {
//                                 debit_row.account = values.debit_account;
//                             }

//                             // Add credit row to accounts child table
//                             let credit_row = frm.add_child('accounts');
//                             credit_row.credit_in_account_currency = values.debit;

//                             if (values.credit_doctype === 'Customer') {
//                                 credit_row.party_type = 'Customer';
//                                 credit_row.party = values.credit_account;
//                                 credit_row.account = 'Debtors - ' + company_abbr;
//                             } else if (values.credit_doctype === 'Supplier') {
//                                 credit_row.party_type = 'Supplier';
//                                 credit_row.party = values.credit_account;
//                                 credit_row.account = values.credit_account + ' Payable - ' + company_abbr;
//                             } else if (values.credit_doctype === 'Account') {
//                                 credit_row.account = values.credit_account;
//                             }

//                             // Refresh accounts table
//                             frm.refresh_field('accounts');

//                             // Close quick entry dialog
//                             quick_entry_dialog.hide();

//                             // Show confirmation dialog
//                             let confirm_dialog = new frappe.ui.Dialog({
//                                 title: 'Confirm Save',
//                                 fields: [
//                                     {
//                                         label: 'Save Confirmation',
//                                         fieldname: 'save_confirmation',
//                                         fieldtype: 'HTML',
//                                         options: '<p>Do you want to save the Journal Entry?</p>'
//                                     }
//                                 ],
//                                 primary_action_label: 'Yes',
//                                 primary_action() {
//                                     frm.save();
//                                     confirm_dialog.hide();
//                                 },
//                                 secondary_action_label: 'No',
//                                 secondary_action() {
//                                     confirm_dialog.hide();
//                                 }
//                             });
//                             confirm_dialog.show();
//                         }
//                     });

//                     // Function to open search modal
//                     function open_search_modal(fieldname, company, parent_dialog) {
//                         let search_dialog = new frappe.ui.Dialog({
//                             title: `Select ${fieldname === 'debit_account' ? 'Debit' : 'Credit'} Account`,
//                             fields: [
//                                 {
//                                     label: 'Search',
//                                     fieldname: 'search_text',
//                                     fieldtype: 'Data',
//                                     onchange: function() {
//                                         let search_text = search_dialog.get_value('search_text') || '';
//                                         frappe.call({
//                                             method: 'frappe.client.get_list',
//                                             args: {
//                                                 doctype: 'Account',
//                                                 fields: ['name'],
//                                                 filters: {
//                                                     company: company,
//                                                     name: ['like', `%${search_text}%`]
//                                                 },
//                                                 limit_page_length: 10
//                                             },
//                                             callback: function(r) {
//                                                 let accounts = r.message || [];
//                                                 frappe.call({
//                                                     method: 'frappe.client.get_list',
//                                                     args: {
//                                                         doctype: 'Customer',
//                                                         fields: ['name'],
//                                                         filters: {
//                                                             name: ['like', `%${search_text}%`]
//                                                         },
//                                                         limit_page_length: 10
//                                                     },
//                                                     callback: function(c) {
//                                                         let customers = c.message || [];
//                                                         frappe.call({
//                                                             method: 'frappe.client.get_list',
//                                                             args: {
//                                                                 doctype: 'Supplier',
//                                                                 fields: ['name'],
//                                                                 filters: {
//                                                                     name: ['like', `%${search_text}%`]
//                                                                 },
//                                                                 limit_page_length: 10
//                                                             },
//                                                             callback: function(s) {
//                                                                 let suppliers = s.message || [];
//                                                                 let combined = [
//                                                                     ...accounts.map(a => ({ name: a.name, doctype: 'Account' })),
//                                                                     ...customers.map(c => ({ name: c.name, doctype: 'Customer' })),
//                                                                     ...suppliers.map(s => ({ name: s.name, doctype: 'Supplier' }))
//                                                                 ];
//                                                                 let html = combined.length ? combined.map(item => `
//                                                                     <div style="padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
//                                                                         <span>${item.name} (${item.doctype})</span>
//                                                                         <button class="btn btn-primary btn-sm" 
//                                                                                 onclick="frappe.ui.get_dialog('quick_entry_dialog').set_value('${fieldname}', '${item.name}').then(() => {
//                                                                                     frappe.ui.get_dialog('quick_entry_dialog').fields_dict['${fieldname}'].trigger('change');
//                                                                                     frappe.ui.get_dialog('search_dialog').hide();
//                                                                                 });">
//                                                                             Pick
//                                                                         </button>
//                                                                     </div>
//                                                                 `).join('') : '<p>No results found</p>';
//                                                                 search_dialog.set_value('results', html);
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     }
//                                 },
//                                 {
//                                     label: 'Results',
//                                     fieldname: 'results',
//                                     fieldtype: 'HTML',
//                                     options: '<p>Start typing to search...</p>'
//                                 }
//                             ],
//                             primary_action_label: 'Close',
//                             primary_action() {
//                                 search_dialog.hide();
//                             }
//                         });
//                         // Assign unique names to dialogs for reference
//                         quick_entry_dialog.name = 'quick_entry_dialog';
//                         search_dialog.name = 'search_dialog';
//                         search_dialog.show();
//                         // Trigger initial search
//                         search_dialog.fields_dict.search_text.trigger('change');
//                     }

//                     // Adjust layout to align Browse buttons with labels
//                     setTimeout(() => {
//                         // Move debit_browse button to the same line as Debit Account label
//                         let debit_label = $('.frappe-control[data-fieldname="debit_account"] .label-area');
//                         let debit_button = $('.frappe-control[data-fieldname="debit_browse"]');
//                         debit_button.css({'display': 'inline-block', 'margin-left': '10px'});
//                         debit_label.append(debit_button);

//                         // Move credit_browse button to the same line as Credit Account label
//                         let credit_label = $('.frappe-control[data-fieldname="credit_account"] .label-area');
//                         let credit_button = $('.frappe-control[data-fieldname="credit_browse"]');
//                         credit_button.css({'display': 'inline-block', 'margin-left': '10px'});
//                         credit_label.append(credit_button);
//                     }, 100);

//                     // Show quick entry dialog
//                     quick_entry_dialog.show();
//                 }).catch(function(err) {
//                     console.error("Failed to fetch company abbreviation:", err);
//                     frappe.msgprint({
//                         title: __NORMALIZED__('Error'),
//                         message: __NORMALIZED__('Failed to fetch company abbreviation. Please check the company settings.'),
//                         indicator: 'red'
//                     });
//                 });
//             });
//         }
//     }
// });






// // ---------old one --------

// // frappe.ui.form.on('Journal Entry', {
// //     refresh: function(frm) {
// //         // Check if the document is new
// //         if (frm.doc.__islocal) {
// //             // Add custom button "Add Accounts"
// //             frm.add_custom_button(__("Quick Entry"), function() {
// //                 // Fetch company abbreviation
// //                 frappe.db.get_value('Company', frm.doc.company, 'abbr', function(r) {
// //                     let company_abbr = r.abbr || 'A'; // Fallback to 'A' if abbr not found
// //                     // Create a new dialog (modal)
// //                     let d = new frappe.ui.Dialog({
// //                         title: 'Add Accounts',
// //                         fields: [
// //                             {
// //                                 label: 'Debit Party Type',
// //                                 fieldname: 'debit_party_type',
// //                                 fieldtype: 'Select',
// //                                 options: ['Customer', 'Supplier', 'Financer'],
// //                                 reqd: 1,
// //                                 onchange: function() {
// //                                     // Clear Debit Party Name field when Debit Party Type changes
// //                                     d.set_value('debit_party_name', '');
// //                                     // Set options for Debit Party Name based on Debit Party Type
// //                                     let debit_party_type = d.get_value('debit_party_type');
// //                                     if (debit_party_type === 'Customer') {
// //                                         d.fields_dict.debit_party_name.df.options = 'Customer';
// //                                         d.fields_dict.debit_party_name.df.filters = {};
// //                                     } else if (debit_party_type === 'Supplier') {
// //                                         d.fields_dict.debit_party_name.df.options = 'Supplier';
// //                                         d.fields_dict.debit_party_name.df.filters = {};
// //                                     } else if (debit_party_type === 'Financer') {
// //                                         d.fields_dict.debit_party_name.df.options = 'Customer';
// //                                         d.fields_dict.debit_party_name.df.filters = {'customer_group': 'Financer'};
// //                                     }
// //                                     d.fields_dict.debit_party_name.refresh();
// //                                 }
// //                             },
// //                             {
// //                                 label: 'Debit Party Name',
// //                                 fieldname: 'debit_party_name',
// //                                 fieldtype: 'Link',
// //                                 options: '',
// //                                 depends_on: 'eval:doc.debit_party_type',
// //                                 reqd: 1
// //                             },
// //                             {
// //                                 label: 'Credit Party Type',
// //                                 fieldname: 'credit_party_type',
// //                                 fieldtype: 'Select',
// //                                 options: ['Customer', 'Supplier', 'Financer'],
// //                                 reqd: 1,
// //                                 onchange: function() {
// //                                     // Clear Credit Party Name field when Credit Party Type changes
// //                                     d.set_value('credit_party_name', '');
// //                                     // Set options for Credit Party Name based on Credit Party Type
// //                                     let credit_party_type = d.get_value('credit_party_type');
// //                                     if (credit_party_type === 'Customer') {
// //                                         d.fields_dict.credit_party_name.df.options = 'Customer';
// //                                         d.fields_dict.credit_party_name.df.filters = {'customer_group': ['!=', 'Financer']};
// //                                     } else if (credit_party_type === 'Supplier') {
// //                                         d.fields_dict.credit_party_name.df.options = 'Supplier';
// //                                         d.fields_dict.credit_party_name.df.filters = {};
// //                                     } else if (credit_party_type === 'Financer') {
// //                                         d.fields_dict.credit_party_name.df.options = 'Customer';
// //                                         d.fields_dict.credit_party_name.df.filters = {'customer_group': 'Financer'};
// //                                     }
// //                                     d.fields_dict.credit_party_name.refresh();
// //                                 }
// //                             },
// //                             {
// //                                 label: 'Credit Party Name',
// //                                 fieldname: 'credit_party_name',
// //                                 fieldtype: 'Link',
// //                                 options: '',
// //                                 depends_on: 'eval:doc.credit_party_type',
// //                                 reqd: 1
// //                             },
// //                             {
// //                                 label: 'Amount',
// //                                 fieldname: 'amount',
// //                                 fieldtype: 'Float',
// //                                 reqd: 1
// //                             }
// //                         ],
// //                         primary_action_label: 'Add',
// //                         primary_action(values) {
// //                             // Add debit row to the accounts child table
// //                             let debit_row = frm.add_child('accounts');
// //                             debit_row.party_type = values.debit_party_type === 'Financer' ? 'Customer' : values.debit_party_type;
// //                             debit_row.party = values.debit_party_name;
// //                             debit_row.debit_in_account_currency = values.amount;
// //                             if (values.debit_party_type === 'Customer') {
// //                                 debit_row.account = 'Debtors - ' + company_abbr;
// //                             } else if (values.debit_party_type === 'Supplier') {
// //                                 debit_row.account = values.debit_party_name + ' Payable - ' + company_abbr;
// //                             } else if (values.debit_party_type === 'Financer') {
// //                                 debit_row.account = values.debit_party_name + ' Receivable - ' + company_abbr;
// //                             }

// //                             // Add credit row to the accounts child table
// //                             let credit_row = frm.add_child('accounts');
// //                             credit_row.party_type = values.credit_party_type === 'Financer' ? 'Customer' : values.credit_party_type;
// //                             credit_row.party = values.credit_party_name;
// //                             credit_row.credit_in_account_currency = values.amount;
// //                             if (values.credit_party_type === 'Customer') {
// //                                 credit_row.account = 'Debtors - ' + company_abbr;
// //                             } else if (values.credit_party_type === 'Supplier') {
// //                                 credit_row.account = values.credit_party_name + ' Payable - ' + company_abbr;
// //                             } else if (values.credit_party_type === 'Financer') {
// //                                 credit_row.account = values.credit_party_name + ' Receivable - ' + company_abbr;
// //                             }

// //                             // Refresh the accounts table
// //                             frm.refresh_field('accounts');

// //                             // Close the dialog
// //                             d.hide();

// //                             // Show confirmation modal
// //                             let confirm_dialog = new frappe.ui.Dialog({
// //                                 title: 'Confirm Save',
// //                                 fields: [
// //                                     {
// //                                         label: 'Do you want to save?',
// //                                         fieldname: 'save_confirmation',
// //                                         fieldtype: 'HTML',
// //                                         options: '<p>Do you want to save the Journal Entry?</p>'
// //                                     }
// //                                 ],
// //                                 primary_action_label: 'Yes',
// //                                 primary_action() {
// //                                     // Save the form
// //                                     frm.save();
// //                                     confirm_dialog.hide();
// //                                 },
// //                                 secondary_action_label: 'No',
// //                                 secondary_action() {
// //                                     // Close the confirmation dialog without saving
// //                                     confirm_dialog.hide();
// //                                 }
// //                             });
// //                             confirm_dialog.show();
// //                         }
// //                     });
// //                     // Show the dialog
// //                     d.show();
// //                 });
// //             });
// //         }
// //     }
// // });



// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         // Add custom button "Journal"
//         frm.add_custom_button(__("Journal old"), function() {
//             // Create a new dialog for displaying the lists
//             let journal_dialog = new frappe.ui.Dialog({
//                 title: 'Journal List',
//                 fields: [
//                     {
//                         fieldtype: 'Section Break',
//                         label: 'Debit Details'
//                     },
//                     {
//                         label: 'Debit Search Text',
//                         fieldname: 'debit_search_text',
//                         fieldtype: 'Data',
//                         onchange: function() {
//                             let search_text = journal_dialog.get_value('debit_search_text') || '';
//                             // Fetch and filter Accounts, Customers, and Suppliers for Debit
//                             frappe.call({
//                                 method: 'frappe.client.get_list',
//                                 args: {
//                                     doctype: 'Account',
//                                     fields: ['name'],
//                                     filters: {
//                                         company: frm.doc.company,
//                                         name: ['like', `%${search_text}%`]
//                                     },
//                                     limit_page_length: 0 // Fetch all records
//                                 },
//                                 callback: function(r) {
//                                     let accounts = r.message || [];
//                                     frappe.call({
//                                         method: 'frappe.client.get_list',
//                                         args: {
//                                             doctype: 'Customer',
//                                             fields: ['name'],
//                                             filters: {
//                                                 name: ['like', `%${search_text}%`]
//                                             },
//                                             limit_page_length: 0
//                                         },
//                                         callback: function(c) {
//                                             let customers = c.message || [];
//                                             frappe.call({
//                                                 method: 'frappe.client.get_list',
//                                                 args: {
//                                                     doctype: 'Supplier',
//                                                     fields: ['name'],
//                                                     filters: {
//                                                         name: ['like', `%${search_text}%`]
//                                                     },
//                                                     limit_page_length: 0
//                                                 },
//                                                 callback: function(s) {
//                                                     let suppliers = s.message || [];
//                                                     let combined = [
//                                                         ...accounts.map(a => ({ name: a.name, doctype: 'Account' })),
//                                                         ...customers.map(c => ({ name: c.name, doctype: 'Customer' })),
//                                                         ...suppliers.map(s => ({ name: s.name, doctype: 'Supplier' }))
//                                                     ];
//                                                     // Display the filtered list for Debit with clickable records
//                                                     let html = combined.length ? combined.map(item => `
//                                                         <div style="padding: 10px; border-bottom: 1px solid #ddd; cursor: pointer;" 
//                                                              onclick="frappe.ui.get_dialog('journal_dialog').set_value('debit_search_selected_data', '${item.name}'); 
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['debit_search_selected_data'].$wrapper.css('display', 'block');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['debit_results'].$wrapper.css('display', 'none');
//                                                                       // Add selected account to the accounts table as a debit entry
//                                                                       let row = frm.add_child('accounts');
//                                                                       row.account = '${item.name}';
//                                                                       row.debit_in_account_currency = 0; // Set default debit amount, adjust as needed
//                                                                       row.credit_in_account_currency = 0;
//                                                                       frm.refresh_field('accounts');
//                                                                       frappe.ui.get_dialog('journal_dialog').hide();">
//                                                             <span>${item.name} (${item.doctype})</span>
//                                                         </div>
//                                                     `).join('') : '<p>No results found</p>';
//                                                     journal_dialog.set_value('debit_results', html);
//                                                     // Ensure the results field is visible when search changes
//                                                     journal_dialog.fields_dict['debit_results'].$wrapper.css('display', 'block');
//                                                     // Hide selected data field initially
//                                                     journal_dialog.fields_dict['debit_search_selected_data'].$wrapper.css('display', 'none');
//                                                 }
//                                             });
//                                         }
//                                     });
//                                 }
//                             });
//                         }
//                     },
//                     {
//                         label: 'Debit Selected Data',
//                         fieldname: 'debit_search_selected_data',
//                         fieldtype: 'Data',
//                         read_only: 1,
//                         hidden: 0 // Ensure field is not hidden by default
//                     },
//                     {
//                         label: 'Debit Results',
//                         fieldname: 'debit_results',
//                         fieldtype: 'HTML',
//                         options: '<p>Start typing to search...</p>'
//                     },
//                     {
//                         fieldtype: 'Section Break',
//                         label: 'Credit Details'
//                     },
//                     {
//                         label: 'Credit Search Text',
//                         fieldname: 'credit_search_text',
//                         fieldtype: 'Data',
//                         onchange: function() {
//                             let search_text = journal_dialog.get_value('credit_search_text') || '';
//                             // Fetch and filter Accounts, Customers, and Suppliers for Credit
//                             frappe.call({
//                                 method: 'frappe.client.get_list',
//                                 args: {
//                                     doctype: 'Account',
//                                     fields: ['name'],
//                                     filters: {
//                                         company: frm.doc.company,
//                                         name: ['like', `%${search_text}%`]
//                                     },
//                                     limit_page_length: 0 // Fetch all records
//                                 },
//                                 callback: function(r) {
//                                     let accounts = r.message || [];
//                                     frappe.call({
//                                         method: 'frappe.client.get_list',
//                                         args: {
//                                             doctype: 'Customer',
//                                             fields: ['name'],
//                                             filters: {
//                                                 name: ['like', `%${search_text}%`]
//                                             },
//                                             limit_page_length: 0
//                                         },
//                                         callback: function(c) {
//                                             let customers = c.message || [];
//                                             frappe.call({
//                                                 method: 'frappe.client.get_list',
//                                                 args: {
//                                                     doctype: 'Supplier',
//                                                     fields: ['name'],
//                                                     filters: {
//                                                         name: ['like', `%${search_text}%`]
//                                                     },
//                                                     limit_page_length: 0
//                                                 },
//                                                 callback: function(s) {
//                                                     let suppliers = s.message || [];
//                                                     let combined = [
//                                                         ...accounts.map(a => ({ name: a.name, doctype: 'Account' })),
//                                                         ...customers.map(c => ({ name: c.name, doctype: 'Customer' })),
//                                                         ...suppliers.map(s => ({ name: s.name, doctype: 'Supplier' }))
//                                                     ];
//                                                     // Display the filtered list for Credit with clickable records
//                                                     let html = combined.length ? combined.map(item => `
//                                                         <div style="padding: 10px; border-bottom: 1px solid #ddd; cursor: pointer;" 
//                                                              onclick="frappe.ui.get_dialog('journal_dialog').set_value('credit_search_selected_data', '${item.name}'); 
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['credit_search_selected_data'].$wrapper.css('display', 'block');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['credit_results'].$wrapper.css('display', 'none');
//                                                                       // Add selected account to the accounts table as a credit entry
//                                                                       let row = frm.add_child('accounts');
//                                                                       row.account = '${item.name}';
//                                                                       row.credit_in_account_currency = 0; // Set default credit amount, adjust as needed
//                                                                       row.debit_in_account_currency = 0;
//                                                                       frm.refresh_field('accounts');
//                                                                       frappe.ui.get_dialog('journal_dialog').hide();">
//                                                             <span>${item.name} (${item.doctype})</span>
//                                                         </div>
//                                                     `).join('') : '<p>No results found</p>';
//                                                     journal_dialog.set_value('credit_results', html);
//                                                     // Ensure the results field is visible when search changes
//                                                     journal_dialog.fields_dict['credit_results'].$wrapper.css('display', 'block');
//                                                     // Hide selected data field initially
//                                                     journal_dialog.fields_dict['credit_search_selected_data'].$wrapper.css('display', 'none');
//                                                 }
//                                             });
//                                         }
//                                     });
//                                 }
//                             });
//                         }
//                     },
//                     {
//                         label: 'Credit Selected Data',
//                         fieldname: 'credit_search_selected_data',
//                         fieldtype: 'Data',
//                         read_only: 1,
//                         hidden: 0 // Ensure field is not hidden by default
//                     },
//                     {
//                         label: 'Credit Results',
//                         fieldname: 'credit_results',
//                         fieldtype: 'HTML',
//                         options: '<p>Start typing to search...</p>'
//                     }
//                 ],
//                 primary_action_label: 'Close',
                
//                 primary_action() {
//                     journal_dialog.hide();
//                 }
//             });

//             // Assign a name to the dialog for reference
//             journal_dialog.name = 'journal_dialog';

//             // Show the dialog
//             journal_dialog.show();

//             // Trigger initial search to display all records for both Debit and Credit
//             journal_dialog.fields_dict.debit_search_text.trigger('change');
//             journal_dialog.fields_dict.credit_search_text.trigger('change');
//         });
//     }
// });




// // -------
// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         // Add custom button "Journal"
//         frm.add_custom_button(__("Journal"), function() {
//             // Create a new dialog for displaying the lists
//             let journal_dialog = new frappe.ui.Dialog({
//                 title: 'Journal List',
//                 fields: [
//                     {
//                         fieldtype: 'Section Break',
//                         label: 'Debit Details'
//                     },
//                     {
//                         label: 'Debit Search',
//                         fieldname: 'debit_search_text',
//                         fieldtype: 'Select',
//                         options: [], // Options will be populated dynamically
//                         onchange: function() {
//                             let search_text = journal_dialog.get_value('debit_search_text') || '';
//                             // Clear selected data if search text is cleared
//                             if (!search_text.trim()) {
//                                 journal_dialog.set_value('debit_search_selected_data', '');
//                                 journal_dialog.set_value('debit_doctype', '');
//                                 journal_dialog.set_value('debit_results', '<p>Start typing to search...</p>');
//                                 journal_dialog.fields_dict['debit_results'].$wrapper.css('display', 'block');
//                                 journal_dialog.fields_dict['debit_search_selected_data'].$wrapper.css('display', 'none');
//                                 return;
//                             }

//                             // Fetch and filter Accounts, Customers, and Suppliers for Debit
//                             frappe.call({
//                                 method: 'frappe.client.get_list',
//                                 args: {
//                                     doctype: 'Account',
//                                     fields: ['name'],
//                                     filters: {
//                                         company: frm.doc.company,
//                                         name: ['like', `%${search_text}%`]
//                                     },
//                                     limit_page_length: 0 // Fetch all records
//                                 },
//                                 callback: function(r) {
//                                     let accounts = r.message || [];
//                                     frappe.call({
//                                         method: 'frappe.client.get_list',
//                                         args: {
//                                             doctype: 'Customer',
//                                             fields: ['name'],
//                                             filters: {
//                                                 name: ['like', `%${search_text}%`]
//                                             },
//                                             limit_page_length: 0
//                                         },
//                                         callback: function(c) {
//                                             let customers = c.message || [];
//                                             frappe.call({
//                                                 method: 'frappe.client.get_list',
//                                                 args: {
//                                                     doctype: 'Supplier',
//                                                     fields: ['name'],
//                                                     filters: {
//                                                         name: ['like', `%${search_text}%`]
//                                                     },
//                                                     limit_page_length: 0
//                                                 },
//                                                 callback: function(s) {
//                                                     let suppliers = s.message || [];
//                                                     let combined = [
//                                                         ...accounts.map(a => ({ name: a.name, doctype: 'Account' })),
//                                                         ...customers.map(c => ({ name: c.name, doctype: 'Customer' })),
//                                                         ...suppliers.map(s => ({ name: s.name, doctype: 'Supplier' }))
//                                                     ];

//                                                     // Update Select field options
//                                                     let options = combined.map(item => `${item.name} (${item.doctype})`);
//                                                     journal_dialog.fields_dict['debit_search_text'].set_data([''].concat(options));

//                                                     // Display the filtered list for Debit with clickable records
//                                                     let html = combined.length ? combined.map(item => `
//                                                         <div style="padding: 10px; border-bottom: 1px solid #ddd; cursor: pointer;" 
//                                                              onclick="frappe.ui.get_dialog('journal_dialog').set_value('debit_search_selected_data', '${item.name}'); 
//                                                                       frappe.ui.get_dialog('journal_dialog').set_value('debit_doctype', '${item.doctype}');
//                                                                       frappe.ui.get_dialog('journal_dialog').set_value('debit_search_text', '${item.name} (${item.doctype})');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['debit_search_selected_data'].$wrapper.css('display', 'block');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['debit_results'].$wrapper.css('display', 'none');">
//                                                             <span>${item.name} (${item.doctype})</span>
//                                                         </div>
//                                                     `).join('') : '<p>No results found</p>';
//                                                     journal_dialog.set_value('debit_results', html);
//                                                     journal_dialog.fields_dict['debit_results'].$wrapper.css('display', 'block');
//                                                     journal_dialog.fields_dict['debit_search_selected_data'].$wrapper.css('display', 'none');

//                                                     // Handle selection from dropdown
//                                                     if (search_text.includes(' (')) {
//                                                         let selected_name = search_text.split(' (')[0];
//                                                         let selected_doctype = search_text.match(/\(([^)]+)\)/)?.[1];
//                                                         if (selected_name && selected_doctype) {
//                                                             journal_dialog.set_value('debit_search_selected_data', selected_name);
//                                                             journal_dialog.set_value('debit_doctype', selected_doctype);
//                                                             journal_dialog.fields_dict['debit_search_selected_data'].$wrapper.css('display', 'block');
//                                                             journal_dialog.fields_dict['debit_results'].$wrapper.css('display', 'none');
//                                                         }
//                                                     }
//                                                 }
//                                             });
//                                         }
//                                     });
//                                 }
//                             });
//                         }
//                     },
//                     {
//                         label: 'Debit Selected Data',
//                         fieldname: 'debit_search_selected_data',
//                         fieldtype: 'Data',
//                         read_only: 1,
//                         hidden: 0
//                     },
//                     {
//                         fieldname: 'debit_doctype',
//                         fieldtype: 'Data',
//                         hidden: 1 // Hidden field to store doctype
//                     },
//                     {
//                         label: 'Debit Results',
//                         fieldname: 'debit_results',
//                         fieldtype: 'HTML',
//                         options: '<p>Start typing to search...</p>'
//                     },
//                     {
//                         fieldtype: 'Section Break',
//                         label: 'Credit Details'
//                     },
//                     {
//                         label: 'Credit Search Text',
//                         fieldname: 'credit_search_text',
//                         fieldtype: 'Data',
//                         onchange: function() {
//                             let search_text = journal_dialog.get_value('credit_search_text') || '';
//                             if (search_text.trim() === '') {
//                                 journal_dialog.set_value('credit_results', '<p>Start typing to search...</p>');
//                                 journal_dialog.fields_dict['credit_results'].$wrapper.css('display', 'block');
//                                 journal_dialog.fields_dict['credit_search_selected_data'].$wrapper.css('display', 'none');
//                                 return;
//                             }
//                             frappe.call({
//                                 method: 'frappe.client.get_list',
//                                 args: {
//                                     doctype: 'Account',
//                                     fields: ['name'],
//                                     filters: {
//                                         company: frm.doc.company,
//                                         name: ['like', `%${search_text}%`]
//                                     },
//                                     limit_page_length: 0
//                                 },
//                                 callback: function(r) {
//                                     let accounts = r.message || [];
//                                     frappe.call({
//                                         method: 'frappe.client.get_list',
//                                         args: {
//                                             doctype: 'Customer',
//                                             fields: ['name'],
//                                             filters: {
//                                                 name: ['like', `%${search_text}%`]
//                                             },
//                                             limit_page_length: 0
//                                         },
//                                         callback: function(c) {
//                                             let customers = c.message || [];
//                                             frappe.call({
//                                                 method: 'frappe.client.get_list',
//                                                 args: {
//                                                     doctype: 'Supplier',
//                                                     fields: ['name'],
//                                                     filters: {
//                                                         name: ['like', `%${search_text}%`]
//                                                     },
//                                                     limit_page_length: 0
//                                                 },
//                                                 callback: function(s) {
//                                                     let suppliers = s.message || [];
//                                                     let combined = [
//                                                         ...accounts.map(a => ({ name: a.name, doctype: 'Account' })),
//                                                         ...customers.map(c => ({ name: c.name, doctype: 'Customer' })),
//                                                         ...suppliers.map(s => ({ name: s.name, doctype: 'Supplier' }))
//                                                     ];
//                                                     let html = combined.length ? combined.map(item => `
//                                                         <div style="padding: 10px; border-bottom: 1px solid #ddd; cursor: pointer;" 
//                                                              onclick="frappe.ui.get_dialog('journal_dialog').set_value('credit_search_selected_data', '${item.name}'); 
//                                                                       frappe.ui.get_dialog('journal_dialog').set_value('credit_doctype', '${item.doctype}');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['credit_search_selected_data'].$wrapper.css('display', 'block');
//                                                                       frappe.ui.get_dialog('journal_dialog').fields_dict['credit_results'].$wrapper.css('display', 'none');
//                                                                       frappe.ui.get_dialog('journal_dialog').set_value('credit_search_text', '');
//                                                                       frappe.ui.get_dialog('journal_dialog').set_value('credit_results', '<p>Start typing to search...</p>');">
//                                                             <span>${item.name} (${item.doctype})</span>
//                                                         </div>
//                                                     `).join('') : '<p>No results found</p>';
//                                                     journal_dialog.set_value('credit_results', html);
//                                                     journal_dialog.fields_dict['credit_results'].$wrapper.css('display', 'block');
//                                                     journal_dialog.fields_dict['credit_search_selected_data'].$wrapper.css('display', 'none');
//                                                 }
//                                             });
//                                         }
//                                     });
//                                 }
//                             });
//                         }
//                     },
//                     {
//                         label: 'Credit Selected Data',
//                         fieldname: 'credit_search_selected_data',
//                         fieldtype: 'Data',
//                         read_only: 1,
//                         hidden: 0
//                     },
//                     {
//                         fieldname: 'credit_doctype',
//                         fieldtype: 'Data',
//                         hidden: 1 // Hidden field to store doctype
//                     },
//                     {
//                         label: 'Credit Results',
//                         fieldname: 'credit_results',
//                         fieldtype: 'HTML',
//                         options: '<p>Start typing to search...</p>'
//                     }
//                 ],
//                 primary_action_label: 'Update Journal',
//                 primary_action(values) {
//                     let debit_data = values.debit_search_selected_data;
//                     let debit_doctype = values.debit_doctype;
//                     let credit_data = values.credit_search_selected_data;
//                     let credit_doctype = values.credit_doctype;

//                     // Validate selections
//                     if (!debit_data || !credit_data) {
//                         frappe.msgprint(__('Please select both Debit and Credit data before updating.'));
//                         return;
//                     }

//                     // Clear existing rows in the accounts table
//                     frm.clear_table('accounts');

//                     // Add Debit row
//                     let debit_row = frm.add_child('accounts');
//                     debit_row.account = debit_data;
//                     debit_row.debit_in_account_currency = 0; // Set default, can be updated by user
//                     if (debit_doctype !== 'Account') {
//                         debit_row.party_type = debit_doctype;
//                         debit_row.party = debit_data;
//                     }

//                     // Add Credit row
//                     let credit_row = frm.add_child('accounts');
//                     credit_row.account = credit_data;
//                     credit_row.credit_in_account_currency = 0; // Set default, can be updated by user
//                     if (credit_doctype !== 'Account') {
//                         credit_row.party_type = credit_doctype;
//                         credit_row.party = credit_data;
//                     }

//                     // Refresh the accounts table
//                     frm.refresh_field('accounts');

//                     // Show success message
//                     frappe.msgprint(__('Journal Entry updated with selected Debit and Credit data.'));

//                     // Close the dialog
//                     journal_dialog.hide();
//                 },
//                 secondary_action_label: 'Clear',
//                 secondary_action() {
//                     // Clear all fields
//                     journal_dialog.set_value('debit_search_text', '');
//                     journal_dialog.set_value('debit_search_selected_data', '');
//                     journal_dialog.set_value('debit_doctype', '');
//                     journal_dialog.set_value('credit_search_text', '');
//                     journal_dialog.set_value('credit_search_selected_data', '');
//                     journal_dialog.set_value('credit_doctype', '');
//                     journal_dialog.set_value('debit_results', '<p>Start typing to search...</p>');
//                     journal_dialog.set_value('credit_results', '<p>Start typing to search...</p>');
//                     journal_dialog.fields_dict['debit_results'].$wrapper.css('display', 'block');
//                     journal_dialog.fields_dict['credit_results'].$wrapper.css('display', 'block');
//                     journal_dialog.fields_dict['debit_search_selected_data'].$wrapper.css('display', 'none');
//                     journal_dialog.fields_dict['credit_search_selected_data'].$wrapper.css('display', 'none');
//                 }
//             });

//             // Assign a name to the dialog for reference
//             journal_dialog.name = 'journal_dialog';

//             // Show the dialog
//             journal_dialog.show();
//         });
//     }
// });




// // new from chatgpt

// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         frm.add_custom_button('Select Accounts', () => {
//             frappe.prompt([
//                 {
//                     fieldname: 'debit_account_head',
//                     label: 'Debit Account Head',
//                     fieldtype: 'Link',
//                     options: 'Unified Account Entity',
//                     get_query: () => {
//                         return {
//                             query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
//                         };
//                     },
//                     reqd: 1
//                 },
//                 {
//                     fieldname: 'credit_account_head',
//                     label: 'Credit Account Head',
//                     fieldtype: 'Link',
//                     options: 'Unified Account Entity',
//                     get_query: () => {
//                         return {
//                             query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
//                         };
//                     },
//                     reqd: 1
//                 }
//             ], (values) => {
//                 let msg = `You selected:<br>
//                     <b>Debit Account:</b> ${values.debit_account_head}<br>
//                     <b>Credit Account:</b> ${values.credit_account_head}`;
//                 frappe.msgprint(msg);

//                 // Optional: You can also set these values into a custom field or log them
//                 // frm.set_value('custom_debit_account', values.debit_account_head);
//                 // frm.set_value('custom_credit_account', values.credit_account_head);
//             }, 'Select Account Heads');
//         });
//     }
// });

// new one

frappe.ui.form.on('Journal Entry', {
    refresh: function(frm) {
        frm.add_custom_button('Quick Entry', () => {
            frappe.prompt([
                {
                    fieldname: 'debit_account_head',
                    label: 'Debit Account Head',
                    fieldtype: 'Link',
                    options: 'Unified Account Entity',
                    get_query: () => ({
                        query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
                    }),
                    reqd: 1
                },
                {
                    fieldname: 'credit_account_head',
                    label: 'Credit Account Head',
                    fieldtype: 'Link',
                    options: 'Unified Account Entity',
                    get_query: () => ({
                        query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
                    }),
                    reqd: 1
                },
                {
                    fieldname: 'amount',
                    label: 'Amount',
                    fieldtype: 'Float',
                    reqd: 1
                }
            ], async (values) => {
                const company = frm.doc.company;
                const company_abbr = await frappe.db.get_value('Company', company, 'abbr').then(r => r.message.abbr || 'A');

                async function process_account(value, type) {
                    if (!value.includes(':')) return { account: value };
                    const [doctype, name] = value.split(':').map(s => s.trim());
                    if (doctype === 'Customer') {
                        return frappe.db.get_value('Customer', name, 'customer_group').then(r => {
                            const group = r.message.customer_group;
                            if (group === 'Financer') {
                                return {
                                    account: `${name} Receivable - ${company_abbr}`,
                                    party_type: 'Customer',
                                    party: name
                                };
                            } else {
                                return {
                                    account: `Debtors - ${company_abbr}`,
                                    party_type: 'Customer',
                                    party: name
                                };
                            }
                        });
                    } else if (doctype === 'Supplier') {
                        return {
                            account: `${name} Payable - ${company_abbr}`,
                            party_type: 'Supplier',
                            party: name
                        };
                    } else if (doctype === 'Serial No') {
                        return frappe.db.get_value('Serial No', name, ['custom_customer_id', 'custom_customer_name']).then(r => {
                            const customer_id = r.message.custom_customer_id;
                            return frappe.db.get_value('Customer', customer_id, 'customer_group').then(c => {
                                const group = c.message.customer_group;
                                if (group === 'Financer') {
                                    return {
                                        account: `${customer_id} Receivable - ${company_abbr}`,
                                        party_type: 'Customer',
                                        party: customer_id
                                    };
                                } else {
                                    return {
                                        account: `Debtors - ${company_abbr}`,
                                        party_type: 'Customer',
                                        party: customer_id
                                    };
                                }
                            });
                        });
                    } else {
                        return { account: name };
                    }
                }

                const debit = await process_account(values.debit_account_head, 'debit');
                const credit = await process_account(values.credit_account_head, 'credit');

                // Append Debit row
                const debit_row = frm.add_child('accounts');
                debit_row.account = debit.account;
                debit_row.debit_in_account_currency = values.amount;
                if (debit.party_type) {
                    debit_row.party_type = debit.party_type;
                    debit_row.party = debit.party;
                }

                // Append Credit row
                const credit_row = frm.add_child('accounts');
                credit_row.account = credit.account;
                credit_row.credit_in_account_currency = values.amount;
                if (credit.party_type) {
                    credit_row.party_type = credit.party_type;
                    credit_row.party = credit.party;
                }

                frm.refresh_field('accounts');

                // Confirm Save
                const confirm_dialog = new frappe.ui.Dialog({
                    title: 'Confirm Save',
                    fields: [
                        {
                            label: 'Do you want to save this Journal Entry?',
                            fieldname: 'confirmation_note',
                            fieldtype: 'HTML',
                            options: '<p>Save this Journal Entry now?</p>'
                        }
                    ],
                    primary_action_label: 'Yes',
                    primary_action: () => {
                        frm.save();
                        confirm_dialog.hide();
                    },
                    secondary_action_label: 'No',
                    secondary_action: () => {
                        confirm_dialog.hide();
                    }
                });
                confirm_dialog.show();
            }, 'Select Account Heads');
        });
    }
});

// frappe.ui.form.on('Journal Entry', {
//     refresh: function(frm) {
//         frm.add_custom_button('Quick Entry', () => {
//             frappe.prompt([
//                 {
//                     fieldname: 'debit_account_head',
//                     label: 'Debit Account Head',
//                     fieldtype: 'Link',
//                     options: 'Unified Account Entity',
//                     get_query: () => ({
//                         query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
//                     }),
//                     reqd: 1
//                 },
//                 {
//                     fieldname: 'credit_account_head',
//                     label: 'Credit Account Head',
//                     fieldtype: 'Link',
//                     options: 'Unified Account Entity',
//                     get_query: () => ({
//                         query: 'autowings_app.custom_scripts.journal_entry.get_unified_account_query'
//                     }),
//                     reqd: 1
//                 },
//                 {
//                     fieldname: 'amount',
//                     label: 'Amount',
//                     fieldtype: 'Float',
//                     reqd: 1
//                 }
//             ], async (values) => {
//                 const company = frm.doc.company;
//                 const company_abbr = await frappe.db.get_value('Company', company, 'abbr').then(r => r.message.abbr || 'A');

//                 function process_account(value, type) {
//                     if (!value.includes(':')) return { account: value };
//                     const [doctype, name] = value.split(':').map(s => s.trim());
//                     if (doctype === 'Customer') {
//                         return frappe.db.get_value('Customer', name, 'customer_group').then(r => {
//                             const group = r.message.customer_group;
//                             if (group === 'Financer') {
//                                 return {
//                                     account: `${name} Receivable - ${company_abbr}`,
//                                     party_type: 'Customer',
//                                     party: name
//                                 };
//                             } else {
//                                 return {
//                                     account: `Debtors - ${company_abbr}`,
//                                     party_type: 'Customer',
//                                     party: name
//                                 };
//                             }
//                         });
//                     } else if (doctype === 'Supplier') {
//                         return {
//                             account: `${name} Payable - ${company_abbr}`,
//                             party_type: 'Supplier',
//                             party: name
//                         };
//                     } else {
//                         return { account: name };
//                     }
//                 }

//                 const debit = await process_account(values.debit_account_head, 'debit');
//                 const credit = await process_account(values.credit_account_head, 'credit');

//                 // Append Debit row
//                 const debit_row = frm.add_child('accounts');
//                 debit_row.account = debit.account;
//                 debit_row.debit_in_account_currency = values.amount;
//                 if (debit.party_type) {
//                     debit_row.party_type = debit.party_type;
//                     debit_row.party = debit.party;
//                 }

//                 // Append Credit row
//                 const credit_row = frm.add_child('accounts');
//                 credit_row.account = credit.account;
//                 credit_row.credit_in_account_currency = values.amount;
//                 if (credit.party_type) {
//                     credit_row.party_type = credit.party_type;
//                     credit_row.party = credit.party;
//                 }

//                 frm.refresh_field('accounts');

//                 // Confirm Save
//                 const confirm_dialog = new frappe.ui.Dialog({
//                     title: 'Confirm Save',
//                     fields: [
//                         {
//                             label: 'Do you want to save this Journal Entry?',
//                             fieldname: 'confirmation_note',
//                             fieldtype: 'HTML',
//                             options: '<p>Save this Journal Entry now?</p>'
//                         }
//                     ],
//                     primary_action_label: 'Yes',
//                     primary_action: () => {
//                         frm.save();
//                         confirm_dialog.hide();
//                     },
//                     secondary_action_label: 'No',
//                     secondary_action: () => {
//                         confirm_dialog.hide();
//                     }
//                 });
//                 confirm_dialog.show();
//             }, 'Select Account Heads');
//         });
//     }
// });
