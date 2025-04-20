// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button "Update Journal"
//         frm.add_custom_button(__('Update Journal'), function() {
//             trigger_update_journal(frm);
//         }).addClass('btn-update-journals');
//     },
    
//     registration_charge: function(frm) {
//         // Trigger update journal when registration_charge field changes
//         if (frm.doc.registration_charge && frm.doc.journal_entry_id) {
//             trigger_update_journal(frm);
//         }
//     }
// });

// // Function to trigger the update journal process
// function trigger_update_journal(frm) {
//     // Create a dialog modal for final registration charge
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
//         primary_action_label: __('Update and Submit'),
//         primary_action: function(values) {
//             // Confirm before updating
//             frappe.confirm(
//                 __('Are you sure you want to update the journal entry with the new registration charge?'),
//                 function() {
//                     // Update RTO Registration and Journal Entry
//                     update_rto_and_journal(frm, values.final_registration_charge, d);
//                 },
//                 function() {
//                     // User cancelled
//                     frappe.msgprint(__('Update cancelled.'));
//                     d.hide();
//                 }
//             );
//         }
//     });
//     d.show();
// }

// // Function to update RTO Registration and Journal Entry
// function update_rto_and_journal(frm, new_charge, dialog) {
//     // Update RTO Registration charge
//     frappe.call({
//         method: 'frappe.client.set_value',
//         args: {
//             doctype: 'RTO Registration',
//             name: frm.doc.name,
//             fieldname: 'registration_charge',
//             value: new_charge
//         },
//         callback: function(r) {
//             // Fetch journal entry
//             frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//                 .then(journal => {
//                     if (journal.docstatus === 0) {
//                         // Draft journal: Update and submit
//                         update_draft_journal(frm, journal, new_charge, dialog);
//                     } else if (journal.docstatus === 1) {
//                         // Submitted journal: Prompt for cancellation and amendment
//                         frappe.confirm(
//                             __('Journal already submitted. Do you want to update still? Then you have to cancel this journal. Do you want to cancel and amend new Journal?'),
//                             function() {
//                                 // Cancel and amend journal
//                                 cancel_and_amend_journal(frm, journal, new_charge, dialog);
//                             },
//                             function() {
//                                 // User cancelled
//                                 frappe.msgprint(__('Update cancelled.'));
//                                 dialog.hide();
//                             }
//                         );
//                     } else {
//                         // Cancelled journal
//                         frappe.msgprint(__('Cannot update a cancelled journal entry.'));
//                         dialog.hide();
//                     }
//                 })
//                 .catch(err => {
//                     frappe.msgprint(__('Error fetching journal entry: ') + err.message);
//                     dialog.hide();
//                 });
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error updating registration charge: ') + err.message);
//             dialog.hide();
//         }
//     });
// }

// // Function to update and submit draft journal entry
// function update_draft_journal(frm, journal, new_charge, dialog) {
//     // Update journal entry accounts
//     let accounts = journal.accounts.map(account => {
//         let updated_account = { ...account };
//         if (updated_account.account === 'Debtors - A') {
//             if (updated_account.debit_in_account_currency > 0) {
//                 updated_account.debit_in_account_currency = new_charge;
//                 updated_account.debit = new_charge;
//             }
//         } else if (updated_account.account === 'RTO Charges Payable - A') {
//             if (updated_account.credit_in_account_currency > 0) {
//                 updated_account.credit_in_account_currency = new_charge;
//                 updated_account.credit = new_charge;
//             }
//         }
//         return updated_account;
//     });

//     // Update journal fields
//     journal.total_debit = new_charge;
//     journal.total_credit = new_charge;
//     journal.total_amount = new_charge;
//     journal.accounts = accounts;

//     // Save updated journal
//     frappe.call({
//         method: 'frappe.client.save',
//         args: {
//             doc: journal
//         },
//         callback: function(r) {
//             // Submit journal entry
//             frappe.call({
//                 method: 'frappe.client.submit',
//                 args: {
//                     doc: r.message
//                 },
//                 callback: function(r) {
//                     dialog.hide();
//                     frappe.msgprint({
//                         title: __('Journal Submitted'),
//                         message: __('Journal submitted'),
//                         indicator: 'green'
//                     });
//                     frm.refresh();
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error submitting journal entry: ') + err.message);
//                     dialog.hide();
//                 }
//             });
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error updating journal entry: ') + err.message);
//             dialog.hide();
//         }
//     });
// }

// // Function to cancel and amend submitted journal entry
// function cancel_and_amend_journal(frm, journal, new_charge, dialog) {
//     // Cancel the journal entry
//     frappe.call({
//         method: 'frappe.client.cancel',
//         args: {
//             doctype: 'Journal Entry',
//             name: journal.name
//         },
//         callback: function(r) {
//             // Create amended journal by copying the original
//             let amended_journal = { ...journal };
//             // Reset fields for new document
//             amended_journal.name = undefined;
//             amended_journal.creation = undefined;
//             amended_journal.modified = undefined;
//             amended_journal.modified_by = undefined;
//             amended_journal.docstatus = 0;
//             amended_journal.amended_from = journal.name;
//             // Update amounts
//             amended_journal.total_debit = new_charge;
//             amended_journal.total_credit = new_charge;
//             amended_journal.total_amount = new_charge;
//             amended_journal.accounts = amended_journal.accounts.map(account => {
//                 let updated_account = { ...account };
//                 updated_account.name = undefined;
//                 updated_account.creation = undefined;
//                 updated_account.modified = undefined;
//                 updated_account.modified_by = undefined;
//                 updated_account.docstatus = 0;
//                 if (updated_account.account === 'Debtors - A') {
//                     if (updated_account.debit_in_account_currency > 0) {
//                         updated_account.debit_in_account_currency = new_charge;
//                         updated_account.debit = new_charge;
//                     }
//                 } else if (updated_account.account === 'RTO Charges Payable - A') {
//                     if (updated_account.credit_in_account_currency > 0) {
//                         updated_account.credit_in_account_currency = new_charge;
//                         updated_account.credit = new_charge;
//                     }
//                 }
//                 return updated_account;
//             });

//             // Save amended journal
//             frappe.call({
//                 method: 'frappe.client.insert',
//                 args: {
//                     doc: amended_journal
//                 },
//                 callback: function(r) {
//                     let new_journal = r.message;
//                     // Submit amended journal
//                     frappe.call({
//                         method: 'frappe.client.submit',
//                         args: {
//                             doc: new_journal
//                         },
//                         callback: function(r) {
//                             // Update journal_entry_id in RTO Registration
//                             frappe.call({
//                                 method: 'frappe.client.set_value',
//                                 args: {
//                                     doctype: 'RTO Registration',
//                                     name: frm.doc.name,
//                                     fieldname: 'journal_entry_id',
//                                     value: new_journal.name
//                                 },
//                                 callback: function(r) {
//                                     dialog.hide();
//                                     frappe.msgprint({
//                                         title: __('Journal Submitted'),
//                                         message: __('Journal submitted'),
//                                         indicator: 'green'
//                                     });
//                                     frm.refresh();
//                                 },
//                                 error: function(err) {
//                                     frappe.msgprint(__('Error updating journal_entry_id: ') + err.message);
//                                     dialog.hide();
//                                 }
//                             });
//                         },
//                         error: function(err) {
//                             frappe.msgprint(__('Error submitting amended journal entry: ') + err.message);
//                             dialog.hide();
//                         }
//                     });
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error creating amended journal entry: ') + err.message);
//                     dialog.hide();
//                 }
//             });
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error cancelling journal entry: ') + err.message);
//             dialog.hide();
//         }
//     });
// }

frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {
        // Ensure form is fully loaded before applying read-only properties
        if (!frm.is_new() && frm.doc.__islocal !== 1) {
            set_read_only_fields(frm);
            add_action_button(frm);
        }
    },

    before_submit: function(frm) {
        // Validate mandatory fields
        if (!frm.doc.application_entry_date || !frm.doc.application_number) {
            frappe.throw(__('Application Entry Date and Application Number are mandatory for submission.'));
        }

        // Prompt to update registration charge or application details
        frappe.confirm(
            __('Do you want to change the Registration Charge or Application Details before submitting?'),
            function() {
                show_update_registration_charge_dialog(frm, true);
            },
            function() {
                submit_rto_and_journal(frm);
            }
        );
        frappe.validated = false;
    },

    after_cancel: function(frm) {
        // Cancel associated journal entry
        if (frm.doc.journal_entry_id) {
            frappe.call({
                method: 'frappe.client.cancel',
                args: {
                    doctype: 'Journal Entry',
                    name: frm.doc.journal_entry_id
                },
                callback: function(r) {
                    frappe.msgprint(__('Journal Entry cancelled.'));
                    amend_rto_registration(frm);
                },
                error: function(err) {
                    frappe.msgprint(__('Error cancelling journal entry: ') + (err.message || JSON.stringify(err)));
                }
            });
        }
    }
});

// Set fields to read-only
function set_read_only_fields(frm) {
    try {
        const fields = ['registration_charge', 'application_entry_date', 'application_number', 'registration_status'];
        fields.forEach(field => frm.set_df_property(field, 'read_only', 1));
        frm.set_df_property('rto_activity', 'read_only', 1);
        frm.fields_dict['rto_activity'].grid.cannot_add_rows = true;
    } catch (err) {
        frappe.msgprint(__('Error setting read-only fields: ') + (err.message || JSON.stringify(err)));
    }
}

// Add custom Action button with dropdown
function add_action_button(frm) {
    try {
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button(__('Update Registration Charge'), function() {
                show_update_registration_charge_dialog(frm);
            }, __('Action'));
            frm.add_custom_button(__('Update Application Details'), function() {
                show_application_details_dialog(frm);
            }, __('Action'));
        } else if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Add RTO Activity'), function() {
                show_add_rto_activity_dialog(frm);
            }, __('Action'));
        }
    } catch (err) {
        frappe.msgprint(__('Error adding Action button: ') + (err.message || JSON.stringify(err)));
    }
}

// Show dialog to update registration charge
function show_update_registration_charge_dialog(frm, is_before_submit = false) {
    let d = new frappe.ui.Dialog({
        title: __('Update Registration Charge'),
        fields: [
            {
                label: __('Final Registration Charge'),
                fieldname: 'final_registration_charge',
                fieldtype: 'Currency',
                default: frm.doc.registration_charge,
                reqd: 1
            }
        ],
        primary_action_label: __('Save'),
        primary_action: function(values) {
            update_rto_and_journal(frm, values.final_registration_charge, d, is_before_submit);
        }
    });
    d.show();
}

// Update RTO Registration and Journal Entry
function update_rto_and_journal(frm, new_charge, dialog, is_before_submit) {
    frappe.call({
        method: 'frappe.client.set_value',
        args: {
            doctype: 'RTO Registration',
            name: frm.doc.name,
            fieldname: 'registration_charge',
            value: new_charge
        },
        callback: function(r) {
            frm.reload_doc(); // Reload to avoid concurrency issues
            if (frm.doc.journal_entry_id && frm.doc.docstatus === 0) {
                frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                    .then(journal => {
                        if (journal.docstatus === 0) {
                            update_draft_journal_entry(frm, journal, new_charge, dialog, is_before_submit);
                        } else {
                            frappe.msgprint(__('Journal Entry is not in Draft status.'));
                            dialog.hide();
                            frm.reload_doc();
                            if (is_before_submit) {
                                show_application_details_dialog(frm, true);
                            } else {
                                show_application_details_dialog(frm);
                            }
                        }
                    })
                    .catch(err => {
                        frappe.msgprint(__('Error fetching journal entry: ') + (err.message || JSON.stringify(err)));
                        dialog.hide();
                    });
            } else {
                dialog.hide();
                frm.reload_doc();
                if (is_before_submit) {
                    show_application_details_dialog(frm, true);
                } else {
                    show_application_details_dialog(frm);
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error updating registration charge: ') + (err.message || JSON.stringify(err)));
            dialog.hide();
        }
    });
}

// Update Draft Journal Entry
function update_draft_journal_entry(frm, journal, new_charge, dialog, is_before_submit) {
    try {
        let accounts = journal.accounts.map(account => {
            let updated_account = { ...account };
            if (updated_account.account === 'Debtors - A' && updated_account.debit_in_account_currency > 0) {
                updated_account.debit_in_account_currency = new_charge;
                updated_account.debit = new_charge;
            } else if (updated_account.account === 'RTO Charges Payable - A' && updated_account.credit_in_account_currency > 0) {
                updated_account.credit_in_account_currency = new_charge;
                updated_account.credit = new_charge;
            }
            return updated_account;
        });

        journal.total_debit = new_charge;
        journal.total_credit = new_charge;
        journal.total_amount = new_charge;
        journal.accounts = accounts;

        frappe.call({
            method: 'frappe.client.save',
            args: { doc: journal },
            callback: function(r) {
                dialog.hide();
                frm.reload_doc();
                frappe.msgprint(__('Registration Charge and Journal Entry updated.'));
                if (is_before_submit) {
                    show_application_details_dialog(frm, true);
                } else {
                    show_application_details_dialog(frm);
                }
            },
            error: function(err) {
                frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
                dialog.hide();
            }
        });
    } catch (err) {
        frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
        dialog.hide();
    }
}

// Show dialog to update application details
function show_application_details_dialog(frm, is_before_submit = false) {
    let d = new frappe.ui.Dialog({
        title: __('Update Application Details'),
        fields: [
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
                default: frm.doc.application_number,
                reqd: 1
            }
        ],
        primary_action_label: is_before_submit ? __('Save and Submit') : __('Save'),
        primary_action: function(values) {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        application_entry_date: values.application_entry_date,
                        application_number: values.application_number,
                        registration_status: 'Applied'
                    }
                },
                callback: function(r) {
                    d.hide();
                    frm.reload_doc(); // Reload to ensure latest document state
                    frappe.msgprint(__('Application Details updated.'));
                    if (is_before_submit) {
                        submit_rto_and_journal(frm); // Directly trigger submission
                    }
                },
                error: function(err) {
                    frappe.msgprint(__('Error updating application details: ') + (err.message || JSON.stringify(err)));
                    d.hide();
                }
            });
        }
    });
    d.show();
}

// Submit RTO Registration and Journal Entry
function submit_rto_and_journal(frm) {
    try {
        if (!frm.doc.journal_entry_id) {
            frappe.throw(__('No Journal Entry linked to this RTO Registration.'));
        }

        frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
            .then(journal => {
                if (journal.docstatus === 0) {
                    submit_draft_journal(frm, journal);
                } else if (journal.docstatus === 1) {
                    submit_rto_registration(frm); // Journal already submitted, submit RTO Registration
                } else {
                    frappe.msgprint(__('Journal Entry is not in Draft or Submitted status.'));
                }
            })
            .catch(err => {
                frappe.msgprint(__('Error fetching journal entry: ') + (err.message || JSON.stringify(err)));
            });
    } catch (err) {
        frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
    }
}

// Submit Draft Journal Entry
function submit_draft_journal(frm, journal) {
    try {
        let new_charge = frm.doc.registration_charge;
        let accounts = journal.accounts.map(account => {
            let updated_account = { ...account };
            if (updated_account.account === 'Debtors - A' && updated_account.debit_in_account_currency > 0) {
                updated_account.debit_in_account_currency = new_charge;
                updated_account.debit = new_charge;
            } else if (updated_account.account === 'RTO Charges Payable - A' && updated_account.credit_in_account_currency > 0) {
                updated_account.credit_in_account_currency = new_charge;
                updated_account.credit = new_charge;
            }
            return updated_account;
        });

        journal.total_debit = new_charge;
        journal.total_credit = new_charge;
        journal.total_amount = new_charge;
        journal.accounts = accounts;

        frappe.call({
            method: 'frappe.client.save',
            args: { doc: journal },
            callback: function(r) {
                let saved_journal = r.message;
                frappe.call({
                    method: 'frappe.client.submit',
                    args: { doc: saved_journal },
                    callback: function(r) {
                        frm.reload_doc(); // Reload before submitting RTO Registration
                        submit_rto_registration(frm);
                    },
                    error: function(err) {
                        frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
                    }
                });
            },
            error: function(err) {
                frappe.msgprint(__('Error updating journal entry: ') + (err.message || JSON.stringify(err)));
            }
        });
    } catch (err) {
        frappe.msgprint(__('Error submitting journal entry: ') + (err.message || JSON.stringify(err)));
    }
}

// Submit RTO Registration
function submit_rto_registration(frm) {
    try {
        frappe.call({
            method: 'autowings_app.custom_scripts.vsm_each_doc_submission.submit_rto_registration',
            args: {
                rto_name: frm.doc.name
            },
            callback: function(r) {
                if (r.message && r.message.success) {
                    frm.reload_doc(); // Reload to reflect submitted state
                    frappe.msgprint({
                        title: __('Submission Successful'),
                        message: __('RTO Registration submitted successfully.'),
                        indicator: 'green'
                    });
                } else {
                    frappe.msgprint(__('Error submitting RTO Registration: ') + (r.message.error || 'Unknown error'));
                }
            },
            error: function(err) {
                frappe.msgprint(__('Error submitting RTO Registration: ') + (err.message || JSON.stringify(err)));
            }
        });
    } catch (err) {
        frappe.msgprint(__('Error in submission process: ') + (err.message || JSON.stringify(err)));
    }
}

// Show dialog to add RTO Activity
function show_add_rto_activity_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Add RTO Activity'),
        fields: [
            {
                label: __('Item'),
                fieldname: 'item',
                fieldtype: 'Link',
                options: 'RTO Activity Item',
                reqd: 1
            },
            {
                label: __('Status'),
                fieldname: 'status',
                fieldtype: 'Select',
                options: ['Received', 'Delivered'],
                reqd: 1
            },
            {
                label: __('Date'),
                fieldname: 'date',
                fieldtype: 'Date',
                reqd: 1,
                default: frappe.datetime.now_date()
            }
        ],
        primary_action_label: __('Add'),
        primary_action: function(values) {
            frappe.call({
                method: 'autowings_app.custom_scripts.rto_activity.add_rto_activity',
                args: {
                    rto_name: frm.doc.name,
                    item: values.item,
                    status: values.status,
                    date: values.date
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        d.hide();
                        frappe.msgprint(r.message.message);
                        frm.reload_doc();
                    } else {
                        frappe.msgprint(r.message.message || __('Error adding RTO Activity.'));
                        d.hide();
                    }
                },
                error: function(err) {
                    frappe.msgprint(__('Error adding RTO Activity: ') + (err.message || JSON.stringify(err)));
                    d.hide();
                }
            });
        }
    });
    d.show();
}

// Amend RTO Registration and update Vehicle Sales Master
function amend_rto_registration(frm) {
    try {
        frappe.call({
            method: 'frappe.client.amend',
            args: {
                doctype: 'RTO Registration',
                name: frm.doc.name
            },
            callback: function(r) {
                let new_rto_doc = r.message;
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'RTO Registration',
                        name: new_rto_doc.name,
                        fieldname: 'journal_entry_id',
                        value: ''
                    },
                    callback: function(r) {
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Vehicle Sales Master',
                                name: frm.doc.vsm_id,
                                fieldname: 'rto_registration_id',
                                value: new_rto_doc.name
                            },
                            callback: function(r) {
                                frappe.msgprint(__('RTO Registration amended and Vehicle Sales Master updated.'));
                                frappe.set_route('Form', 'RTO Registration', new_rto_doc.name);
                            },
                            error: function(err) {
                                frappe.msgprint(__('Error updating Vehicle Sales Master: ') + (err.message || JSON.stringify(err)));
                            }
                        });
                    },
                    error: function(err) {
                        frappe.msgprint(__('Error updating journal_entry_id in amended RTO Registration: ') + (err.message || JSON.stringify(err)));
                    }
                });
            },
            error: function(err) {
                frappe.msgprint(__('Error amending RTO Registration: ') + (err.message || JSON.stringify(err)));
            }
        });
    } catch (err) {
        frappe.msgprint(__('Error in amend process: ') + (err.message || JSON.stringify(err)));
    }
}