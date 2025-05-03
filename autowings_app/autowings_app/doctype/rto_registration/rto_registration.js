

// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Ensure form is fully loaded before applying read-only properties
//         if (!frm.is_new() && frm.doc.__islocal !== 1) {
//             // Preload company abbreviation
//             get_company_abbr(function(abbr) {
//                 frm.custom_company_abbr = abbr;
//             }, function(err) {
//                 console.error('Failed to preload abbreviation:', err);
//             });
//             set_read_only_fields(frm);
//             add_action_button(frm);
//         }
//     },

//     before_submit: function(frm) {
//         // Validate mandatory fields
//         if (!frm.doc.application_entry_date || !frm.doc.application_number) {
//             frappe.throw(__('Application Entry Date and Application Number are mandatory for submission.'));
//         }

//         // Prompt to update registration charge or application details
//         frappe.confirm(
//             __('Do you want to change the Registration Charge or Application Details before submitting?'),
//             function() {
//                 show_update_registration_charge_dialog(frm, true);
//             },
//             function() {
//                 submit_rto_and_journal(frm);
//             }
//         );
//         frappe.validated = false;
//     },

//     after_cancel: function(frm) {
//         // Cancel associated journal entry
//         if (frm.doc.journal_entry_id) {
//             frappe.call({
//                 method: 'frappe.client.cancel',
//                 args: {
//                     doctype: 'Journal Entry',
//                     name: frm.doc.journal_entry_id
//                 },
//                 callback: function(r) {
//                     frappe.msgprint(__('Journal Entry cancelled.'));
//                     amend_rto_registration(frm);
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error cancelling journal entry: ') + (err.message || JSON.stringify(err)));
//                 }
//             });
//         }
//     }
// });

// // Cached company abbreviation
// let cached_company_abbr = null;

// // Helper to fetch company abbreviation
// function get_company_abbr(callback, error_callback) {
//     if (cached_company_abbr) {
//         console.log('Using cached company abbreviation:', cached_company_abbr);
//         callback(cached_company_abbr);
//         return;
//     }
//     frappe.call({
//         method: 'autowings_app.custom_scripts.utils.get_company_abbr',
//         callback: function(r) {
//             if (r.message) {
//                 cached_company_abbr = r.message;
//                 console.log('Fetched company abbreviation:', cached_company_abbr);
//                 callback(cached_company_abbr);
//             } else {
//                 error_callback(new Error('No company abbreviation returned.'));
//             }
//         },
//         error: function(err) {
//             error_callback(err);
//         }
//     });
// }

// // Set fields to read-only
// function set_read_only_fields(frm) {
//     try {
//         const fields = ['registration_charge', 'application_entry_date', 'application_number', 'registration_status'];
//         fields.forEach(field => frm.set_df_property(field, 'read_only', 1));
//         frm.set_df_property('rto_activity', 'read_only', 1);
//         frm.fields_dict['rto_activity'].grid.cannot_add_rows = true;
//     } catch (err) {
//         frappe.msgprint(__('Error setting read-only fields: ') + (err.message || JSON.stringify(err)));
//     }
// }


// function add_action_button(frm) {
//     try {
//         if (frm.doc.docstatus === 0) {
//             frm.add_custom_button(__('Update Registration Charge'), function() {
//                 show_update_registration_charge_dialog(frm);
//             }, __('Action'));
//             frm.add_custom_button(__('Update Application Details'), function() {
//                 show_application_details_dialog(frm);
//             }, __('Action'));
//         }
//     } catch (err) {
//         frappe.msgprint({
//             title: __('Error'),
//             message: __('Error adding Action button: ') + (err.message || JSON.stringify(err)),
//             indicator: 'red'
//         });
//     }
// }

// // Show dialog to update registration charge
// function show_update_registration_charge_dialog(frm, is_before_submit = false) {
//     let d = new frappe.ui.Dialog({
//         title: __('Update Registration Charge'),
//         fields: [
//             {
//                 label: __('Final Registration Charge'),
//                 fieldname: 'final_registration_charge',
//                 fieldtype: 'Currency',
//                 default: frm.doc.registration_charge,
//                 reqd: 1
//             }
//         ],
//         primary_action_label: __('Save'),
//         primary_action: function(values) {
//             update_rto_and_journal(frm, values.final_registration_charge, d, is_before_submit);
//         }
//     });
//     d.show();
// }

// // Update RTO Registration and Journal Entry
// function update_rto_and_journal(frm, new_charge, dialog, is_before_submit) {
//     frappe.call({
//         method: 'frappe.client.set_value',
//         args: {
//             doctype: 'RTO Registration',
//             name: frm.doc.name,
//             fieldname: 'registration_charge',
//             value: new_charge
//         },
//         callback: function(r) {
//             frm.reload_doc(); // Reload to avoid concurrency issues
//             if (frm.doc.journal_entry_id && frm.doc.docstatus === 0) {
//                 frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//                     .then(journal => {
//                         if (journal.docstatus === 0) {
//                             update_draft_journal_entry(frm, journal, new_charge, dialog, is_before_submit);
//                         } else {
//                             frappe.msgprint(__('Journal Entry is not in Draft status.'));
//                             dialog.hide();
//                             frm.reload_doc();
//                             if (is_before_submit) {
//                                 show_application_details_dialog(frm, true);
//                             } else {
//                                 show_application_details_dialog(frm);
//                             }
//                         }
//                     })
//                     .catch(err => {
//                         frappe.msgprint(__('Error fetching journal entry: ') + (err.message || JSON.stringify(err)));
//                         dialog.hide();
//                     });
//             } else {
//                 dialog.hide();
//                 frm.reload_doc();
//                 if (is_before_submit) {
//                     show_application_details_dialog(frm, true);
//                 } else {
//                     show_application_details_dialog(frm);
//                 }
//             }
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error updating registration charge: ') + (err.message || JSON.stringify(err)));
//             dialog.hide();
//         }
//     });
// }

// // Update Draft Journal Entry
// function update_draft_journal_entry(frm, journal, new_charge, dialog, is_before_submit) {
//     if (!frm.doc.rto_office) {
//         frappe.msgprint(__('RTO Office is not set in the RTO Registration.'));
//         dialog.hide();
//         return;
//     }
//     get_company_abbr(function(company_abbr) {
//         let accounts_to_validate = [
//             `Debtors - ${company_abbr}`,
//             `${frm.doc.rto_office} Payable - ${company_abbr}`
//         ];
//         frappe.call({
//             method: 'autowings_app.custom_scripts.utils.validate_accounts',
//             args: {
//                 accounts: accounts_to_validate,
//                 company: journal.company
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     try {
//                         let accounts = journal.accounts.map(account => {
//                             let updated_account = { ...account };
//                             if (updated_account.account === `Debtors - ${company_abbr}` && updated_account.debit_in_account_currency > 0) {
//                                 updated_account.debit_in_account_currency = new_charge;
//                                 updated_account.debit = new_charge;
//                             } else if (updated_account.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && updated_account.credit_in_account_currency > 0) {
//                                 updated_account.credit_in_account_currency = new_charge;
//                                 updated_account.credit = new_charge;
//                             }
//                             return updated_account;
//                         });

//                         journal.total_debit = new_charge;
//                         journal.total_credit = new_charge;
//                         journal.total_amount = new_charge;
//                         journal.accounts = accounts;

//                         frappe.call({
//                             method: 'frappe.client.save',
//                             args: { doc: journal },
//                             callback: function(r) {
//                                 dialog.hide();
//                                 frm.reload_doc();
//                                 frappe.msgprint(__('Registration Charge and Journal Entry updated.'));
//                                 if (is_before_submit) {
//                                     show_application_details_dialog(frm, true);
//                                 } else {
//                                     show_application_details_dialog(frm);
//                                 }
//                             },
//                             error: function(err) {
//                                 frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
//                                 dialog.hide();
//                             }
//                         });
//                     } catch (err) {
//                         frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
//                         dialog.hide();
//                     }
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error validating accounts: ') + (err.message || JSON.stringify(err)));
//                 dialog.hide();
//             }
//         });
//     }, function(err) {
//         frappe.msgprint(__('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)));
//         dialog.hide();
//     });
// }

// // Show dialog to update application details
// function show_application_details_dialog(frm, is_before_submit = false) {
//     let d = new frappe.ui.Dialog({
//         title: __('Update Application Details'),
//         fields: [
//             {
//                 label: __('Application Entry Date'),
//                 fieldname: 'application_entry_date',
//                 fieldtype: 'Date',
//                 default: frm.doc.application_entry_date || frappe.datetime.now_date(),
//                 reqd: 1
//             },
//             {
//                 label: __('Application Number'),
//                 fieldname: 'application_number',
//                 fieldtype: 'Data',
//                 default: frm.doc.application_number,
//                 reqd: 1
//             }
//         ],
//         primary_action_label: is_before_submit ? __('Save and Submit') : __('Save'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'frappe.client.set_value',
//                 args: {
//                     doctype: 'RTO Registration',
//                     name: frm.doc.name,
//                     fieldname: {
//                         application_entry_date: values.application_entry_date,
//                         application_number: values.application_number,
//                         registration_status: 'Applied'
//                     }
//                 },
//                 callback: function(r) {
//                     d.hide();
//                     frm.reload_doc(); // Reload to ensure latest document state
//                     frappe.msgprint(__('Application Details updated.'));
//                     if (is_before_submit) {
//                         submit_rto_and_journal(frm); // Directly trigger submission
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error updating application details: ') + (err.message || JSON.stringify(err)));
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }

// // Submit RTO Registration and Journal Entry
// function submit_rto_and_journal(frm) {
//     try {
//         if (!frm.doc.journal_entry_id) {
//             frappe.throw(__('No Journal Entry linked to this RTO Registration.'));
//         }

//         frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//             .then(journal => {
//                 if (journal.docstatus === 0) {
//                     submit_draft_journal(frm, journal);
//                 } else if (journal.docstatus === 1) {
//                     submit_rto_registration(frm); // Journal already submitted, submit RTO Registration
//                 } else {
//                     frappe.msgprint(__('Journal Entry is not in Draft or Submitted status.'));
//                 }
//             })
//             .catch(err => {
//                 frappe.msgprint(__('Error fetching journal entry: ') + (err.message || JSON.stringify(err)));
//             });
//     } catch (err) {
//         frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
//     }
// }

// // Submit Draft Journal Entry
// function submit_draft_journal(frm, journal) {
//     if (!frm.doc.rto_office) {
//         frappe.msgprint(__('RTO Office is not set in the RTO Registration.'));
//         return;
//     }
//     get_company_abbr(function(company_abbr) {
//         let accounts_to_validate = [
//             `Debtors - ${company_abbr}`,
//             `${frm.doc.rto_office} Payable - ${company_abbr}`
//         ];
//         frappe.call({
//             method: 'autowings_app.custom_scripts.utils.validate_accounts',
//             args: {
//                 accounts: accounts_to_validate,
//                 company: journal.company
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     try {
//                         let new_charge = frm.doc.registration_charge;
//                         let accounts = journal.accounts.map(account => {
//                             let updated_account = { ...account };
//                             if (updated_account.account === `Debtors - ${company_abbr}` && updated_account.debit_in_account_currency > 0) {
//                                 updated_account.debit_in_account_currency = new_charge;
//                                 updated_account.debit = new_charge;
//                             } else if (updated_account.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && updated_account.credit_in_account_currency > 0) {
//                                 updated_account.credit_in_account_currency = new_charge;
//                                 updated_account.credit = new_charge;
//                             }
//                             return updated_account;
//                         });

//                         journal.total_debit = new_charge;
//                         journal.total_credit = new_charge;
//                         journal.total_amount = new_charge;
//                         journal.accounts = accounts;

//                         frappe.call({
//                             method: 'frappe.client.save',
//                             args: { doc: journal },
//                             callback: function(r) {
//                                 let saved_journal = r.message;
//                                 frappe.call({
//                                     method: 'frappe.client.submit',
//                                     args: { doc: saved_journal },
//                                     callback: function(r) {
//                                         frm.reload_doc(); // Reload before submitting RTO Registration
//                                         submit_rto_registration(frm);
//                                     },
//                                     error: function(err) {
//                                         frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
//                                     }
//                                 });
//                             },
//                             error: function(err) {
//                                 frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
//                             }
//                         });
//                     } catch (err) {
//                         frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
//                     }
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error validating accounts: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     }, function(err) {
//         frappe.msgprint(__('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)));
//     });
// }

// // Submit RTO Registration
// function submit_rto_registration(frm) {
//     try {
//         frappe.call({
//             method: 'autowings_app.custom_scripts.vsm_each_doc_submission.submit_rto_registration',
//             args: {
//                 rto_name: frm.doc.name
//             },
//             callback: function(r) {
//                 if (r.message && r.message.success) {
//                     frm.reload_doc(); // Reload to reflect submitted state
//                     frappe.msgprint({
//                         title: __('Submission Successful'),
//                         message: __('RTO Registration submitted successfully.'),
//                         indicator: 'green'
//                     });
//                 } else {
//                     frappe.msgprint(__('Error submitting RTO Registration: ') + (r.message.error || 'Unknown error'));
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error submitting RTO Registration: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     } catch (err) {
//         frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
//     }
// }


// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button to add RTO Activity
//         if (frm.doc.docstatus === 1) {
//             frm.add_custom_button(__('Add RTO Activity'), function() {
//                 // Validate registration_status
//                 if (!["Applied", "Registered"].includes(frm.doc.registration_status)) {
//                     frappe.msgprint({
//                         title: __('Validation Error'),
//                         message: __('Registration Status must be Applied or Registered to add RTO Activity.'),
//                         indicator: 'red'
//                     });
//                     return;
//                 }

//                 // Show dialog to add RTO Activity
//                 show_add_rto_activity_dialog(frm);
//             });
//         }
//     }
// });

// // Show dialog to add RTO Activity
// function show_add_rto_activity_dialog(frm) {
//     let d = new frappe.ui.Dialog({
//         title: __('Add RTO Activity'),
//         fields: [
//             {
//                 label: __('Item'),
//                 fieldname: 'item',
//                 fieldtype: 'Link',
//                 options: 'RTO Activity Item',
//                 reqd: 1
//             },
//             {
//                 label: __('Status'),
//                 fieldname: 'status',
//                 fieldtype: 'Link',
//                 options: 'RTO Activity Item Status',
//                 reqd: 1
//             },
//             {
//                 label: __('Date'),
//                 fieldname: 'date',
//                 fieldtype: 'Date',
//                 reqd: 1,
//                 default: frappe.datetime.now_date()
//             },
//             {
//                 label: __('User'),
//                 fieldname: 'user',
//                 fieldtype: 'Link',
//                 options: 'User',
//                 default: frappe.session.user,
//                 // read_only: 1
//             }
//         ],
//         primary_action_label: __('Add'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'autowings_app.custom_scripts.rto_activity.add_rto_activity',
//                 args: {
//                     rto_name: frm.doc.name,
//                     item: values.item,
//                     status: values.status,
//                     date: values.date,
//                     user: values.user
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.success) {
//                         d.hide();
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: r.message.message,
//                             indicator: 'green'
//                         });
//                         frm.reload_doc();
//                     } else {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: r.message.message || __('Error adding RTO Activity.'),
//                             indicator: 'red'
//                         });
//                         d.hide();
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Error adding RTO Activity: ') + (err.message || JSON.stringify(err)),
//                         indicator: 'red'
//                     });
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }
// // Amend RTO Registration and update Vehicle Sales Master
// function amend_rto_registration(frm) {
//     try {
//         frappe.call({
//             method: 'frappe.client.amend',
//             args: {
//                 doctype: 'RTO Registration',
//                 name: frm.doc.name
//             },
//             callback: function(r) {
//                 let new_rto_doc = r.message;
//                 frappe.call({
//                     method: 'frappe.client.set_value',
//                     args: {
//                         doctype: 'RTO Registration',
//                         name: new_rto_doc.name,
//                         fieldname: 'journal_entry_id',
//                         value: ''
//                     },
//                     callback: function(r) {
//                         frappe.call({
//                             method: 'frappe.client.set_value',
//                             args: {
//                                 doctype: 'Vehicle Sales Master',
//                                 name: frm.doc.vsm_id,
//                                 fieldname: 'rto_registration_id',
//                                 value: new_rto_doc.name
//                             },
//                             callback: function(r) {
//                                 frappe.msgprint(__('RTO Registration amended and Vehicle Sales Master updated.'));
//                                 frappe.set_route('Form', 'RTO Registration', new_rto_doc.name);
//                             },
//                             error: function(err) {
//                                 frappe.msgprint(__('Error updating Vehicle Sales Master: ') + (err.message || JSON.stringify(err)));
//                             }
//                         });
//                     },
//                     error: function(err) {
//                         frappe.msgprint(__('Error updating journal_entry_id in amended RTO Registration: ') + (err.message || JSON.stringify(err)));
//                     }
//                 });
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error amending RTO Registration: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     } catch (err) {
//         frappe.msgprint(__('Error in amend process: ') + (err.message || JSON.stringify(err)));
//     }
// }

// //add registration number
// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button to update Registration Number
//         if (frm.doc.docstatus === 1) {
//             // Determine button label based on registration_number
//             const button_label = frm.doc.registration_number ? __('Registration Updated') : __('Update Registration Number');
            
//             frm.add_custom_button(button_label, function() {
//                 // Validate application_number and application_entry_date
//                 if (!frm.doc.application_number || !frm.doc.application_entry_date) {
//                     frappe.msgprint({
//                         title: __('Validation Error'),
//                         message: __('Both Application Number and Application Entry Date are required to update Registration Number.'),
//                         indicator: 'red'
//                     });
//                     return;
//                 }

//                 // If registration_number exists, show confirmation dialog
//                 if (frm.doc.registration_number) {
//                     frappe.confirm(
//                         __('Do you still want to change the registration number?'),
//                         function() {
//                             // User clicked Yes, show the dialog
//                             show_add_registration_number_dialog(frm);
//                         },
//                         function() {
//                             // User clicked No, do nothing
//                         }
//                     );
//                 } else {
//                     // No existing registration_number, show dialog directly
//                     show_add_registration_number_dialog(frm);
//                 }
//             });
//         }
//     }
// });

// // Show dialog to add Registration Number
// function show_add_registration_number_dialog(frm) {
//     let d = new frappe.ui.Dialog({
//         title: __('Update Registration Number'),
//         fields: [
//             {
//                 label: __('Registration Number'),
//                 fieldname: 'registration_number',
//                 fieldtype: 'Data',
//                 reqd: 1,
//                 default: frm.doc.registration_number || ''
//             }
//         ],
//         primary_action_label: __('Save'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'autowings_app.custom_scripts.rto_registration.update_registration_number',
//                 args: {
//                     rto_name: frm.doc.name,
//                     registration_number: values.registration_number
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.success) {
//                         d.hide();
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: r.message.message,
//                             indicator: 'green'
//                         });
//                         frm.reload_doc();
//                     } else {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: r.message.message || __('Error updating Registration Number.'),
//                             indicator: 'red'
//                         });
//                         d.hide();
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Error updating Registration Number: ') + (err.message || JSON.stringify(err)),
//                         indicator: 'red'
//                     });
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }

// --------------------------------------------------------------------#####---------------------

// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Ensure form is fully loaded before applying read-only properties
//         if (!frm.is_new() && frm.doc.__islocal !== 1) {
//             // Preload company abbreviation
//             get_company_abbr(function(abbr) {
//                 frm.custom_company_abbr = abbr;
//             }, function(err) {
//                 console.error('Failed to preload abbreviation:', err);
//             });
//             set_read_only_fields(frm);
//             add_action_button(frm);
//         }
//     },

//     before_submit: function(frm) {
//         // Validate mandatory fields
//         if (!frm.doc.application_entry_date || !frm.doc.application_number) {
//             frappe.throw(__('Application Entry Date and Application Number are mandatory for submission.'));
//         }

//         // Prompt to update registration charge or application details
//         frappe.confirm(
//             __('Do you want to change the Registration Charge or Application Details before submitting?'),
//             function() {
//                 show_update_registration_charge_dialog(frm, true);
//             },
//             function() {
//                 submit_rto_and_journal(frm);
//             }
//         );
//         frappe.validated = false;
//     },

//     after_cancel: function(frm) {
//         // Cancel associated journal entry
//         if (frm.doc.journal_entry_id) {
//             frappe.call({
//                 method: 'frappe.client.cancel',
//                 args: {
//                     doctype: 'Journal Entry',
//                     name: frm.doc.journal_entry_id
//                 },
//                 callback: function(r) {
//                     frappe.msgprint(__('Journal Entry cancelled.'));
//                     amend_rto_registration(frm);
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error cancelling journal entry: ') + (err.message || JSON.stringify(err)));
//                 }
//             });
//         }
//     }
// });

// // Cached company abbreviation
// let cached_company_abbr = null;

// // Helper to fetch company abbreviation
// function get_company_abbr(callback, error_callback) {
//     if (cached_company_abbr) {
//         console.log('Using cached company abbreviation:', cached_company_abbr);
//         callback(cached_company_abbr);
//         return;
//     }
//     frappe.call({
//         method: 'autowings_app.custom_scripts.utils.get_company_abbr',
//         callback: function(r) {
//             if (r.message) {
//                 cached_company_abbr = r.message;
//                 console.log('Fetched company abbreviation:', cached_company_abbr);
//                 callback(cached_company_abbr);
//             } else {
//                 error_callback(new Error('No company abbreviation returned.'));
//             }
//         },
//         error: function(err) {
//             error_callback(err);
//         }
//     });
// }

// // Set fields to read-only
// function set_read_only_fields(frm) {
//     try {
//         const fields = ['registration_charge', 'application_entry_date', 'application_number', 'registration_status'];
//         if (frm.doc.journal_status === 'Submitted') {
//             fields.forEach(field => frm.set_df_property(field, 'read_only', 1));
//             frm.fields_dict['additional_accounts'].grid.update_docfield_property('amount', 'read_only', 1);
//         } else {
//             fields.forEach(field => frm.set_df_property(field, 'read_only', 1));
//             frm.set_df_property('rto_activity', 'read_only', 1);
//             frm.fields_dict['rto_activity'].grid.cannot_add_rows = true;
//         }
//     } catch (err) {
//         frappe.msgprint(__('Error setting read-only fields: ') + (err.message || JSON.stringify(err)));
//     }
// }

// function add_action_button(frm) {
//     try {
//         if (frm.doc.docstatus === 0) {
//             if (frm.doc.journal_status !== 'Submitted') {
//                 frm.add_custom_button(__('Update Registration Charge'), function() {
//                     show_update_registration_charge_dialog(frm);
//                 }, __('Action'));
//                 frm.add_custom_button(__('Update Application Details'), function() {
//                     show_application_details_dialog(frm);
//                 }, __('Action'));
//                 frm.add_custom_button(__('Submit Journals'), function() {
//                     submit_all_journal_entries(frm, frm.doc.additional_accounts || [], true);
//                 }, __('Action'));
//             }
//         }
//         if (frm.doc.docstatus === 1) {
//             // Add custom button to add RTO Activity
//             frm.add_custom_button(__('Add RTO Activity'), function() {
//                 if (!["Applied", "Registered"].includes(frm.doc.registration_status)) {
//                     frappe.msgprint({
//                         title: __('Validation Error'),
//                         message: __('Registration Status must be Applied or Registered to add RTO Activity.'),
//                         indicator: 'red'
//                     });
//                     return;
//                 }
//                 show_add_rto_activity_dialog(frm);
//             });

//             // Add custom button to update Registration Number
//             const button_label = frm.doc.registration_number ? __('Registration Updated') : __('Update Registration Number');
//             frm.add_custom_button(button_label, function() {
//                 if (!frm.doc.application_number || !frm.doc.application_entry_date) {
//                     frappe.msgprint({
//                         title: __('Validation Error'),
//                         message: __('Both Application Number and Application Entry Date are required to update Registration Number.'),
//                         indicator: 'red'
//                     });
//                     return;
//                 }
//                 if (frm.doc.registration_number) {
//                     frappe.confirm(
//                         __('Do you still want to change the registration number?'),
//                         function() {
//                             show_add_registration_number_dialog(frm);
//                         },
//                         function() {
//                         }
//                     );
//                 } else {
//                     show_add_registration_number_dialog(frm);
//                 }
//             });
//         }
//     } catch (err) {
//         frappe.msgprint({
//             title: __('Error'),
//             message: __('Error adding Action button: ') + (err.message || JSON.stringify(err)),
//             indicator: 'red'
//         });
//     }
// }

// // Show dialog to update registration charge and additional accounts
// function show_update_registration_charge_dialog(frm, is_before_submit = false) {
//     if (frm.doc.journal_status === 'Submitted') {
//         frappe.msgprint({
//             title: __('Cannot Update'),
//             message: __('Journals are already submitted. To change amounts, cancel the journals, amend the RTO Registration, and create a new one to avoid duplication.'),
//             indicator: 'red'
//         });
//         return;
//     }

//     let fields = [
//         {
//             label: __('Final Registration Charge'),
//             fieldname: 'final_registration_charge',
//             fieldtype: 'Currency',
//             default: frm.doc.registration_charge,
//             reqd: 1
//         }
//     ];

//     // Dynamically add fields for each additional account
//     if (frm.doc.additional_accounts && frm.doc.additional_accounts.length > 0) {
//         frm.doc.additional_accounts.forEach((account, index) => {
//             if (account.account) {
//                 fields.push({
//                     label: `${account.account} Amount`,
//                     fieldname: `additional_account_${index}_amount`,
//                     fieldtype: 'Currency',
//                     default: account.amount || 0,
//                     reqd: 1
//                 });
//             }
//         });
//     }

//     // Add checkbox for journal submission
//     fields.push({
//         label: __('Submit Journals'),
//         fieldname: 'submit_journals',
//         fieldtype: 'Check',
//         default: 0
//     });

//     let d = new frappe.ui.Dialog({
//         title: __('Update Registration Charge'),
//         fields: fields,
//         primary_action_label: __('Save'),
//         primary_action: function(values) {
//             // Prepare updated additional accounts without changing journal_entry_id
//             let updated_additional_accounts = [];
//             if (frm.doc.additional_accounts && frm.doc.additional_accounts.length > 0) {
//                 updated_additional_accounts = frm.doc.additional_accounts.map((account, index) => {
//                     return {
//                         account: account.account,
//                         amount: values[`additional_account_${index}_amount`],
//                         journal_entry_id: account.journal_entry_id, // Preserve existing journal_entry_id
//                         status: account.status || 'Draft'
//                     };
//                 });
//             }

//             update_rto_and_journal(frm, values.final_registration_charge, updated_additional_accounts, values.submit_journals, d, is_before_submit);
//         }
//     });
//     d.show();
// }

// // Update RTO Registration and Journal Entry
// function update_rto_and_journal(frm, new_charge, updated_additional_accounts, submit_journals, dialog, is_before_submit) {
//     frappe.call({
//         method: 'frappe.client.set_value',
//         args: {
//             doctype: 'RTO Registration',
//             name: frm.doc.name,
//             fieldname: {
//                 registration_charge: new_charge,
//                 additional_accounts: updated_additional_accounts
//             }
//         },
//         callback: function(r) {
//             frm.reload_doc();
//             if (frm.doc.journal_entry_id && frm.doc.docstatus === 0) {
//                 update_all_journal_entries(frm, new_charge, updated_additional_accounts, submit_journals, dialog, is_before_submit);
//             } else {
//                 dialog.hide();
//                 frm.reload_doc();
//                 if (is_before_submit) {
//                     show_application_details_dialog(frm, true);
//                 } else {
//                     show_application_details_dialog(frm);
//                 }
//             }
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error updating registration charge: ') + (err.message || JSON.stringify(err)));
//             dialog.hide();
//         }
//     });
// }

// // Update all journal entries (main and additional accounts)
// function update_all_journal_entries(frm, new_charge, updated_additional_accounts, submit_journals, dialog, is_before_submit) {
//     if (!frm.doc.rto_office) {
//         frappe.msgprint(__('RTO Office is not set in the RTO Registration.'));
//         dialog.hide();
//         return;
//     }

//     get_company_abbr(function(company_abbr) {
//         // Validate all accounts involved
//         let accounts_to_validate = [
//             `Debtors - ${company_abbr}`,
//             `${frm.doc.rto_office} Payable - ${company_abbr}`
//         ].concat(updated_additional_accounts.map(acc => `${acc.account} Payable - ${company_abbr}`));

//         frappe.call({
//             method: 'autowings_app.custom_scripts.utils.validate_accounts',
//             args: {
//                 accounts: accounts_to_validate,
//                 company: frm.doc.company || 'Autowings' // Adjust based on your setup
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     // Step 1: Update the main journal entry for registration_charge
//                     frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//                         .then(main_journal => {
//                             if (main_journal.docstatus !== 0) {
//                                 frappe.msgprint(__('Main Journal Entry is not in Draft status.'));
//                                 dialog.hide();
//                                 return;
//                             }

//                             update_main_journal_entry(frm, main_journal, new_charge, company_abbr);

//                             // Step 2: Update each additional account's journal entry
//                             let journal_promises = updated_additional_accounts.map(addAcc => {
//                                 if (!addAcc.journal_entry_id) {
//                                     return Promise.resolve(); // Skip if no journal entry
//                                 }
//                                 return frappe.db.get_doc('Journal Entry', addAcc.journal_entry_id)
//                                     .then(add_journal => {
//                                         if (add_journal.docstatus !== 0) {
//                                             frappe.msgprint(__(`Journal Entry ${addAcc.journal_entry_id} for ${addAcc.account} is not in Draft status.`));
//                                             return;
//                                         }
//                                         update_additional_journal_entry(frm, add_journal, addAcc, company_abbr);
//                                         return frappe.call({
//                                             method: 'frappe.client.save',
//                                             args: { doc: add_journal }
//                                         });
//                                     })
//                                     .catch(err => {
//                                         frappe.msgprint(__('Error fetching journal entry ') + addAcc.journal_entry_id + ': ' + (err.message || JSON.stringify(err)));
//                                     });
//                             });

//                             // Step 3: Save the main journal entry and wait for additional journals
//                             Promise.all([
//                                 frappe.call({
//                                     method: 'frappe.client.save',
//                                     args: { doc: main_journal }
//                                 }),
//                                 ...journal_promises
//                             ])
//                             .then(() => {
//                                 dialog.hide();
//                                 frm.reload_doc();
//                                 frappe.msgprint(__('Registration Charge and Journal Entries updated.'));

//                                 // Submit journals if checkbox is checked
//                                 if (submit_journals) {
//                                     submit_all_journal_entries(frm, updated_additional_accounts, true);
//                                 } else {
//                                     if (is_before_submit) {
//                                         show_application_details_dialog(frm, true);
//                                     } else {
//                                         show_application_details_dialog(frm);
//                                     }
//                                 }
//                             })
//                             .catch(err => {
//                                 frappe.msgprint(__('Error updating journal entries: ') + (err.message || JSON.stringify(err)));
//                                 dialog.hide();
//                             });
//                         })
//                         .catch(err => {
//                             frappe.msgprint(__('Error fetching main journal entry: ') + (err.message || JSON.stringify(err)));
//                             dialog.hide();
//                         });
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error validating accounts: ') + (err.message || JSON.stringify(err)));
//                 dialog.hide();
//             }
//         });
//     }, function(err) {
//         frappe.msgprint(__('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)));
//         dialog.hide();
//     });
// }

// // Update the main journal entry for registration_charge
// function update_main_journal_entry(frm, journal, new_charge, company_abbr) {
//     let debtorAccount = journal.accounts.find(acc => 
//         acc.account === `Debtors - ${company_abbr}` && 
//         acc.debit_in_account_currency > 0 &&
//         acc.against_account.includes(frm.doc.rto_office)
//     );
//     let payableAccount = journal.accounts.find(acc => 
//         acc.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && 
//         acc.credit_in_account_currency > 0
//     );

//     if (debtorAccount && payableAccount) {
//         debtorAccount.debit_in_account_currency = new_charge;
//         debtorAccount.debit = new_charge;
//         payableAccount.credit_in_account_currency = new_charge;
//         payableAccount.credit = new_charge;
//     } else {
//         // If not found, add new entries (though this shouldn't happen if journal exists)
//         journal.accounts = [
//             {
//                 account: `Debtors - ${company_abbr}`,
//                 party_type: 'Customer',
//                 party: frm.doc.customer,
//                 debit_in_account_currency: new_charge,
//                 debit: new_charge,
//                 credit_in_account_currency: 0,
//                 credit: 0,
//                 cost_center: `Main - ${company_abbr}`,
//                 against_account: frm.doc.rto_office
//             },
//             {
//                 account: `${frm.doc.rto_office} Payable - ${company_abbr}`,
//                 party_type: 'Supplier',
//                 party: frm.doc.rto_office,
//                 debit_in_account_currency: 0,
//                 debit: 0,
//                 credit_in_account_currency: new_charge,
//                 credit: new_charge,
//                 cost_center: `Main - ${company_abbr}`,
//                 against_account: frm.doc.customer
//             }
//         ];
//     }

//     journal.total_debit = new_charge;
//     journal.total_credit = new_charge;
//     journal.total_amount = new_charge;
// }

// // Update an additional account's journal entry
// function update_additional_journal_entry(frm, journal, addAcc, company_abbr) {
//     let debtorAccount = journal.accounts.find(acc => 
//         acc.account === `Debtors - ${company_abbr}` && 
//         acc.debit_in_account_currency > 0 &&
//         acc.against_account === addAcc.account
//     );
//     let payableAccount = journal.accounts.find(acc => 
//         acc.account === `${addAcc.account} Payable - ${company_abbr}` && 
//         acc.credit_in_account_currency > 0
//     );

//     if (debtorAccount && payableAccount) {
//         debtorAccount.debit_in_account_currency = addAcc.amount;
//         debtorAccount.debit = addAcc.amount;
//         payableAccount.credit_in_account_currency = addAcc.amount;
//         payableAccount.credit = addAcc.amount;
//     } else {
//         // If not found, add new entries (though this shouldn't happen if journal exists)
//         journal.accounts = [
//             {
//                 account: `Debtors - ${company_abbr}`,
//                 party_type: 'Customer',
//                 party: frm.doc.customer,
//                 debit_in_account_currency: addAcc.amount,
//                 debit: addAcc.amount,
//                 credit_in_account_currency: 0,
//                 credit: 0,
//                 cost_center: `Main - ${company_abbr}`,
//                 against_account: addAcc.account
//             },
//             {
//                 account: `${addAcc.account} Payable - ${company_abbr}`,
//                 party_type: 'Supplier',
//                 party: addAcc.account,
//                 debit_in_account_currency: 0,
//                 debit: 0,
//                 credit_in_account_currency: addAcc.amount,
//                 credit: addAcc.amount,
//                 cost_center: `Main - ${company_abbr}`,
//                 against_account: frm.doc.customer
//             }
//         ];
//     }

//     journal.total_debit = addAcc.amount;
//     journal.total_credit = addAcc.amount;
//     journal.total_amount = addAcc.amount;
// }

// // Submit all journal entries
// function submit_all_journal_entries(frm, updated_additional_accounts, update_status = false) {
//     let journal_ids = [frm.doc.journal_entry_id].concat(
//         updated_additional_accounts
//             .filter(acc => acc.journal_entry_id)
//             .map(acc => acc.journal_entry_id)
//     );

//     let submit_promises = journal_ids.map(journal_id => {
//         return frappe.db.get_doc('Journal Entry', journal_id)
//             .then(journal => {
//                 if (journal.docstatus !== 0) {
//                     return Promise.resolve();
//                 }
//                 return frappe.call({
//                     method: 'frappe.client.submit',
//                     args: { doc: journal }
//                 });
//             })
//             .catch(err => {
//                 frappe.msgprint(__('Error submitting journal entry ') + journal_id + ': ' + (err.message || JSON.stringify(err)));
//             });
//     });

//     Promise.all(submit_promises)
//         .then(() => {
//             if (update_status) {
//                 let updated_data = {
//                     journal_status: 'Submitted',
//                     additional_accounts: updated_additional_accounts.map(acc => ({
//                         ...acc,
//                         status: 'Submitted'
//                     }))
//                 };
//                 frappe.call({
//                     method: 'frappe.client.set_value',
//                     args: {
//                         doctype: 'RTO Registration',
//                         name: frm.doc.name,
//                         fieldname: updated_data
//                     },
//                     callback: function(r) {
//                         frm.reload_doc();
//                         // Remove submit button after submission
//                         frm.remove_custom_button('Submit Journals');
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: __('All Journal Entries submitted and status updated.'),
//                             indicator: 'green'
//                         });
//                     },
//                     error: function(err) {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: __('Error updating status: ') + (err.message || JSON.stringify(err)),
//                             indicator: 'red'
//                         });
//                     }
//                 });
//             } else {
//                 frm.reload_doc();
//                 frappe.msgprint({
//                     title: __('Success'),
//                     message: __('All Journal Entries submitted.'),
//                     indicator: 'green'
//                 });
//             }
//         })
//         .catch(err => {
//             frappe.msgprint({
//                 title: __('Error'),
//                 message: __('Error submitting journal entries: ') + (err.message || JSON.stringify(err)),
//                 indicator: 'red'
//             });
//         });
// }

// // Show dialog to update application details
// function show_application_details_dialog(frm, is_before_submit = false) {
//     let d = new frappe.ui.Dialog({
//         title: __('Update Application Details'),
//         fields: [
//             {
//                 label: __('Application Entry Date'),
//                 fieldname: 'application_entry_date',
//                 fieldtype: 'Date',
//                 default: frm.doc.application_entry_date || frappe.datetime.now_date(),
//                 reqd: 1
//             },
//             {
//                 label: __('Application Number'),
//                 fieldname: 'application_number',
//                 fieldtype: 'Data',
//                 default: frm.doc.application_number,
//                 reqd: 1
//             }
//         ],
//         primary_action_label: is_before_submit ? __('Save and Submit') : __('Save'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'frappe.client.set_value',
//                 args: {
//                     doctype: 'RTO Registration',
//                     name: frm.doc.name,
//                     fieldname: {
//                         application_entry_date: values.application_entry_date,
//                         application_number: values.application_number,
//                         registration_status: 'Applied'
//                     }
//                 },
//                 callback: function(r) {
//                     d.hide();
//                     frm.reload_doc();
//                     frappe.msgprint(__('Application Details updated.'));
//                     if (is_before_submit) {
//                         submit_rto_and_journal(frm);
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error updating application details: ') + (err.message || JSON.stringify(err)));
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }

// // Submit RTO Registration and Journal Entry
// function submit_rto_and_journal(frm) {
//     try {
//         if (!frm.doc.application_entry_date || !frm.doc.application_number) {
//             frappe.throw(__('Application Entry Date and Application Number are mandatory before submission.'));
//         }
//         if (!frm.doc.journal_entry_id) {
//             frappe.throw(__('No Journal Entry linked to this RTO Registration.'));
//         }

//         frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//             .then(journal => {
//                 if (journal.docstatus === 0) {
//                     submit_draft_journal(frm, journal);
//                 } else if (journal.docstatus === 1) {
//                     submit_rto_registration(frm);
//                 } else {
//                     frappe.msgprint(__('Journal Entry is not in Draft or Submitted status.'));
//                 }
//             })
//             .catch(err => {
//                 frappe.msgprint(__('Error fetching journal entry: ') + (err.message || JSON.stringify(err)));
//             });
//     } catch (err) {
//         frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
//     }
// }

// // Submit Draft Journal Entry
// function submit_draft_journal(frm, journal) {
//     if (!frm.doc.rto_office) {
//         frappe.msgprint(__('RTO Office is not set in the RTO Registration.'));
//         return;
//     }
//     get_company_abbr(function(company_abbr) {
//         let accounts_to_validate = [
//             `Debtors - ${company_abbr}`,
//             `${frm.doc.rto_office} Payable - ${company_abbr}`
//         ];
//         frappe.call({
//             method: 'autowings_app.custom_scripts.utils.validate_accounts',
//             args: {
//                 accounts: accounts_to_validate,
//                 company: journal.company
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     try {
//                         let new_charge = frm.doc.registration_charge;
//                         let accounts = journal.accounts.map(account => {
//                             let updated_account = { ...account };
//                             if (updated_account.account === `Debtors - ${company_abbr}` && updated_account.debit_in_account_currency > 0) {
//                                 updated_account.debit_in_account_currency = new_charge;
//                                 updated_account.debit = new_charge;
//                             } else if (updated_account.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && updated_account.credit_in_account_currency > 0) {
//                                 updated_account.credit_in_account_currency = new_charge;
//                                 updated_account.credit = new_charge;
//                             }
//                             return updated_account;
//                         });

//                         journal.total_debit = new_charge;
//                         journal.total_credit = new_charge;
//                         journal.total_amount = new_charge;
//                         journal.accounts = accounts;

//                         frappe.call({
//                             method: 'frappe.client.save',
//                             args: { doc: journal },
//                             callback: function(r) {
//                                 let saved_journal = r.message;
//                                 frappe.call({
//                                     method: 'frappe.client.submit',
//                                     args: { doc: saved_journal },
//                                     callback: function(r) {
//                                         frm.reload_doc();
//                                         submit_rto_registration(frm);
//                                     },
//                                     error: function(err) {
//                                         frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
//                                     }
//                                 });
//                             },
//                             error: function(err) {
//                                 frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
//                             }
//                         });
//                     } catch (err) {
//                         frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
//                     }
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error validating accounts: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     }, function(err) {
//         frappe.msgprint(__('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)));
//     });
// }

// // Submit RTO Registration
// function submit_rto_registration(frm) {
//     try {
//         frappe.call({
//             method: 'autowings_app.custom_scripts.vsm_each_doc_submission.submit_rto_registration',
//             args: {
//                 rto_name: frm.doc.name
//             },
//             callback: function(r) {
//                 if (r.message && r.message.success) {
//                     frm.reload_doc();
//                     frappe.msgprint({
//                         title: __('Submission Successful'),
//                         message: __('RTO Registration submitted successfully.'),
//                         indicator: 'green'
//                     });
//                 } else {
//                     frappe.msgprint(__('Error submitting RTO Registration: ') + (r.message.error || 'Unknown error'));
//                 }
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error submitting RTO Registration: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     } catch (err) {
//         frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
//     }
// }

// // Show dialog to add RTO Activity
// function show_add_rto_activity_dialog(frm) {
//     let d = new frappe.ui.Dialog({
//         title: __('Add RTO Activity'),
//         fields: [
//             {
//                 label: __('Item'),
//                 fieldname: 'item',
//                 fieldtype: 'Link',
//                 options: 'RTO Activity Item',
//                 reqd: 1
//             },
//             {
//                 label: __('Status'),
//                 fieldname: 'status',
//                 fieldtype: 'Link',
//                 options: 'RTO Activity Item Status',
//                 reqd: 1
//             },
//             {
//                 label: __('Date'),
//                 fieldname: 'date',
//                 fieldtype: 'Date',
//                 reqd: 1,
//                 default: frappe.datetime.now_date()
//             },
//             {
//                 label: __('User'),
//                 fieldname: 'user',
//                 fieldtype: 'Link',
//                 options: 'User',
//                 default: frappe.session.user
//             }
//         ],
//         primary_action_label: __('Add'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'autowings_app.custom_scripts.rto_activity.add_rto_activity',
//                 args: {
//                     rto_name: frm.doc.name,
//                     item: values.item,
//                     status: values.status,
//                     date: values.date,
//                     user: values.user
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.success) {
//                         d.hide();
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: r.message.message,
//                             indicator: 'green'
//                         });
//                         frm.reload_doc();
//                     } else {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: r.message.message || __('Error adding RTO Activity.'),
//                             indicator: 'red'
//                         });
//                         d.hide();
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Error adding RTO Activity: ') + (err.message || JSON.stringify(err)),
//                         indicator: 'red'
//                     });
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }

// // Amend RTO Registration and update Vehicle Sales Master
// function amend_rto_registration(frm) {
//     try {
//         frappe.call({
//             method: 'frappe.client.amend',
//             args: {
//                 doctype: 'RTO Registration',
//                 name: frm.doc.name
//             },
//             callback: function(r) {
//                 let new_rto_doc = r.message;
//                 frappe.call({
//                     method: 'frappe.client.set_value',
//                     args: {
//                         doctype: 'RTO Registration',
//                         name: new_rto_doc.name,
//                         fieldname: {
//                             journal_entry_id: '',
//                             journal_status: 'Draft',
//                             additional_accounts: new_rto_doc.additional_accounts.map(acc => ({
//                                 ...acc,
//                                 journal_entry_id: '',
//                                 status: 'Draft'
//                             }))
//                         }
//                     },
//                     callback: function(r) {
//                         frappe.call({
//                             method: 'frappe.client.set_value',
//                             args: {
//                                 doctype: 'Vehicle Sales Master',
//                                 name: frm.doc.vsm_id,
//                                 fieldname: 'rto_registration_id',
//                                 value: new_rto_doc.name
//                             },
//                             callback: function(r) {
//                                 frappe.msgprint(__('RTO Registration amended and Vehicle Sales Master updated with new IDs.'));
//                                 frappe.set_route('Form', 'RTO Registration', new_rto_doc.name);
//                             },
//                             error: function(err) {
//                                 frappe.msgprint(__('Error updating Vehicle Sales Master: ') + (err.message || JSON.stringify(err)));
//                             }
//                         });
//                     },
//                     error: function(err) {
//                         frappe.msgprint(__('Error updating journal_entry_id in amended RTO Registration: ') + (err.message || JSON.stringify(err)));
//                     }
//                 });
//             },
//             error: function(err) {
//                 frappe.msgprint(__('Error amending RTO Registration: ') + (err.message || JSON.stringify(err)));
//             }
//         });
//     } catch (err) {
//         frappe.msgprint(__('Error in amend process: ') + (err.message || JSON.stringify(err)));
//     }
// }

// // Show dialog to add Registration Number
// function show_add_registration_number_dialog(frm) {
//     let d = new frappe.ui.Dialog({
//         title: __('Update Registration Number'),
//         fields: [
//             {
//                 label: __('Registration Number'),
//                 fieldname: 'registration_number',
//                 fieldtype: 'Data',
//                 reqd: 1,
//                 default: frm.doc.registration_number || ''
//             }
//         ],
//         primary_action_label: __('Save'),
//         primary_action: function(values) {
//             frappe.call({
//                 method: 'autowings_app.custom_scripts.rto_registration.update_registration_number',
//                 args: {
//                     rto_name: frm.doc.name,
//                     registration_number: values.registration_number
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.success) {
//                         d.hide();
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: r.message.message,
//                             indicator: 'green'
//                         });
//                         frm.reload_doc();
//                     } else {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: r.message.message || __('Error updating Registration Number.'),
//                             indicator: 'red'
//                         });
//                         d.hide();
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Error updating Registration Number: ') + (err.message || JSON.stringify(err)),
//                         indicator: 'red'
//                     });
//                     d.hide();
//                 }
//             });
//         }
//     });
//     d.show();
// }


// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button for submitting journals if main or child journals exist
//         if (frm.doc.docstatus === 0 && (frm.doc.journal_entry_id || (frm.doc.additional_accounts && frm.doc.additional_accounts.some(acc => acc.journal_entry_id)))) {
//             frm.remove_custom_button(__('Submit Journals'), __('Actions'));
//             frm.add_custom_button(__('Submit Journals'), function() {
//                 show_submit_journals_dialog(frm);
//             }).addClass('btn-update2');
//         }
//     },

    
    

//     before_workflow_action: function(frm) {
//         // Intercept Verify action in Application Entry in Vahan state
//         if (frm.selected_workflow_action === 'Verify' && frm.doc.workflow_state === 'Application Entry in Vahan') {
//             frappe.validated = false; // Prevent default workflow transition
//             trigger_verify_action(frm);
//         }
//         // Intercept Approve action in Vahan Entry Verification state
//         else if (frm.selected_workflow_action === 'Approve' && frm.doc.workflow_state === 'Vahan Entry Verification') {
//             frappe.validated = false; // Prevent default workflow transition
//             trigger_approve_action(frm);
//         }
//     }
// });

frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {
        // Add custom button for submitting journals if main or child journals exist
        if (frm.doc.docstatus === 0 && (frm.doc.journal_entry_id || (frm.doc.additional_accounts && frm.doc.additional_accounts.some(acc => acc.journal_entry_id)))) {
            frm.remove_custom_button(__('Submit Journals'));

            // Collect all journal IDs
            let journal_ids = [];
            if (frm.doc.journal_entry_id) {
                journal_ids.push(frm.doc.journal_entry_id);
            }
            if (frm.doc.additional_accounts) {
                frm.doc.additional_accounts.forEach(acc => {
                    if (acc.journal_entry_id) {
                        journal_ids.push(acc.journal_entry_id);
                    }
                });
            }

            // Fetch docstatus for all journals
            Promise.all(journal_ids.map(id => 
                frappe.db.get_value('Journal Entry', id, 'docstatus')
                    .then(r => ({ id, docstatus: r.message.docstatus }))
            )).then(results => {
                // Check if all journals are submitted (docstatus === 1)
                const allSubmitted = results.every(result => result.docstatus === 1);

                // Add the button
                const button = frm.add_custom_button(
                    allSubmitted ? __('Journals Submitted') : __('Submit Journals'),
                    function() {
                        if (!allSubmitted) {
                            show_submit_journals_dialog(frm);
                        } else {
                            frappe.msgprint({
                                title: __('Journals Submitted'),
                                message: __('All journals are already submitted.'),
                                indicator: 'green'
                            });
                        }
                    }
                );

                // Apply styling and disable if all submitted
                button.addClass(allSubmitted ? 'btn-update btn-disabled' : 'btn-update2');
                if (allSubmitted) {
                    button.prop('disabled', true);
                }

                // Re-apply class and disabled state after a short delay to handle rendering issues
                setTimeout(() => {
                    button.addClass(allSubmitted ? 'btn-update btn-disabled' : 'btn-update2');
                    if (allSubmitted) {
                        button.prop('disabled', true);
                    }
                }, 100);
            }).catch(err => {
                console.error('Error fetching journal statuses:', err);
                // Fallback: add button without disabling
                const button = frm.add_custom_button(__('Submit Journals'), function() {
                    show_submit_journals_dialog(frm);
                });
                button.addClass('btn-update2');
                setTimeout(() => {
                    button.addClass('btn-update2');
                }, 100);
            });
        }
    },

    before_workflow_action: function(frm) {
        // Intercept Verify action in Application Entry in Vahan state
        if (frm.selected_workflow_action === 'Verify' && frm.doc.workflow_state === 'Application Entry in Vahan') {
            frappe.validated = false; // Prevent default workflow transition
            trigger_verify_action(frm);
        }
        // Intercept Approve action in Vahan Entry Verification state
        else if (frm.selected_workflow_action === 'Approve' && frm.doc.workflow_state === 'Vahan Entry Verification') {
            frappe.validated = false; // Prevent default workflow transition
            trigger_approve_action(frm);
        }
    }
});

// Main function to handle Verify action
function trigger_verify_action(frm) {
    try {
        // Validate initial conditions
        if (!frm.doc.rto_office) {
            frappe.throw(__('RTO Office is mandatory to proceed with verification.'));
        }

        // Check if any journals are submitted
        if (frm.doc.journal_status === 'Submitted' ) {
            frappe.confirm(
                __('Some journal are already submitted. Do you want to cancel them to proceed with updates?'),
                function() {
                    cancel_journals_and_proceed(frm);
                },
                function() {
                    frappe.msgprint({
                        title: __('Action Cancelled'),
                        message: __('Verification stopped as journals are submitted.'),
                        indicator: 'red'
                    });
                }
            );
        } else {
            show_update_registration_charge_dialog_for_verify(frm);
        }
    } catch (err) {
        frappe.msgprint({
            title: __('Error'),
            message: __('Error initiating verification: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
        console.error('Verify Action Error:', err);
    }
}

// Main function to handle Approve action
function trigger_approve_action(frm) {
    try {
        // Check if rto_office is set
        if (!frm.doc.rto_office) {
            console.log('RTO Office missing, triggering alert');
            setTimeout(() => {
                frappe.msgprint({
                    title: __('Validation Error'),
                    message: __('RTO Office is mandatory.'),
                    indicator: 'red'
                });
            }, 2000);
            // Set workflow_state to Vahan Entry Verification
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        workflow_state: 'Vahan Entry Verification'
                    }
                },
                callback: function(r) {
                    frm.reload_doc(); // Refresh to avoid document modified error
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error setting workflow state: ') + (err.message || JSON.stringify(err)),
                        indicator: 'red'
                    });
                    console.error('Set Workflow State Error:', err);
                }
            });
            frappe.validated = false; // Prevent workflow transition
            return;
        }

        // Check if journal_entry_id exists
        if (!frm.doc.journal_entry_id) {
            console.log('Journal Entry ID missing, triggering alert');
            setTimeout(() => {
                frappe.msgprint({
                    title: __('Validation Error'),
                    message: __('Journal Entry is missing.'),
                    indicator: 'red'
                });
            }, 2000);
            // Set workflow_state to Vahan Entry Verification
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        workflow_state: 'Vahan Entry Verification'
                    }
                },
                callback: function(r) {
                    frm.reload_doc(); // Refresh to avoid document modified error
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error setting workflow state: ') + (err.message || JSON.stringify(err)),
                        indicator: 'red'
                    });
                    console.error('Set Workflow State Error:', err);
                }
            });
            frappe.validated = false; // Prevent workflow transition
            return;
        }

        // Check journal entry status
        frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
            .then(journal => {
                if (journal.docstatus === 1) {
                    // Journal is submitted, allow workflow to proceed
                    frappe.validated = true;
                    frappe.call({
                        method: 'frappe.model.workflow.apply_workflow',
                        args: {
                            doc: frm.doc,
                            action: 'Approve'
                        },
                        callback: function(r) {
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Workflow approved. Transitioned to Due RTO Charges Payment.'),
                                indicator: 'green'
                            });
                        },
                        error: function(err) {
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error applying workflow action: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                            console.error('Workflow Approve Error:', err);
                            frappe.validated = false;
                        }
                    });
                } else {
                    // Journal is not submitted, show alert and stay in Vahan Entry Verification
                    console.log('Journal not submitted, triggering alert');
                    setTimeout(() => {
                        frappe.msgprint({
                            title: __('Validation Error'),
                            message: __('Journal Entry is not submitted.'),
                            indicator: 'red'
                        });
                    }, 2000);
                    // Set workflow_state to Vahan Entry Verification
                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'RTO Registration',
                            name: frm.doc.name,
                            fieldname: {
                                workflow_state: 'Vahan Entry Verification'
                            }
                        },
                        callback: function(r) {
                            frm.reload_doc(); // Refresh to avoid document modified error
                        },
                        error: function(err) {
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error setting workflow state: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                            console.error('Set Workflow State Error:', err);
                        }
                    });
                    frappe.validated = false; // Prevent workflow transition
                }
            })
            .catch(err => {
                console.log('Error fetching journal, triggering alert');
                setTimeout(() => {
                    frappe.msgprint({
                        title: __('Validation Error'),
                        message: __('Error fetching Journal Entry.'),
                        indicator: 'red'
                    });
                }, 2000);
                console.error('Fetch Journal Error:', err);
                // Set workflow_state to Vahan Entry Verification
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'RTO Registration',
                        name: frm.doc.name,
                        fieldname: {
                            workflow_state: 'Vahan Entry Verification'
                        }
                    },
                    callback: function(r) {
                        frm.reload_doc(); // Refresh to avoid document modified error
                    },
                    error: function(err) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error setting workflow state: ') + (err.message || JSON.stringify(err)),
                            indicator: 'red'
                        });
                        console.error('Set Workflow State Error:', err);
                    }
                });
                frappe.validated = false; // Prevent workflow transition
            });
    } catch (err) {
        console.log('General error in approve action, triggering alert');
        setTimeout(() => {
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Error processing Approve action.'),
                indicator: 'red'
            });
        }, 2000);
        console.error('Approve Action Error:', err);
        // Set workflow_state to Vahan Entry Verification
        frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'RTO Registration',
                name: frm.doc.name,
                fieldname: {
                    workflow_state: 'Vahan Entry Verification'
                }
            },
            callback: function(r) {
                frm.reload_doc(); // Refresh to avoid document modified error
            },
            error: function(err) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error setting workflow state: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
                console.error('Set Workflow State Error:', err);
            }
        });
        frappe.validated = false; // Prevent workflow transition
    }
}
// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button for submitting journals if main or child journals exist
//         if (frm.doc.docstatus === 0 && (frm.doc.journal_entry_id || (frm.doc.additional_accounts && frm.doc.additional_accounts.some(acc => acc.journal_entry_id)))) {
//             frm.remove_custom_button(__('Submit Journals'));
//             frm.add_custom_button(__('Submit Journals'), function() {
//                 show_submit_journals_dialog(frm);
//             });
//         }
//     }
// });
// Dialog to submit main and child table journals
function show_submit_journals_dialog(frm) {
    // Collect all journal IDs (main and child table)
    let journals = [];
    if (frm.doc.journal_entry_id) {
        journals.push({ id: frm.doc.journal_entry_id, is_main: true });
    }
    if (frm.doc.additional_accounts) {
        frm.doc.additional_accounts.forEach((acc, idx) => {
            if (acc.journal_entry_id) {
                journals.push({ id: acc.journal_entry_id, is_main: false, idx: idx, smart_card_id: acc.smart_card_id });
            }
        });
    }

    if (!journals.length) {
        frappe.msgprint({
            title: __('No Journals'),
            message: __('No journals found to submit.'),
            indicator: 'blue'
        });
        return;
    }

    // Fetch journal statuses
    let journal_statuses = {};
    Promise.all(journals.map(j => 
        frappe.db.get_value('Journal Entry', j.id, ['docstatus', 'title'])
            .then(r => {
                journal_statuses[j.id] = {
                    docstatus: r.message.docstatus,
                    title: r.message.title || j.id,
                    is_main: j.is_main,
                    idx: j.idx,
                    smart_card_id: j.smart_card_id
                };
            })
    )).then(() => {
        // Build dialog fields
        let fields = journals.map(j => ({
            label: journal_statuses[j.id].is_main 
                ? `${__('Main Journal')}: <b>${journal_statuses[j.id].title}</b>` 
                : `${__('Additional Journal')}: <b>${journal_statuses[j.id].title}</b>`,
            fieldname: `journal_${j.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
            fieldtype: 'HTML',
            options: `
                <div class="p-2">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border: none;">
                            <td style="padding: 8px; text-align: left; border: none; width: 30%;">
                                <a href="/app/journal-entry/${j.id}" target="_blank" class="text-blue-600 hover:underline">${j.id}</a>
                            </td>
                            <td style="padding: 8px; font-weight: bold; text-align: left; border: none; width: 30%;">
                                <span class="text-gray-600">${
                                    journal_statuses[j.id].is_main 
                                        ? frm.doc.rto_office 
                                        : frm.doc.additional_accounts[j.idx].account
                                }</span>
                            </td>
                            <td style="padding: 8px; text-align: left; border: none; width: 40%;">
                                ${
                                    journal_statuses[j.id].docstatus === 1 
                                        ? `<button class="btn btn-success btn-disabled text-white px-4 py-2 rounded-md" disabled>${__('Submitted')}</button>` 
                                        : `<button 
                                            class="btn btn-success text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200" 
                                            onclick="submitJournal('${j.id}', ${j.is_main}, ${j.idx}, '${j.smart_card_id || ''}', this)"
                                           >${__('Submit')}</button>`
                                }
                            </td>
                        </tr>
                    </table>
                </div>`
        }));

        let dialog = new frappe.ui.Dialog({
            title: __('Submit Journals'),
            fields: fields,
            size: 'large', // Make dialog wider for better layout
            primary_action_label: __('Close'),
            primary_action: function() {
                dialog.hide();
            },
            // Add custom CSS for a world-class look
            on_page_show: function() {
                $('.modal-content').addClass('shadow-lg rounded-lg border border-gray-200');
                $('.modal-title').addClass('text-xl font-semibold text-gray-800');
                $('.modal-body').addClass('p-6 bg-gray-50');
                $('.modal-footer').addClass('border-t border-gray-200 bg-white');
                $('.btn-primary').addClass('bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2');
            }
        });
        dialog.show();

        // Define submitJournal function globally to be accessible from HTML buttons
        window.submitJournal = function(journal_id, is_main, idx, smart_card_id, button) {
            if (journal_statuses[journal_id].docstatus === 1) {
                return;
            }

            // Validate application_entry_date and application_number for main journal
            if (is_main && (!frm.doc.application_entry_date || !frm.doc.application_number)) {
                frappe.msgprint({
                    title: __('Validation Error'),
                    message: __('Application details required first then journal submit.'),
                    indicator: 'red'
                });
                return;
            }

            submit_journal(journal_id).then(() => {
                // Update statuses
                let updates = {};
                if (is_main) {
                    updates.journal_status = 'Submitted';
                } else {
                    let additional_accounts = frm.doc.additional_accounts.map((acc, index) => ({
                        ...acc,
                        status: index === idx && acc.journal_entry_id === journal_id ? 'Submitted' : acc.status
                    }));
                    updates.additional_accounts = additional_accounts;
                }

                // // Update Vehicle Smart Card journal_status if applicable
                // if (!is_main && smart_card_id) {
                //     frappe.call({
                //         method: 'frappe.client.set_value',
                //         args: {
                //             doctype: 'Vehicle Smart Card',
                //             name: smart_card_id,
                //             fieldname: { journal_status: 'Submitted' }
                //             // also add workflow_state field value Application Entry in Vahan when submitted and smart_card_status == "Payment Due"


                //         },
                //         callback: function(r) {
                //             if (!r.exc) {
                //                 frappe.msgprint({
                //                     title: __('Success'),
                //                     message: __('Vehicle Smart Card journal status updated.'),
                //                     indicator: 'green'
                //                 });
                //             }
                //         },
                //         error: function(err) {
                //             frappe.msgprint({
                //                 title: __('Error'),
                //                 message: __('Error updating Vehicle Smart Card journal status: ') + (err.message || JSON.stringify(err)),
                //                 indicator: 'red'
                //             });
                //             console.error('Vehicle Smart Card Update Error:', err);
                //         }
                //     });
                // }
                // Update Vehicle Smart Card journal_status if applicable
                if (!is_main && smart_card_id) {
                    // Fetch smart_card_status to check if it's "Payment Due"
                    frappe.db.get_value('Vehicle Smart Card', smart_card_id, 'smart_card_status')
                        .then(r => {
                            let smart_card_status = r.message.smart_card_status;
                            console.log(`Smart Card ID: ${smart_card_id}, Status: ${smart_card_status}`); // Debug log
                            let fields_to_update = { 
                                journal_status: 'Submitted',
                                smart_card_status: 'Payment Due'
                            };

                            // If smart_card_status is "Payment Due", also update workflow_state
                            if (smart_card_status === 'Payment Due') {
                                fields_to_update.workflow_state = 'Application Entry in Vahan';
                            }

                            // Update Vehicle Smart Card
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Vehicle Smart Card',
                                    name: smart_card_id,
                                    fieldname: fields_to_update
                                },
                                callback: function(r) {
                                    if (!r.exc) {
                                        frappe.msgprint({
                                            title: __('Success'),
                                            message: __('Vehicle Smart Card journal status'
                                                + (smart_card_status === 'Payment Due' ? ' and workflow state' : '') 
                                                + ' updated.'),
                                            indicator: 'green'
                                        });
                                    }
                                },
                                error: function(err) {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error updating Vehicle Smart Card: ') + (err.message || JSON.stringify(err)),
                                        indicator: 'red'
                                    });
                                    console.error('Vehicle Smart Card Update Error:', err);
                                }
                            });
                        })
                        .catch(err => {
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error fetching Vehicle Smart Card status: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                            console.error('Fetch Vehicle Smart Card Status Error:', err);
                        });
                }

                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'RTO Registration',
                        name: frm.doc.name,
                        fieldname: updates
                    },
                    callback: function(r) {
                        frm.reload_doc();
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Journal ') + journal_statuses[journal_id].title + __(' submitted successfully.'),
                            indicator: 'green'
                        });
                        // Update button to disabled state with "Submitted" text
                        button.outerHTML = `<button class="btn btn-success btn-disabled text-white px-4 py-2 rounded-md" disabled>${__('Submitted')}</button>`;
                        journal_statuses[journal_id].docstatus = 1;
                    },
                    error: function(err) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error updating journal status: ') + (err.message || JSON.stringify(err)),
                            indicator: 'red'
                        });
                        console.error('Update Status Error:', err);
                    }
                });
            }).catch(err => {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error submitting journal: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
                console.error('Submit Journal Error:', err);
            });
        };
    }).catch(err => {
        frappe.msgprint({
            title: __('Error'),
            message: __('Error fetching journal statuses: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
        console.error('Fetch Journal Statuses Error:', err);
    });
}

// Function to submit a journal entry
function submit_journal(journal_id) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.submit',
            args: {
                doctype: 'Journal Entry',
                name: journal_id
            },
            callback: function(r) {
                if (!r.exc) {
                    resolve(r);
                } else {
                    reject(r.exc);
                }
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

// Function to submit a journal entry
function submit_journal(journal_id) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.submit',
            args: {
                doctype: 'Journal Entry',
                name: journal_id
            },
            callback: function(r) {
                if (!r.exc) {
                    resolve(r);
                } else {
                    reject(r.exc);
                }
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

// Cancel submitted journals and proceed for Verify action
function cancel_journals_and_proceed(frm) {
    let journal_ids = [frm.doc.journal_entry_id].filter(id => id);
    if (frm.doc.additional_accounts) {
        journal_ids = journal_ids.concat(
            frm.doc.additional_accounts
                .filter(acc => acc.journal_entry_id && acc.status === 'Submitted')
                .map(acc => acc.journal_entry_id)
        );
    }

    let cancel_promises = journal_ids.map(journal_id => {
        return frappe.call({
            method: 'frappe.client.cancel',
            args: {
                doctype: 'Journal Entry',
                name: journal_id
            }
        });
    });

    Promise.all(cancel_promises)
        .then(() => {
            // Reset journal statuses in RTO Registration
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        journal_status: 'Draft',
                        additional_accounts: frm.doc.additional_accounts ? frm.doc.additional_accounts.map(acc => ({
                            ...acc,
                            status: 'Draft',
                            journal_entry_id: acc.journal_entry_id
                        })) : []
                    }
                },
                callback: function(r) {
                    frm.reload_doc();
                    frappe.msgprint({
                        title: __('Success'),
                        message: __('Journals cancelled. Proceed with updates.'),
                        indicator: 'green'
                    });
                    show_update_registration_charge_dialog_for_verify(frm);
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error updating RTO Registration: ') + (err.message || JSON.stringify(err)),
                        indicator: 'red'
                    });
                    console.error('Update RTO Registration Error:', err);
                }
            });
        })
        .catch(err => {
            frappe.msgprint({
                title: __('Error'),
                message: __('Error cancelling journals: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
            console.error('Cancel Journals Error:', err);
        });
}

// Dialog to update registration charge and application details for Verify action
function show_update_registration_charge_dialog_for_verify(frm) {
    let fields = [
        {
            label: __('Final Registration Charge'),
            fieldname: 'final_registration_charge',
            fieldtype: 'Currency',
            default: frm.doc.registration_charge || 0,
            reqd: 1
        },
        {
            label: __('Submit RTO Journal'),
            fieldname: 'submit_rto_journal',
            fieldtype: 'Check',
            default: 0
        },
        {
            label: __('Application Entry Date'),
            fieldname: 'application_entry_date',
            fieldtype: 'Date',
            default: frm.doc.application_entry_date || frappe.datetime.now_date(),
            reqd: 1
        },
        {
            label: __('Application Number'),
            fieldname: 'application_number',
            fieldtype: 'Data',
            default: frm.doc.application_number || '',
            reqd: 1
        }
    ];

    let dialog = new frappe.ui.Dialog({
        title: __('Update Registration and Application Details'),
        fields: fields,
        primary_action_label: __('Proceed'),
        primary_action: function(values) {
            // Validate inputs
            if (values.final_registration_charge <= 0) {
                frappe.throw(__('Final Registration Charge must be greater than zero.'));
            }
            if (!values.application_entry_date) {
                frappe.throw(__('Application Entry Date is mandatory.'));
            }
            if (!values.application_number) {
                frappe.throw(__('Application Number is mandatory.'));
            }

            // Update RTO Registration and main journal
            update_rto_and_journal_for_verify(frm, values, dialog);
        },
        secondary_action_label: __('Not Now'),
        secondary_action: function() {
            dialog.hide();
        }
    });
    dialog.show();
}

// Update RTO Registration and handle main journal for Verify action
function update_rto_and_journal_for_verify(frm, values, dialog) {
    // Update RTO Registration document
    let journal_status = values.submit_rto_journal && frm.doc.journal_entry_id ? 'Submitted' : (frm.doc.journal_status || 'Draft');
    frappe.call({
        method: 'frappe.client.set_value',
        args: {
            doctype: 'RTO Registration',
            name: frm.doc.name,
            fieldname: {
                registration_charge: values.final_registration_charge,
                application_entry_date: values.application_entry_date,
                application_number: values.application_number,
                registration_status: 'Applied',
                journal_status: journal_status
            }
        },
        callback: function(r) {
            if (r.message) {
                frm.reload_doc();
                // Update main journal (if exists)
                update_main_journal_entry_for_verify(frm, values.final_registration_charge, values.submit_rto_journal, dialog);
            }
        },
        error: function(err) {
            frappe.msgprint({
                title: __('Error'),
                message: __('Error updating RTO Registration: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
            console.error('Update RTO Error:', err);
            dialog.hide();
        }
    });
}

// Update main journal entry for Verify action
function update_main_journal_entry_for_verify(frm, new_charge, submit_rto_journal, dialog) {
    if (!frm.doc.journal_entry_id) {
        if (submit_rto_journal) {
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Main Journal Entry is missing but Submit RTO Journal is checked.'),
                indicator: 'red'
            });
            dialog.hide();
            return;
        }
        dialog.hide();
        frappe.msgprint({
            title: __('Success'),
            message: __('Registration and application details updated.'),
            indicator: 'green'
        });
        return;
    }

    get_company_abbr(function(company_abbr) {
        let accounts_to_validate = [
            `Debtors - ${company_abbr}`,
            `${frm.doc.rto_office} Payable - ${company_abbr}`
        ];

        frappe.call({
            method: 'autowings_app.custom_scripts.utils.validate_accounts',
            args: {
                accounts: accounts_to_validate,
                company: frm.doc.company || 'Autowings'
            },
            callback: function(r) {
                if (!r.message) {
                    frappe.msgprint({
                        title: __('Validation Error'),
                        message: __('One or more accounts are invalid.'),
                        indicator: 'red'
                    });
                    dialog.hide();
                    return;
                }

                frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                    .then(main_journal => {
                        if (main_journal.docstatus !== 0) {
                            frappe.msgprint({
                                title: __('Validation Error'),
                                message: __('Main Journal Entry is not in Draft status.'),
                                indicator: 'red'
                            });
                            dialog.hide();
                            return;
                        }
                        update_main_journal_entry(frm, main_journal, new_charge, company_abbr);
                        frappe.call({
                            method: 'frappe.client.save',
                            args: { doc: main_journal }
                        }).then(() => {
                            if (submit_rto_journal) {
                                return submit_journal(frm.doc.journal_entry_id);
                            }
                            return Promise.resolve();
                        }).then(() => {
                            dialog.hide();
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Registration and application details updated.'),
                                indicator: 'green'
                            });
                        }).catch(err => {
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error updating or submitting main journal: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                            console.error('Update Main Journal Error:', err);
                            dialog.hide();
                        });
                    })
                    .catch(err => {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error fetching main journal entry: ') + (err.message || JSON.stringify(err)),
                            indicator: 'red'
                        });
                        console.error('Fetch Main Journal Error:', err);
                        dialog.hide();
                    });
            },
            error: function(err) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error validating accounts: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
                console.error('Validate Accounts Error:', err);
                dialog.hide();
            }
        });
    }, function(err) {
        frappe.msgprint({
            title: __('Error'),
            message: __('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
        console.error('Company Abbr Error:', err);
        dialog.hide();
    });
}

// Helper function to submit a journal entry
function submit_journal(journal_id) {
    return frappe.db.get_doc('Journal Entry', journal_id)
        .then(journal => {
            if (journal.docstatus !== 0) {
                return Promise.resolve();
            }
            return frappe.call({
                method: 'frappe.client.submit',
                args: { doc: journal }
            });
        })
        .catch(err => {
            frappe.msgprint({
                title: __('Error'),
                message: __('Error submitting journal entry ') + journal_id + ': ' + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
            console.error('Submit Journal Error:', err);
            throw err;
        });
}

// Reused functions from original code
let cached_company_abbr = null;

function get_company_abbr(callback, error_callback) {
    if (cached_company_abbr) {
        console.log('Using cached company abbreviation:', cached_company_abbr);
        callback(cached_company_abbr);
        return;
    }
    frappe.call({
        method: 'autowings_app.custom_scripts.utils.get_company_abbr',
        callback: function(r) {
            if (r.message) {
                cached_company_abbr = r.message;
                console.log('Fetched company abbreviation:', cached_company_abbr);
                callback(cached_company_abbr);
            } else {
                error_callback(new Error('No company abbreviation returned.'));
            }
        },
        error: function(err) {
            error_callback(err);
        }
    });
}

function update_main_journal_entry(frm, journal, new_charge, company_abbr) {
    let debtorAccount = journal.accounts.find(acc => 
        acc.account === `Debtors - ${company_abbr}` && 
        acc.debit_in_account_currency > 0 &&
        acc.against_account.includes(frm.doc.rto_office)
    );
    let payableAccount = journal.accounts.find(acc => 
        acc.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && 
        acc.credit_in_account_currency > 0
    );

    if (debtorAccount && payableAccount) {
        debtorAccount.debit_in_account_currency = new_charge;
        debtorAccount.debit = new_charge;
        payableAccount.credit_in_account_currency = new_charge;
        payableAccount.credit = new_charge;
    } else {
        journal.accounts = [
            {
                account: `Debtors - ${company_abbr}`,
                party_type: 'Customer',
                party: frm.doc.customer,
                debit_in_account_currency: new_charge,
                debit: new_charge,
                credit_in_account_currency: 0,
                credit: 0,
                cost_center: `Main - ${company_abbr}`,
                against_account: frm.doc.rto_office
            },
            {
                account: `${frm.doc.rto_office} Payable - ${company_abbr}`,
                party_type: 'Supplier',
                party: frm.doc.rto_office,
                debit_in_account_currency: 0,
                debit: 0,
                credit_in_account_currency: new_charge,
                credit: new_charge,
                cost_center: `Main - ${company_abbr}`,
                against_account: frm.doc.customer
            }
        ];
    }

    journal.total_debit = new_charge;
    journal.total_credit = new_charge;
    journal.total_amount = new_charge;
}

// payment_entry.js

frappe.ui.form.on('RTO Registration', {
    before_workflow_action: function(frm) {
        if (frm.selected_workflow_action === 'RTO Payment Entry' && frm.doc.workflow_state === 'Due RTO Charges Payment') {
            frappe.validated = false;
            trigger_rto_payment_entry_action(frm);
        }
    }
});

function trigger_rto_payment_entry_action(frm) {
    try {
        if (!frm.doc.rto_office) {
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('RTO Office is mandatory to proceed with payment entry.'),
                indicator: 'red'
            });
            return;
        }

        if (!frm.doc.registration_charge || frm.doc.registration_charge <= 0) {
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Registration Charge must be greater than zero.'),
                indicator: 'red'
            });
            return;
        }

        get_company_abbr(function(company_abbr) {
            let paid_to_account = `${frm.doc.rto_office} Payable - ${company_abbr}`;

            // Validate that the paid_to account exists
            frappe.db.get_value('Account', paid_to_account, 'name')
                .then(r => {
                    if (!r.message.name) {
                        frappe.msgprint({
                            title: __('Validation Error'),
                            message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
                            indicator: 'red'
                        });
                        return;
                    }

                    let payment_entry_url = `/app/payment-entry/new-payment-entry?` +
                        `payment_type=Pay&` +
                        `party_type=Supplier&` +
                        `party=${encodeURIComponent(frm.doc.rto_office)}&` +
                        `party_name=${encodeURIComponent(frm.doc.rto_office)}&` +
                        `paid_to=${encodeURIComponent(paid_to_account)}`;

                    window.location.href = payment_entry_url;
                })
                .catch(err => {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
                        indicator: 'red'
                    });
                });
        }, function(err) {
            frappe.msgprint({
                title: __('Error'),
                message: __('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
        });
    } catch (err) {
        frappe.msgprint({
            title: __('Error'),
            message: __('Error processing RTO Payment Entry action: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
    }
}
