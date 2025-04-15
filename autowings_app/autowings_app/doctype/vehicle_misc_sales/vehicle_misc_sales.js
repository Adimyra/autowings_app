// frappe.ui.form.on('Vehicle Misc Sales', {
//     refresh: function(frm) {
//         // Add custom button "Update Journals"
//         frm.add_custom_button(__('Update Journals'), function() {
//             trigger_update_journals(frm);
//         });
//     }
// });

frappe.ui.form.on('Vehicle Misc Sales', {
    refresh: function(frm) {
        // Add custom button "Update Journals"
        frm.add_custom_button(__('Update Journals'), function() {
            trigger_update_journals(frm);
        }).addClass('btn-update-journals');
    }
});

// Function to trigger the update journals process
function trigger_update_journals(frm) {
    // Fetch journal statuses and build modal fields
    let fields = [];
    let promises = frm.doc.misc_accounts.map(row => {
        return frappe.db.get_value('Journal Entry', row.journal_entry_id, 'docstatus')
            .then(r => {
                return { row, docstatus: r.message.docstatus };
            });
    });

    Promise.all(promises).then(results => {
        results.forEach(({ row, docstatus }, idx) => {
            fields.push(
                {
                    label: __('Misc Account'),
                    fieldname: `misc_account_${idx}`,
                    fieldtype: 'Data',
                    default: row.misc_account,
                    read_only: 1
                },
                {
                    label: __('Amount'),
                    fieldname: `amount_${idx}`,
                    fieldtype: 'Currency',
                    default: row.amount,
                    reqd: 1
                },
                {
                    label: docstatus === 1 ? __('Status') : __('Submit'),
                    fieldname: docstatus === 1 ? `status_${idx}` : `submit_${idx}`,
                    fieldtype: docstatus === 1 ? 'Data' : 'Check',
                    default: docstatus === 1 ? 'Submitted' : 0,
                    read_only: docstatus === 1 ? 1 : 0,
                    options: docstatus === 1 ? { color: 'green' } : undefined
                },
                {
                    fieldtype: 'Section Break',
                    fieldname: `section_break_${idx}`
                }
            );
        });

        let d = new frappe.ui.Dialog({
            title: __('Update Misc Accounts'),
            fields: fields,
            primary_action_label: __('Update and Submit'),
            primary_action: function(values) {
                // Confirm before updating
                frappe.confirm(
                    __('Are you sure you want to update the journal entries with the new amounts?'),
                    function() {
                        // Update Vehicle Misc Sales and Journals
                        update_misc_sales_and_journals(frm, values, results, d);
                    },
                    function() {
                        // User cancelled
                        frappe.msgprint(__('Update cancelled.'));
                        d.hide();
                    }
                );
            }
        });
        d.show();
    }).catch(err => {
        frappe.msgprint(__('Error fetching journal statuses: ') + err.message);
    });
}

// Function to update Vehicle Misc Sales and Journal Entries
function update_misc_sales_and_journals(frm, values, results, dialog) {
    let updates = [];
    frm.doc.misc_accounts.forEach((row, idx) => {
        let new_amount = values[`amount_${idx}`];
        let submit_checked = values[`submit_${idx}`] || false;
        let docstatus = results[idx].docstatus;
        if ((new_amount !== row.amount && new_amount !== undefined) || (docstatus === 0 && submit_checked)) {
            updates.push({
                row_idx: idx,
                misc_account: row.misc_account,
                journal_entry_id: row.journal_entry_id,
                new_amount: new_amount !== undefined ? new_amount : row.amount,
                submit: docstatus === 0 && submit_checked
            });
        }
    });

    if (updates.length === 0) {
        frappe.msgprint(__('No changes detected in amounts or submit selections.'));
        dialog.hide();
        return;
    }

    // Process updates sequentially
    process_updates(frm, updates, 0, dialog);
}

// Function to process updates one by one
function process_updates(frm, updates, index, dialog) {
    if (index >= updates.length) {
        dialog.hide();
        frappe.msgprint({
            title: __('Journals Submitted'),
            message: __('Journals submitted'),
            indicator: 'green'
        });
        frm.refresh();
        return;
    }

    let update = updates[index];
    // Update misc_accounts child table if amount changed
    let amount_promise = update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount
        ? frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'Misc Journal vsm',
                name: frm.doc.misc_accounts[update.row_idx].name,
                fieldname: 'amount',
                value: update.new_amount
            }
        })
        : Promise.resolve();

    amount_promise.then(() => {
        // Fetch journal entry
        frappe.db.get_doc('Journal Entry', update.journal_entry_id)
            .then(journal => {
                if (journal.docstatus === 0) {
                    // Draft journal: Update and submit if needed
                    update_draft_journal(frm, journal, update, dialog, () => {
                        process_updates(frm, updates, index + 1, dialog);
                    });
                } else if (journal.docstatus === 1 && update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount) {
                    // Submitted journal: Prompt for cancellation and amendment
                    frappe.confirm(
                        __('Journal {0} already submitted. Do you want to update still? Then you have to cancel this journal. Do you want to cancel and amend new Journal?').replace('{0}', update.journal_entry_id),
                        function() {
                            // Cancel and amend journal
                            cancel_and_amend_journal(frm, journal, update, dialog, () => {
                                process_updates(frm, updates, index + 1, dialog);
                            });
                        },
                        function() {
                            // Skip this journal and continue
                            process_updates(frm, updates, index + 1, dialog);
                        }
                    );
                } else if (journal.docstatus === 2) {
                    frappe.msgprint(__('Cannot update cancelled journal entry {0}.').replace('{0}', update.journal_entry_id));
                    process_updates(frm, updates, index + 1, dialog);
                } else {
                    // No action needed (e.g., submitted journal with no amount change)
                    process_updates(frm, updates, index + 1, dialog);
                }
            })
            .catch(err => {
                frappe.msgprint(__('Error fetching journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
                process_updates(frm, updates, index + 1, dialog);
            });
    }).catch(err => {
        frappe.msgprint(__('Error updating amount for {0}: ').replace('{0}', update.misc_account) + err.message);
        process_updates(frm, updates, index + 1, dialog);
    });
}

// Function to update and submit draft journal entry
function update_draft_journal(frm, journal, update, dialog, callback) {
    let needs_update = update.new_amount !== frm.doc.misc_accounts[update.row_idx].amount;
    if (!needs_update && !update.submit) {
        callback();
        return;
    }

    // Update journal entry accounts if amount changed
    if (needs_update) {
        journal.accounts = journal.accounts.map(account => {
            let updated_account = { ...account };
            if (updated_account.account === 'Debtors - A') {
                if (updated_account.debit_in_account_currency > 0) {
                    updated_account.debit_in_account_currency = update.new_amount;
                    updated_account.debit = update.new_amount;
                }
            } else if (updated_account.account === `${update.misc_account} Payable - A`) {
                if (updated_account.credit_in_account_currency > 0) {
                    updated_account.credit_in_account_currency = update.new_amount;
                    updated_account.credit = update.new_amount;
                }
            }
            return updated_account;
        });

        journal.total_debit = update.new_amount;
        journal.total_credit = update.new_amount;
        journal.total_amount = update.new_amount;
    }

    // Save updated journal
    let save_promise = needs_update
        ? frappe.call({
            method: 'frappe.client.save',
            args: {
                doc: journal
            }
        })
        : Promise.resolve({ message: journal });

    save_promise.then(r => {
        let journal_to_submit = r.message || journal;
        // Submit journal entry if checked or amount changed
        if (update.submit || needs_update) {
            frappe.call({
                method: 'frappe.client.submit',
                args: {
                    doc: journal_to_submit
                },
                callback: function(r) {
                    callback();
                },
                error: function(err) {
                    frappe.msgprint(__('Error submitting journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
                    callback();
                }
            });
        } else {
            callback();
        }
    }).catch(err => {
        frappe.msgprint(__('Error updating journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
        callback();
    });
}

// Function to cancel and amend submitted journal entry
function cancel_and_amend_journal(frm, journal, update, dialog, callback) {
    // Cancel the journal entry
    frappe.call({
        method: 'frappe.client.cancel',
        args: {
            doctype: 'Journal Entry',
            name: journal.name
        },
        callback: function(r) {
            // Create amended journal by copying the original
            let amended_journal = { ...journal };
            // Reset fields for new document
            amended_journal.name = undefined;
            amended_journal.creation = undefined;
            amended_journal.modified = undefined;
            amended_journal.modified_by = undefined;
            amended_journal.docstatus = 0;
            amended_journal.amended_from = journal.name;
            // Update amounts
            amended_journal.total_debit = update.new_amount;
            amended_journal.total_credit = update.new_amount;
            amended_journal.total_amount = update.new_amount;
            amended_journal.accounts = amended_journal.accounts.map(account => {
                let updated_account = { ...account };
                updated_account.name = undefined;
                updated_account.creation = undefined;
                updated_account.modified = undefined;
                updated_account.modified_by = undefined;
                updated_account.docstatus = 0;
                if (updated_account.account === 'Debtors - A') {
                    if (updated_account.debit_in_account_currency > 0) {
                        updated_account.debit_in_account_currency = update.new_amount;
                        updated_account.debit = update.new_amount;
                    }
                } else if (updated_account.account === `${update.misc_account} Payable - A`) {
                    if (updated_account.credit_in_account_currency > 0) {
                        updated_account.credit_in_account_currency = update.new_amount;
                        updated_account.credit = update.new_amount;
                    }
                }
                return updated_account;
            });

            // Save amended journal
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: amended_journal
                },
                callback: function(r) {
                    let new_journal = r.message;
                    // Submit amended journal
                    frappe.call({
                        method: 'frappe.client.submit',
                        args: {
                            doc: new_journal
                        },
                        callback: function(r) {
                            // Update journal_entry_id in misc_accounts
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Misc Journal vsm',
                                    name: frm.doc.misc_accounts[update.row_idx].name,
                                    fieldname: 'journal_entry_id',
                                    value: new_journal.name
                                },
                                callback: function(r) {
                                    callback();
                                },
                                error: function(err) {
                                    frappe.msgprint(__('Error updating journal_entry_id for {0}: ').replace('{0}', update.misc_account) + err.message);
                                    callback();
                                }
                            });
                        },
                        error: function(err) {
                            frappe.msgprint(__('Error submitting amended journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
                            callback();
                        }
                    });
                },
                error: function(err) {
                    frappe.msgprint(__('Error creating amended journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
                    callback();
                }
            });
        },
        error: function(err) {
            frappe.msgprint(__('Error cancelling journal entry {0}: ').replace('{0}', update.journal_entry_id) + err.message);
            callback();
        }
    });
}