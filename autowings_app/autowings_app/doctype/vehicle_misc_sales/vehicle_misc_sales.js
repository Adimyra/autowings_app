// // frappe.ui.form.on('Vehicle Misc Sales', {
// //     refresh: function(frm) {
// //         // Add custom button "Update Journals"
// //         frm.add_custom_button(__('Update Journals'), function() {
// //             trigger_update_journals(frm);
// //         });
// //     }
// // });

// frappe.ui.form.on('Vehicle Misc Sales', {
//     refresh: function(frm) {
//         // Add custom button "Update Journals"
//         frm.add_custom_button(__('Update Journals'), function() {
//             trigger_update_journals(frm);
//         }).addClass('btn-update-journals');
//     }
// });

// // Function to trigger the update journals process
// function trigger_update_journals(frm) {
//     // Fetch journal statuses and build modal fields
//     let fields = [];
//     let promises = frm.doc.misc_accounts.map(row => {
//         return frappe.db.get_value('Journal Entry', row.journal_entry_id, 'docstatus')
//             .then(r => {
//                 return { row, docstatus: r.message.docstatus };
//             });
//     });

//     Promise.all(promises).then(results => {
//         results.forEach(({ row, docstatus }, idx) => {
//             fields.push(
//                 {
//                     label: __('Misc Account'),
//                     fieldname: `misc_account_${idx}`,
//                     fieldtype: 'Data',
//                     default: row.misc_account,
//                     read_only: 1
//                 },
//                 {
//                     label: __('Amount'),
//                     fieldname: `amount_${idx}`,
//                     fieldtype: 'Currency',
//                     default: row.amount,
//                     reqd: 1
//                 },
//                 {
//                     label: docstatus === 1 ? __('Status') : __('Submit'),
//                     fieldname: docstatus === 1 ? `status_${idx}` : `submit_${idx}`,
//                     fieldtype: docstatus === 1 ? 'Data' : 'Check',
//                     default: docstatus === 1 ? 'Submitted' : 0,
//                     read_only: docstatus === 1 ? 1 : 0,
//                     options: docstatus === 1 ? { color: 'green' } : undefined
//                 },
//                 {
//                     fieldtype: 'Section Break',
//                     fieldname: `section_break_${idx}`
//                 }
//             );
//         });

//         let d = new frappe.ui.Dialog({
//             title: __('Update Misc Accounts'),
//             fields: fields,
//             primary_action_label: __('Update and Submit'),
//             primary_action: function(values) {
//                 // Confirm before updating
//                 frappe.confirm(
//                     __('Are you sure you want to update the journal entries with the new amounts?'),
//                     function() {
//                         // Update Vehicle Misc Sales and Journals
//                         update_misc_sales_and_journals(frm, values, results, d);
//                     },
//                     function() {
//                         // User cancelled
//                         frappe.msgprint(__('Update cancelled.'));
//                         d.hide();
//                     }
//                 );
//             }
//         });
//         d.show();
//     }).catch(err => {
//         frappe.msgprint(__('Error fetching journal statuses: ') + err.message);
//     });
// }

// // Function to update Vehicle Misc Sales and Journal Entries
// function update_misc_sales_and_journals(frm, values, results, dialog) {
//     let updates = [];
//     frm.doc.misc_accounts.forEach((row, idx) => {
//         let new_amount = values[`amount_${idx}`];
//         let submit_checked = values[`submit_${idx}`] || false;
//         let docstatus = results[idx].docstatus;
//         if ((new_amount !== row.amount && new_amount !== undefined) || (docstatus === 0 && submit_checked)) {
//             updates.push({
//                 row_idx: idx,
//                 misc_account: row.misc_account,
//                 journal_entry_id: row.journal_entry_id,
//                 new_amount: new_amount !== undefined ? new_amount : row.amount,
//                 submit: docstatus === 0 && submit_checked
//             });
//         }
//     });

//     if (updates.length === 0) {
//         frappe.msgprint(__('No changes detected in amounts or submit selections.'));
//         dialog.hide();
//         return;
//     }

//     // Process updates sequentially
//     process_updates(frm, updates, 0, dialog);
// }

// // Function to process updates one by one
// function process_updates(frm, updates, index, dialog) {
//     if (index >= updates.length) {
//         dialog.hide();
//         frappe.msgprint({
//             title: __('Journals Submitted'),
//             message: __('Journals submitted'),
//             indicator: 'green'
//         });
//         frm.refresh();
//         return;
//     }

//     let update = updates[index];
//     // Update misc_accounts child table if amount changed
//     let amount_promise = update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount
//         ? frappe.call({
//             method: 'frappe.client.set_value',
//             args: {
//                 doctype: 'Misc Journal vsm',
//                 name: frm.doc.misc_accounts[update.row_idx].name,
//                 fieldname: 'amount',
//                 value: update.new_amount
//             }
//         })
//         : Promise.resolve();

//     amount_promise.then(() => {
//         // Fetch journal entry
//         frappe.db.get_doc('Journal Entry', update.journal_entry_id)
//             .then(journal => {
//                 if (journal.docstatus === 0) {
//                     // Draft journal: Update and submit if needed
//                     update_draft_journal(frm, journal, update, dialog, () => {
//                         process_updates(frm, updates, index + 1, dialog);
//                     });
//                 } else if (journal.docstatus === 1 && update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount) {
//                     // Submitted journal: Prompt for cancellation and amendment
//                     frappe.confirm(
//                         __('Journal {0} already submitted. Do you want to update still? Then you have to cancel this journal. Do you want to cancel and amend new Journal?').replace('{0}', update.journal_entry_id),
//                         function() {
//                             // Cancel and amend journal
//                             cancel_and_amend_journal(frm, journal, update, dialog, () => {
//                                 process_updates(frm, updates, index + 1, dialog);
//                             });
//                         },
//                         function() {
//                             // Skip this journal and continue
//                             process_updates(frm, updates, index + 1, dialog);
//                         }
//                     );
//                 } else if (journal.docstatus === 2) {
//                     frappe.msgprint(__('Cannot update cancelled journal entry {0}.').replace('{0}', update.journal_entry_id));
//                     process_updates(frm, updates, index + 1, dialog);
//                 } else {
//                     // No action needed (e.g., submitted journal with no amount change)
//                     process_updates(frm, updates, index + 1, dialog);
//                 }
//             })
//             .catch(err => {
//                 frappe.msgprint(__('Error fetching journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//                 process_updates(frm, updates, index + 1, dialog);
//             });
//     }).catch(err => {
//         frappe.msgprint(__('Error updating amount for {0}: ').replace('{0}', update.misc_account) + err.message);
//         process_updates(frm, updates, index + 1, dialog);
//     });
// }

// // Function to update and submit draft journal entry
// function update_draft_journal(frm, journal, update, dialog, callback) {
//     let needs_update = update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount;
//     if (!needs_update && !update.submit) {
//         callback();
//         return;
//     }

//     // Update journal entry accounts if amount changed
//     if (needs_update) {
//         journal.accounts = journal.accounts.map(account => {
//             let updated_account = { ...account };
//             if (updated_account.account === 'Debtors - A') {
//                 if (updated_account.debit_in_account_currency > 0) {
//                     updated_account.debit_in_account_currency = update.new_amount;
//                     updated_account.debit = update.new_amount;
//                 }
//             } else if (updated_account.account === `${update.misc_account} Payable - A`) {
//                 if (updated_account.credit_in_account_currency > 0) {
//                     updated_account.credit_in_account_currency = update.new_amount;
//                     updated_account.credit = update.new_amount;
//                 }
//             }
//             return updated_account;
//         });

//         journal.total_debit = update.new_amount;
//         journal.total_credit = update.new_amount;
//         journal.total_amount = update.new_amount;
//     }

//     // Save updated journal
//     let save_promise = needs_update
//         ? frappe.call({
//             method: 'frappe.client.save',
//             args: {
//                 doc: journal
//             }
//         })
//         : Promise.resolve({ message: journal });

//     save_promise.then(r => {
//         let journal_to_submit = r.message || journal;
//         // Submit journal entry if checked or amount changed
//         if (update.submit || needs_update) {
//             frappe.call({
//                 method: 'frappe.client.submit',
//                 args: {
//                     doc: journal_to_submit
//                 },
//                 callback: function(r) {
//                     callback();
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error submitting journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//                     callback();
//                 }
//             });
//         } else {
//             callback();
//         }
//     }).catch(err => {
//         frappe.msgprint(__('Error updating journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//         callback();
//     });
// }

// // Function to cancel and amend submitted journal entry
// function cancel_and_amend_journal(frm, journal, update, dialog, callback) {
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
//             amended_journal.total_debit = update.new_amount;
//             amended_journal.total_credit = update.new_amount;
//             amended_journal.total_amount = update.new_amount;
//             amended_journal.accounts = amended_journal.accounts.map(account => {
//                 let updated_account = { ...account };
//                 updated_account.name = undefined;
//                 updated_account.creation = undefined;
//                 updated_account.modified = undefined;
//                 updated_account.modified_by = undefined;
//                 updated_account.docstatus = 0;
//                 if (updated_account.account === 'Debtors - A') {
//                     if (updated_account.debit_in_account_currency > 0) {
//                         updated_account.debit_in_account_currency = update.new_amount;
//                         updated_account.debit = update.new_amount;
//                     }
//                 } else if (updated_account.account === `${update.misc_account} Payable - A`) {
//                     if (updated_account.credit_in_account_currency > 0) {
//                         updated_account.credit_in_account_currency = update.new_amount;
//                         updated_account.credit = update.new_amount;
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
//                             // Update journal_entry_id in misc_accounts
//                             frappe.call({
//                                 method: 'frappe.client.set_value',
//                                 args: {
//                                     doctype: 'Misc Journal vsm',
//                                     name: frm.doc.misc_accounts[update.row_idx].name,
//                                     fieldname: 'journal_entry_id',
//                                     value: new_journal.name
//                                 },
//                                 callback: function(r) {
//                                     callback();
//                                 },
//                                 error: function(err) {
//                                     frappe.msgprint(__('Error updating journal_entry_id for {0}: ').replace('{0}', update.misc_account) + err.message);
//                                     callback();
//                                 }
//                             });
//                         },
//                         error: function(err) {
//                             frappe.msgprint(__('Error submitting amended journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//                             callback();
//                         }
//                     });
//                 },
//                 error: function(err) {
//                     frappe.msgprint(__('Error creating amended journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//                     callback();
//                 }
//             });
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error cancelling journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
//             callback();
//         }
//     });
// }

frappe.ui.form.on('Vehicle Misc Sales', {
    refresh: function(frm) {
        try {
            // Clear workflow_state if present
            if (frm.doc.workflow_state) {
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Vehicle Misc Sales',
                        name: frm.doc.name,
                        fieldname: { workflow_state: '' }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            frm.reload_doc();
                        } else {
                            log_vehicle_misc_activity(frm, 'Clear Workflow State', 'Failed', 'Failed to clear workflow state');
                        }
                    },
                    error: function(err) {
                        log_vehicle_misc_activity(frm, 'Clear Workflow State', 'Failed', 'Error clearing workflow state: ' + (err.message || 'Unknown error'));
                    }
                });
            }

            // Add Update Form button for 'Due Update' status
            if (frm.doc.status === 'Due Update') {
                frm.add_custom_button(__('Update Form'), function() {
                    try {
                        show_update_misc_dialog(frm);
                    } catch (e) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to open update dialog: ') + e.message,
                            indicator: 'red'
                        });
                    }
                });
            }

            // Add Make Payment button if any child row has payment_status 'Due' and journal_status 'Submitted'
            if (frm.doc.misc_accounts && frm.doc.misc_accounts.some(row => row.payment_status === 'Due') && frm.doc.status === 'Due Payment' && frm.doc.journal_status === 'Submitted') {
                frm.add_custom_button(__('Make Payment'), function() {
                    try {
                        show_payment_dialog(frm);
                    } catch (e) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to open payment dialog: ') + e.message,
                            indicator: 'red'
                        });
                    }
                });
            }

            // Set form status indicator
            frm.set_intro(__('Status: ') + frm.doc.status + ' | Journal Status: ' + frm.doc.journal_status, 'blue');
        } catch (e) {
            frappe.msgprint({
                title: __('Error'),
                message: __('Error in form refresh: ') + e.message,
                indicator: 'red'
            });
        }
    }
});

// Log activity to Misc Activity Log child table with retry
function log_vehicle_misc_activity(frm, activity, status, remarks, retry_count = 0) {
    const max_retries = 3;
    try {
        let activity_log = {
            doctype: 'RTO Activity Log',
            activity: activity,
            status: status,
            user: frappe.session.user,
            update_on: frappe.datetime.now_datetime(),
            remarks: (remarks || '').substring(0, 140),
            parent: frm.doc.name,
            parentfield: 'misc_activity',
            parenttype: 'Vehicle Misc Sales'
        };

        frappe.call({
            method: 'frappe.client.insert',
            args: { doc: activity_log },
            callback: function(r) {
                if (r.exc && retry_count < max_retries && r.exc.includes('modified after you have opened it')) {
                    frm.reload_doc().then(() => {
                        log_vehicle_misc_activity(frm, activity, status, remarks, retry_count + 1);
                    });
                } else if (r.exc) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error logging activity: ') + (r.exc || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                    frm.reload_doc().then(() => {
                        log_vehicle_misc_activity(frm, activity, status, remarks, retry_count + 1);
                    });
                } else {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error logging activity: ') + (err.message || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            }
        });
    } catch (e) {
        frappe.msgprint({
            title: __('Error'),
            message: __('Error logging activity: ') + e.message,
            indicator: 'red'
        });
    }
}

// Show dialog to update misc accounts
function show_update_misc_dialog(frm) {
    try {
        let current_row_index = 0;
        let misc_accounts = frm.doc.misc_accounts.map(row => ({
            name: row.name,
            misc_account: row.misc_account,
            amount: row.amount,
            journal_entry_id: row.journal_entry_id,
            payment_status: row.payment_status,
            submit_journal: frm.doc.journal_status === 'Draft' ? true : false
        }));

        function show_row_dialog() {
            if (current_row_index >= misc_accounts.length) {
                frappe.confirm(
                    __('Do you want to submit the selected journal entries? This action cannot be undone.'),
                    function() {
                        submit_journals(frm, misc_accounts);
                    },
                    function() {
                        prompt_for_remarks(frm, misc_accounts);
                    }
                );
                return;
            }

            let row = misc_accounts[current_row_index];
            let dialog = new frappe.ui.Dialog({
                title: __('Update Misc Account') + ` (${current_row_index + 1}/${misc_accounts.length})`,
                fields: [
                    {
                        label: __('Account Name'),
                        fieldname: 'misc_account',
                        fieldtype: 'Data',
                        default: row.misc_account,
                        reqd: 1
                    },
                    {
                        label: __('Account Amount'),
                        fieldname: 'amount',
                        fieldtype: 'Currency',
                        default: row.amount,
                        reqd: 1
                    },
                    {
                        label: __('Submit Journal'),
                        fieldname: 'submit_journal',
                        fieldtype: 'Check',
                        default: row.submit_journal ? 1 : 0,
                        depends_on: 'eval:doc.journal_status==="Draft"'
                    }
                ],
                primary_action_label: current_row_index === misc_accounts.length - 1 ? __('Update & Finish') : __('Update & Next'),
                primary_action: function(values) {
                    if (!values.misc_account) {
                        frappe.throw(__('Account Name is mandatory.'));
                    }
                    if (!values.amount || values.amount <= 0) {
                        frappe.throw(__('Account Amount must be greater than zero.'));
                    }

                    misc_accounts[current_row_index] = {
                        ...row,
                        misc_account: values.misc_account,
                        amount: values.amount,
                        submit_journal: values.submit_journal || false
                    };

                    current_row_index++;
                    dialog.hide();
                    show_row_dialog();
                },
                secondary_action_label: __('Cancel'),
                secondary_action: function() {
                    dialog.hide();
                }
            });
            dialog.set_value('journal_status', frm.doc.journal_status);
            dialog.show();
        }

        show_row_dialog();
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Update Misc Accounts', 'Failed', 'Failed to create dialog: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Failed to create dialog: ') + e.message,
            indicator: 'red'
        });
    }
}

// Initiate journal submission
function submit_journals(frm, misc_accounts) {
    try {
        update_document_and_journals(frm, misc_accounts, true);
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error initiating journal submission: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Error initiating journal submission: ') + e.message,
            indicator: 'red'
        });
    }
}

// Update document and journals
function update_document_and_journals(frm, misc_accounts, submit_journals, remarks = '') {
    try {
        // Check for changes
        let has_changes = misc_accounts.some((row, idx) => {
            let original = frm.doc.misc_accounts[idx] || {};
            return row.misc_account !== (original.misc_account || '') ||
                   row.amount !== (original.amount || 0);
        });

        // Refresh document to avoid TimestampMismatchError
        frm.reload_doc().then(() => {
            // Update child table
            frm.doc.misc_accounts = misc_accounts.map(row => ({
                name: row.name,
                misc_account: row.misc_account,
                amount: row.amount,
                journal_entry_id: row.journal_entry_id,
                payment_status: row.payment_status
            }));

            // Update parent status
            let new_status = submit_journals && frm.doc.misc_accounts.some(row => row.payment_status === 'Due') ? 'Due Payment' : 'Due Update';
            frm.doc.status = new_status;
            frm.doc.workflow_state = '';

            // Save document
            save_document_with_retry(frm, has_changes, () => {
                frappe.call({
                    method: 'autowings_app.custom_scripts.utils.get_company_abbr',
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let company_abbr = r.message;
                            let accounts_to_validate = ['Debtors', 'Miscellaneous Income'];

                            frappe.call({
                                method: 'autowings_app.custom_scripts.utils.validate_accounts',
                                args: {
                                    accounts: accounts_to_validate,
                                    company: frm.doc.company || 'Autowings'
                                },
                                callback: function(r) {
                                    if (!r.exc && r.message) {
                                        let promises = misc_accounts.map(row => {
                                            if (row.journal_entry_id && frm.doc.journal_status === 'Draft') {
                                                return frappe.db.get_doc('Journal Entry', row.journal_entry_id)
                                                    .then(journal => {
                                                        if (journal.docstatus !== 0) {
                                                            throw new Error(`Journal Entry ${row.journal_entry_id} is not in Draft status`);
                                                        }
                                                        update_journal_entry(frm, journal, row.amount, company_abbr);
                                                        return frappe.call({
                                                            method: 'frappe.client.save',
                                                            args: { doc: journal }
                                                        }).then(() => ({ journal_id: row.journal_entry_id, name: row.name, submit: row.submit_journal }));
                                                    })
                                                    .catch(err => {
                                                        throw new Error(`Error updating journal ${row.journal_entry_id}: ${err.message}`);
                                                    });
                                            }
                                            return Promise.resolve({ journal_id: null, name: row.name, submit: row.submit_journal });
                                        });

                                        Promise.all(promises)
                                            .then(results => {
                                                if (has_changes) {
                                                    log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Success', 'Misc accounts details updated');
                                                }
                                                if (submit_journals) {
                                                    submit_journals_after_update(frm, misc_accounts, results);
                                                } else {
                                                    log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Journal Submission Skipped', remarks.substring(0, 140));
                                                    finalize_update(frm, has_changes);
                                                }
                                            })
                                            .catch(err => {
                                                log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error updating journals: ' + err.message);
                                                frappe.msgprint({
                                                    title: __('Error'),
                                                    message: err.message || 'Error updating journals',
                                                    indicator: 'red'
                                                });
                                            });
                                    } else {
                                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Invalid accounts');
                                        frappe.msgprint({
                                            title: __('Validation Error'),
                                            message: 'One or more accounts are invalid',
                                            indicator: 'red'
                                        });
                                    }
                                },
                                error: function(err) {
                                    log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error validating accounts: ' + (err.message || 'Unknown error'));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: 'Error validating accounts: ' + (err.message || 'Unknown error'),
                                        indicator: 'red'
                                    });
                                }
                            });
                        } else {
                            log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Failed to fetch company abbreviation');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error fetching company abbreviation',
                                indicator: 'red'
                            });
                        }
                    },
                    error: function(err) {
                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'));
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            });
        }).catch(err => {
            log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Failed to refresh document: ' + err.message);
            frappe.msgprint({
                title: __('Error'),
                message: __('Failed to refresh document: ') + err.message,
                indicator: 'red'
            });
        });
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error processing update: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Error processing update: ') + e.message,
            indicator: 'red'
        });
    }
}

// Prompt for remarks if journals are not submitted
function prompt_for_remarks(frm, misc_accounts) {
    try {
        let remark_dialog = new frappe.ui.Dialog({
            title: __('Enter Remarks'),
            fields: [
                {
                    label: __('Remarks'),
                    fieldname: 'remarks',
                    fieldtype: 'Small Text',
                    reqd: 1,
                    description: __('Please provide the reason for not submitting the journals.')
                }
            ],
            primary_action_label: __('Save'),
            primary_action: function(values) {
                update_document_and_journals(frm, misc_accounts, false, values.remarks);
                remark_dialog.hide();
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                remark_dialog.hide();
            }
        });
        remark_dialog.show();
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error prompting for remarks: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Error prompting for remarks: ') + e.message,
            indicator: 'red'
        });
    }
}

// Submit journals after updating with retry logic
function submit_journals_after_update(frm, misc_accounts, update_results, retry_count = 0) {
    const max_retries = 3;
    try {
        // Refresh document to ensure latest state
        frm.reload_doc().then(() => {
            frappe.call({
                method: 'autowings_app.custom_scripts.utils.get_company_abbr',
                callback: function(r) {
                    if (!r.exc && r.message) {
                        let company_abbr = r.message;
                        let promises = misc_accounts.map(row => {
                            let update_result = update_results.find(res => res.name === row.name && res.journal_id === row.journal_entry_id);
                            if (row.journal_entry_id && frm.doc.journal_status === 'Draft' && update_result && update_result.submit) {
                                return frappe.db.get_doc('Journal Entry', row.journal_entry_id)
                                    .then(journal => {
                                        if (journal.docstatus !== 0) {
                                            throw new Error(`Journal Entry ${row.journal_entry_id} is not in Draft status`);
                                        }
                                        return frappe.call({
                                            method: 'frappe.client.submit',
                                            args: { doc: journal }
                                        }).then(() => {
                                            return { journal_id: row.journal_entry_id, name: row.name };
                                        });
                                    })
                                    .catch(err => {
                                        throw new Error(`Error processing journal ${row.journal_entry_id}: ${err.message}`);
                                    });
                            }
                            return Promise.resolve({ journal_id: null, name: row.name });
                        });

                        Promise.all(promises)
                            .then(results => {
                                // Check if all journals are submitted
                                let all_journals_submitted = true;
                                let journal_checks = misc_accounts.map(row => {
                                    if (row.journal_entry_id) {
                                        return frappe.db.get_doc('Journal Entry', row.journal_entry_id)
                                            .then(journal => {
                                                if (journal.docstatus !== 1) {
                                                    all_journals_submitted = false;
                                                }
                                            });
                                    }
                                    return Promise.resolve();
                                });

                                Promise.all(journal_checks)
                                    .then(() => {
                                        if (all_journals_submitted) {
                                            // Update journal_status to Submitted
                                            update_journal_status_with_retry(frm, retry_count)
                                                .then(() => {
                                                    log_vehicle_misc_activity(frm, 'Journals Submitted', 'Success', 'Journals updated and submitted');
                                                    finalize_update(frm, true);
                                                })
                                                .catch(err => {
                                                    log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error updating journal status: ' + err.message);
                                                    frappe.msgprint({
                                                        title: __('Error'),
                                                        message: err.message || 'Error updating journal status',
                                                        indicator: 'red'
                                                    });
                                                });
                                        } else {
                                            log_vehicle_misc_activity(frm, 'Journals Submitted', 'Partial Success', 'Some journals were submitted');
                                            finalize_update(frm, true);
                                        }
                                    })
                                    .catch(err => {
                                        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error checking journal status: ' + err.message);
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: err.message || 'Error checking journal status',
                                            indicator: 'red'
                                        });
                                    });
                            })
                            .catch(err => {
                                if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                                    submit_journals_after_update(frm, misc_accounts, update_results, retry_count + 1);
                                } else {
                                    log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error submitting journals: ' + err.message);
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: err.message || 'Error submitting journals',
                                        indicator: 'red'
                                    });
                                }
                            });
                    } else {
                        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Failed to fetch company abbreviation');
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error fetching company abbreviation',
                            indicator: 'red'
                        });
                    }
                },
                error: function(err) {
                    if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                        submit_journals_after_update(frm, misc_accounts, update_results, retry_count + 1);
                    } else {
                        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'));
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                }
            });
        }).catch(err => {
            if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                submit_journals_after_update(frm, misc_accounts, update_results, retry_count + 1);
            } else {
                log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error refreshing document: ' + err.message);
                frappe.msgprint({
                    title: __('Error'),
                    message: 'Error refreshing document: ' + err.message,
                    indicator: 'red'
                });
            }
        });
    } catch (e) {
        if (retry_count < max_retries && e.message.includes('modified after you have opened it')) {
            submit_journals_after_update(frm, misc_accounts, update_results, retry_count + 1);
        } else {
            log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error submitting journals: ' + e.message);
            frappe.msgprint({
                title: __('Error'),
                message: 'Error submitting journals: ' + e.message,
                indicator: 'red'
            });
        }
    }
}

// Update journal status with retry logic
function update_journal_status_with_retry(frm, retry_count = 0) {
    const max_retries = 3;
    return new Promise((resolve, reject) => {
        try {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Vehicle Misc Sales',
                    name: frm.doc.name,
                    fieldname: { journal_status: 'Submitted' }
                },
                callback: function(r) {
                    if (!r.exc) {
                        resolve();
                    } else if (retry_count < max_retries && r.exc.includes('modified after you have opened it')) {
                        frm.reload_doc().then(() => {
                            update_journal_status_with_retry(frm, retry_count + 1)
                                .then(resolve)
                                .catch(reject);
                        });
                    } else {
                        reject(new Error(`Error updating journal_status: ${r.exc}`));
                    }
                },
                error: function(err) {
                    if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                        frm.reload_doc().then(() => {
                            update_journal_status_with_retry(frm, retry_count + 1)
                                .then(resolve)
                                .catch(reject);
                        });
                    } else {
                        reject(new Error(`Error updating journal_status: ${err.message || 'Unknown error'}`));
                    }
                }
            });
        } catch (e) {
            if (retry_count < max_retries && e.message.includes('modified after you have opened it')) {
                frm.reload_doc().then(() => {
                    update_journal_status_with_retry(frm, retry_count + 1)
                        .then(resolve)
                        .catch(reject);
                });
            } else {
                reject(new Error(`Error updating journal_status: ${e.message}`));
            }
        }
    });
}

// Save document with retry logic
function save_document_with_retry(frm, has_changes, callback, retry_count = 0) {
    const max_retries = 3;
    try {
        frappe.call({
            method: 'frappe.client.save',
            args: { doc: frm.doc },
            callback: function(r) {
                if (!r.exc) {
                    if (has_changes) {
                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Success', 'Misc accounts details updated');
                    }
                    callback();
                } else if (retry_count < max_retries && r.exc.includes('modified after you have opened it')) {
                    frm.reload_doc().then(() => {
                        frm.doc.misc_accounts = frm.doc.misc_accounts.map(row => ({
                            name: row.name,
                            misc_account: row.misc_account,
                            amount: row.amount,
                            journal_entry_id: row.journal_entry_id,
                            payment_status: row.payment_status
                        }));
                        save_document_with_retry(frm, has_changes, callback, retry_count + 1);
                    });
                } else {
                    log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Failed to update misc accounts: ' + (r.exc || 'Unknown error'));
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to save misc accounts: ') + (r.exc || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                if (retry_count < max_retries && err.message.includes('modified after you have opened it')) {
                    frm.reload_doc().then(() => {
                        frm.doc.misc_accounts = frm.doc.misc_accounts.map(row => ({
                            name: row.name,
                            misc_account: row.misc_account,
                            amount: row.amount,
                            journal_entry_id: row.journal_entry_id,
                            payment_status: row.payment_status
                        }));
                        save_document_with_retry(frm, has_changes, callback, retry_count + 1);
                    });
                } else {
                    log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error updating misc accounts: ' + (err.message || 'Unknown error'));
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error updating misc accounts: ') + (err.message || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            }
        });
    } catch (e) {
        if (retry_count < max_retries && e.message.includes('modified after you have opened it')) {
            frm.reload_doc().then(() => {
                frm.doc.misc_accounts = frm.doc.misc_accounts.map(row => ({
                    name: row.name,
                    misc_account: row.misc_account,
                    amount: row.amount,
                    journal_entry_id: row.journal_entry_id,
                    payment_status: row.payment_status
                }));
                save_document_with_retry(frm, has_changes, callback, retry_count + 1);
            });
        } else {
            log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error saving document: ' + e.message);
            frappe.msgprint({
                title: __('Error'),
                message: __('Error saving document: ') + e.message,
                indicator: 'red'
            });
        }
    }
}

// Update journal entry accounts
function update_journal_entry(frm, journal, amount, company_abbr) {
    try {
        let debtorAccount = journal.accounts.find(acc => 
            acc.account === `Debtors - ${company_abbr}` && 
            acc.debit_in_account_currency > 0
        );
        let incomeAccount = journal.accounts.find(acc => 
            acc.credit_in_account_currency > 0
        );

        if (debtorAccount && incomeAccount) {
            debtorAccount.debit_in_account_currency = amount;
            debtorAccount.debit = amount;
            incomeAccount.credit_in_account_currency = amount;
            incomeAccount.credit = amount;
        } else {
            journal.accounts = [
                {
                    account: `Debtors - ${company_abbr}`,
                    party_type: 'Customer',
                    party: frm.doc.customer,
                    debit_in_account_currency: amount,
                    debit: amount,
                    credit_in_account_currency: 0,
                    credit: 0,
                    cost_center: `Main - ${company_abbr}`
                },
                {
                    account: `Miscellaneous Income - ${company_abbr}`,
                    debit_in_account_currency: 0,
                    debit: 0,
                    credit_in_account_currency: amount,
                    credit: amount,
                    cost_center: `Main - ${company_abbr}`
                }
            ];
        }

        journal.total_debit = amount;
        journal.total_credit = amount;
        journal.total_amount = amount;
    } catch (e) {
        throw new Error('Error updating journal entry: ' + e.message);
    }
}

// Show payment dialog
function show_payment_dialog(frm) {
    try {
        let due_accounts = frm.doc.misc_accounts.filter(row => row.payment_status === 'Due');
        if (!due_accounts.length) {
            log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'No accounts with payment status Due.');
            frappe.msgprint({
                title: __('No Due Accounts'),
                message: __('There are no accounts with payment status Due.'),
                indicator: 'orange'
            });
            return;
        }

        let fields = [];
        due_accounts.forEach((row, index) => {
            fields.push({
                fieldtype: 'Section Break',
                label: __('Account') + ` ${index + 1}`
            });
            fields.push({
                fieldtype: 'Data',
                fieldname: `misc_account_${row.name}`,
                label: __('Account Name'),
                default: row.misc_account,
                read_only: 1
            });
            fields.push({
                fieldtype: 'Currency',
                fieldname: `amount_${row.name}`,
                label: __('Amount'),
                default: row.amount,
                read_only: 1
            });
            fields.push({
                fieldtype: 'Check',
                fieldname: `selected_${row.name}`,
                label: __('Select for Payment'),
                default: 0
            });
            fields.push({ fieldtype: 'Column Break' });
        });

        let dialog = new frappe.ui.Dialog({
            title: __('Make Payment for Misc Accounts'),
            fields: fields,
            primary_action_label: __('Proceed to Payment'),
            primary_action: function(values) {
                try {
                    let selected_accounts = due_accounts.filter(row => values[`selected_${row.name}`]);
                    if (!selected_accounts.length) {
                        log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'No accounts selected for payment.');
                        frappe.throw(__('Please select at least one account to proceed with payment.'));
                    }

                    let total_amount = selected_accounts.reduce((sum, row) => sum + row.amount, 0);
                    let account_names = selected_accounts.map(row => row.misc_account).join(', ');

                    frappe.call({
                        method: 'autowings_app.custom_scripts.utils.get_company_abbr',
                        callback: function(r) {
                            if (!r.exc && r.message) {
                                let company_abbr = r.message;
                                let checks = selected_accounts.map(row => {
                                    let paid_to_account = `${row.misc_account} Payable - ${company_abbr}`;
                                    return Promise.all([
                                        frappe.call({
                                            method: 'frappe.client.get_value',
                                            args: {
                                                doctype: 'Account',
                                                fieldname: 'name',
                                                filters: { name: paid_to_account }
                                            }
                                        }).then(r => ({
                                            valid: !r.exc && !!r.message.name,
                                            type: 'account',
                                            value: paid_to_account,
                                            row: row
                                        })),
                                        frappe.call({
                                            method: 'frappe.client.get_value',
                                            args: {
                                                doctype: 'Supplier',
                                                fieldname: 'name',
                                                filters: { name: row.misc_account }
                                            }
                                        }).then(r => ({
                                            valid: !r.exc && !!r.message.name,
                                            type: 'supplier',
                                            value: row.misc_account,
                                            row: row
                                        }))
                                    ]);
                                });

                                Promise.all(checks).then(results => {
                                    let flat_results = results.flat();
                                    let invalid_results = flat_results.filter(res => !res.valid);
                                    if (invalid_results.length) {
                                        let error_message = invalid_results.map(res => 
                                            res.type === 'account' ? `Account ${res.value}` : `Supplier ${res.value}`
                                        ).join(', ');
                                        log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', `Validation failed: ${error_message}`);
                                        frappe.msgprint({
                                            title: __('Validation Error'),
                                            message: __('The following do not exist: ') + error_message + __('. Please create them first.'),
                                            indicator: 'red'
                                        });
                                        return;
                                    }

                                    let first_account = selected_accounts[0];
                                    let paid_to_account = `${first_account.misc_account} Payable - ${company_abbr}`;
                                    let supplier = first_account.misc_account;

                                    let payment_entry_url = `/app/payment-entry/new-payment-entry?` +
                                        `payment_type=Pay&` +
                                        `party_type=Supplier&` +
                                        `party=${encodeURIComponent(supplier)}&` +
                                        `party_name=${encodeURIComponent(supplier)}&` +
                                        `paid_to=${encodeURIComponent(paid_to_account)}&` +
                                        `paid_amount=${total_amount}&` +
                                        `reference_doctype=Vehicle Misc Sales&` +
                                        `reference_name=${frm.doc.name}`;

                                    log_vehicle_misc_activity(frm, 'Payment Initiated', 'Success', `Payment initiated for ${account_names}`);
                                    frappe.msgprint({
                                        title: __('Success'),
                                        message: __('Redirecting to Payment Entry form.'),
                                        indicator: 'green'
                                    });

                                    window.location.href = payment_entry_url;
                                    dialog.hide();
                                });
                            } else {
                                log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'Failed to retrieve company abbreviation.');
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('Error retrieving company abbreviation: ') + (r.exc || JSON.stringify(r)),
                                    indicator: 'red'
                                });
                            }
                        },
                        error: function(err) {
                            log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'Failed to retrieve company abbreviation: ' + (err.message || JSON.stringify(err)));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error retrieving company abbreviation: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                        }
                    });
                } catch (e) {
                    log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'Error processing payment: ' + e.message);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error processing payment: ') + e.message,
                        indicator: 'red'
                    });
                    dialog.hide();
                }
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                dialog.hide();
            }
        });

        dialog.show();
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'Failed to create payment dialog: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Failed to create payment dialog: ') + e.message,
            indicator: 'red'
        });
    }
}

// Finalize update
function finalize_update(frm, has_changes) {
    try {
        frm.reload_doc();
        frappe.msgprint({
            title: has_changes ? __('Success') : __('No Changes'),
            message: has_changes ? __('Misc accounts and journals updated successfully.') : __('No changes were made to the misc accounts.'),
            indicator: has_changes ? 'green' : 'orange'
        });
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error finalizing update: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: 'Error finalizing update: ' + e.message,
            indicator: 'red'
        });
    }
}