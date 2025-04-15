frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {
        // Add custom button "Update Journal"
        frm.add_custom_button(__('Update Journal'), function() {
            trigger_update_journal(frm);
        }).addClass('btn-update-journals');
    },
    
    registration_charge: function(frm) {
        // Trigger update journal when registration_charge field changes
        if (frm.doc.registration_charge && frm.doc.journal_entry_id) {
            trigger_update_journal(frm);
        }
    }
});

// Function to trigger the update journal process
function trigger_update_journal(frm) {
    // Create a dialog modal for final registration charge
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
        primary_action_label: __('Update and Submit'),
        primary_action: function(values) {
            // Confirm before updating
            frappe.confirm(
                __('Are you sure you want to update the journal entry with the new registration charge?'),
                function() {
                    // Update RTO Registration and Journal Entry
                    update_rto_and_journal(frm, values.final_registration_charge, d);
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
}

// Function to update RTO Registration and Journal Entry
function update_rto_and_journal(frm, new_charge, dialog) {
    // Update RTO Registration charge
    frappe.call({
        method: 'frappe.client.set_value',
        args: {
            doctype: 'RTO Registration',
            name: frm.doc.name,
            fieldname: 'registration_charge',
            value: new_charge
        },
        callback: function(r) {
            // Fetch journal entry
            frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                .then(journal => {
                    if (journal.docstatus === 0) {
                        // Draft journal: Update and submit
                        update_draft_journal(frm, journal, new_charge, dialog);
                    } else if (journal.docstatus === 1) {
                        // Submitted journal: Prompt for cancellation and amendment
                        frappe.confirm(
                            __('Journal already submitted. Do you want to update still? Then you have to cancel this journal. Do you want to cancel and amend new Journal?'),
                            function() {
                                // Cancel and amend journal
                                cancel_and_amend_journal(frm, journal, new_charge, dialog);
                            },
                            function() {
                                // User cancelled
                                frappe.msgprint(__('Update cancelled.'));
                                dialog.hide();
                            }
                        );
                    } else {
                        // Cancelled journal
                        frappe.msgprint(__('Cannot update a cancelled journal entry.'));
                        dialog.hide();
                    }
                })
                .catch(err => {
                    frappe.msgprint(__('Error fetching journal entry: ') + err.message);
                    dialog.hide();
                });
        },
        error: function(err) {
            frappe.msgprint(__('Error updating registration charge: ') + err.message);
            dialog.hide();
        }
    });
}

// Function to update and submit draft journal entry
function update_draft_journal(frm, journal, new_charge, dialog) {
    // Update journal entry accounts
    let accounts = journal.accounts.map(account => {
        let updated_account = { ...account };
        if (updated_account.account === 'Debtors - A') {
            if (updated_account.debit_in_account_currency > 0) {
                updated_account.debit_in_account_currency = new_charge;
                updated_account.debit = new_charge;
            }
        } else if (updated_account.account === 'RTO Charges Payable - A') {
            if (updated_account.credit_in_account_currency > 0) {
                updated_account.credit_in_account_currency = new_charge;
                updated_account.credit = new_charge;
            }
        }
        return updated_account;
    });

    // Update journal fields
    journal.total_debit = new_charge;
    journal.total_credit = new_charge;
    journal.total_amount = new_charge;
    journal.accounts = accounts;

    // Save updated journal
    frappe.call({
        method: 'frappe.client.save',
        args: {
            doc: journal
        },
        callback: function(r) {
            // Submit journal entry
            frappe.call({
                method: 'frappe.client.submit',
                args: {
                    doc: r.message
                },
                callback: function(r) {
                    dialog.hide();
                    frappe.msgprint({
                        title: __('Journal Submitted'),
                        message: __('Journal submitted'),
                        indicator: 'green'
                    });
                    frm.refresh();
                },
                error: function(err) {
                    frappe.msgprint(__('Error submitting journal entry: ') + err.message);
                    dialog.hide();
                }
            });
        },
        error: function(err) {
            frappe.msgprint(__('Error updating journal entry: ') + err.message);
            dialog.hide();
        }
    });
}

// Function to cancel and amend submitted journal entry
function cancel_and_amend_journal(frm, journal, new_charge, dialog) {
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
            amended_journal.total_debit = new_charge;
            amended_journal.total_credit = new_charge;
            amended_journal.total_amount = new_charge;
            amended_journal.accounts = amended_journal.accounts.map(account => {
                let updated_account = { ...account };
                updated_account.name = undefined;
                updated_account.creation = undefined;
                updated_account.modified = undefined;
                updated_account.modified_by = undefined;
                updated_account.docstatus = 0;
                if (updated_account.account === 'Debtors - A') {
                    if (updated_account.debit_in_account_currency > 0) {
                        updated_account.debit_in_account_currency = new_charge;
                        updated_account.debit = new_charge;
                    }
                } else if (updated_account.account === 'RTO Charges Payable - A') {
                    if (updated_account.credit_in_account_currency > 0) {
                        updated_account.credit_in_account_currency = new_charge;
                        updated_account.credit = new_charge;
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
                            // Update journal_entry_id in RTO Registration
                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'RTO Registration',
                                    name: frm.doc.name,
                                    fieldname: 'journal_entry_id',
                                    value: new_journal.name
                                },
                                callback: function(r) {
                                    dialog.hide();
                                    frappe.msgprint({
                                        title: __('Journal Submitted'),
                                        message: __('Journal submitted'),
                                        indicator: 'green'
                                    });
                                    frm.refresh();
                                },
                                error: function(err) {
                                    frappe.msgprint(__('Error updating journal_entry_id: ') + err.message);
                                    dialog.hide();
                                }
                            });
                        },
                        error: function(err) {
                            frappe.msgprint(__('Error submitting amended journal entry: ') + err.message);
                            dialog.hide();
                        }
                    });
                },
                error: function(err) {
                    frappe.msgprint(__('Error creating amended journal entry: ') + err.message);
                    dialog.hide();
                }
            });
        },
        error: function(err) {
            frappe.msgprint(__('Error cancelling journal entry: ') + err.message);
            dialog.hide();
        }
    });
}