frappe.ui.form.on('Vehicle Misc Sales', {
    refresh: function(frm) {
        console.log('Form refresh, checking misc_activity');
        // Add View Activities button if misc_activity has rows
        if (frm.doc.misc_activity && frm.doc.misc_activity.length > 0) {
            console.log('Adding View Activities button');
            frm.add_custom_button(__('View Activities'), function() {
                console.log('View Activities button clicked');
                try {
                    let dialog = new frappe.ui.Dialog({
                        title: __('Misc Activity Timeline'),
                        size: 'large',
                        fields: [
                            {
                                fieldtype: 'HTML',
                                fieldname: 'activity_timeline',
                                options: generate_activity_timeline(frm)
                            }
                        ],
                        primary_action_label: __('Close'),
                        primary_action: function() {
                            dialog.hide();
                        }
                    });

                    dialog.$wrapper.addClass('misc-activity-modal');
                    dialog.$wrapper.find('.modal-content').prepend(`
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                        <style>
                            .misc-activity-modal .modal-dialog {
                                max-width: 800px !important;
                                width: 90% !important;
                                margin: 30px auto !important;
                            }
                            .misc-activity-modal .modal-content {
                                border-radius: 8px;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            }
                            .misc-activity-modal .modal-body {
                                padding: 20px;
                                overflow-y: auto;
                                max-height: 70vh;
                                display: flex;
                                flex-direction: column;
                                gap: 1.5rem;
                            }
                            .timeline {
                                position: relative;
                                padding: 20px 0;
                                list-style: none;
                                width: 100%;
                            }
                            .timeline:before {
                                content: '';
                                position: absolute;
                                top: 0;
                                bottom: 0;
                                width: 4px;
                                background: #e9ecef;
                                left: 30px;
                                margin: 0;
                                border-radius: 2px;
                            }
                            .timeline-item {
                                position: relative;
                                margin-bottom: 40px;
                                padding-left: 60px;
                            }
                            .timeline-icon {
                                position: absolute;
                                left: 20px;
                                top: 50%;
                                transform: translateY(-50%);
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                border: none;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 1;
                                animation: pulse 1.5s ease-in-out infinite;
                                transition: transform 0.2s ease, box-shadow 0.2s ease;
                            }
                            .timeline-icon.status-error {
                                background-color: #d9534f;
                            }
                            .timeline-icon.status-success {
                                background-color: #5cb85c;
                            }
                            .timeline-icon.status-danger {
                                background-color: #f0ad4e;
                            }
                            .latest-activity .timeline-icon {
                                width: 24px;
                                height: 24px;
                                animation: strong-pulse 1.5s ease-in-out infinite;
                            }
                            .timeline-icon:hover {
                                transform: translateY(-50%) scale(1.2);
                                box-shadow: 0 0 8px rgba(0,0,0,0.3);
                            }
                            @keyframes pulse {
                                0% { transform: translateY(-50%) scale(1); }
                                50% { transform: translateY(-50%) scale(1.1); }
                                100% { transform: translateY(-50%) scale(1); }
                            }
                            @keyframes strong-pulse {
                                0% { transform: translateY(-50%) scale(1); }
                                50% { transform: translateY(-50%) scale(1.15); }
                                100% { transform: translateY(-50%) scale(1); }
                            }
                            .card {
                                background-color: #ffffff;
                                border-radius: 0.5rem;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                padding: 1.5rem;
                                width: 100%;
                                position: relative;
                                border-left: 4px solid;
                                transition: transform 0.2s ease, box-shadow 0.2s ease;
                            }
                            .card:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                            }
                            .card.status-success {
                                background-color: #f0fdf4;
                                border-left-color: #5cb85c;
                            }
                            .card.status-error {
                                background-color: #fef2f2;
                                border-left-color: #d9534f;
                            }
                            .card.status-danger {
                                background-color: #fff7ed;
                                border-left-color: #f0ad4e;
                            }
                            .card h2 {
                                font-size: 1.25rem;
                                font-weight: 600;
                                color: #1f2937;
                                margin-bottom: 0.5rem;
                                display: flex;
                                align-items: center;
                            }
                            .card h2 i {
                                margin-right: 0.5rem;
                            }
                            .card .info {
                                display: flex;
                                align-items: center;
                                margin-bottom: 0.5rem;
                            }
                            .card .info.remarks {
                                align-items: flex-start;
                                flex-wrap: nowrap;
                            }
                            .card .info.remarks i {
                                margin-top: 0.25rem;
                                flex-shrink: 0;
                            }
                            .card .info i {
                                margin-right: 0.5rem;
                                flex-shrink: 0;
                            }
                            .card .label {
                                color: #4b5563;
                                font-weight: 500;
                            }
                            .card .value {
                                margin-left: 0.5rem;
                                color: #374151;
                                flex: 1;
                            }
                            .card .status-success {
                                color: #5cb85c;
                            }
                            .card .status-error {
                                color: #d9534f;
                            }
                            .card .status-danger {
                                color: #f0ad4e;
                            }
                            .card .icon-success {
                                color: #5cb85c;
                            }
                            .card .icon-error {
                                color: #d9534f;
                            }
                            .card .icon-danger {
                                color: #f0ad4e;
                            }
                            .card .remarks p {
                                margin: 0;
                                color: #374151;
                                background-color: #fff3cd;
                                padding: 4px 8px;
                                border-radius: 3px;
                                display: inline-block;
                                word-break: break-word;
                                flex: 1;
                            }
                            .latest-activity .card {
                                border-left-width: 6px;
                            }
                            .progress-bar-container {
                                width: 100%;
                                margin-bottom: 1.5rem;
                                background-color: #ffffff;
                                border-radius: 0.5rem;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                padding: 1rem;
                            }
                            .progress-bar-container h2 {
                                font-size: 1.25rem;
                                font-weight: 600;
                                color: #1f2937;
                                margin-bottom: 0.5rem;
                                display: flex;
                                align-items: center;
                            }
                            .progress-bar-container h2 i {
                                margin-right: 0.5rem;
                                color: #5cb85c;
                            }
                            .progress-bar {
                                height: 20px;
                                background: #e9ecef;
                                border-radius: 10px;
                                overflow: hidden;
                                position: relative;
                            }
                            .progress-bar-fill {
                                height: 100%;
                                background: linear-gradient(90deg, #5cb85c, #7ed321);
                                width: 0;
                                animation: fill-progress 1.5s ease forwards;
                                position: relative;
                                overflow: hidden;
                            }
                            .progress-bar-fill::after {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 200%;
                                height: 100%;
                                background: linear-gradient(
                                    45deg,
                                    rgba(255,255,255,0.2) 25%,
                                    transparent 25%,
                                    transparent 50%,
                                    rgba(255,255,255,0.2) 50%,
                                    rgba(255,255,255,0.2) 75%,
                                    transparent 75%,
                                    transparent
                                );
                                background-size: 30px 30px;
                                animation: shimmer 2s linear infinite;
                            }
                            @keyframes fill-progress {
                                to { width: var(--progress-width); }
                            }
                            @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                            }
                        </style>
                    `);
                    dialog.show();
                } catch (e) {
                    console.error('Error opening activity dialog:', e);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to open activity timeline: ') + e.message,
                        indicator: 'red'
                    });
                }
            });
        }
    }
});

// Function to generate timeline HTML with progress bar
function generate_activity_timeline(frm) {
    console.log('Generating activity timeline');
    // Sort activities in descending order based on update_on
    let sorted_activities = frm.doc.misc_activity.slice().sort((a, b) => {
        return new Date(b.update_on) - new Date(a.update_on);
    });

    // Calculate progress percentage based on document status
    let progress_percentage = 0;
    switch (frm.doc.status) {
        case 'Due Update':
            progress_percentage = 25;
            break;
        case 'Due Payment':
            progress_percentage = 50;
            break;
        case 'Completed': // Assuming 'Completed' is a possible status
            progress_percentage = 100;
            break;
        default:
            progress_percentage = 0;
    }

    // Show progress bar with calculated percentage
    let progressBarHtml = `
        <div class="progress-bar-container">
            <h2><i class="fas fa-check-circle"></i> Progress: ${progress_percentage}%</h2>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="--progress-width: ${progress_percentage}%"></div>
            </div>
        </div>
    `;

    let html = `
        ${progressBarHtml}
        <ul class="timeline">
    `;

    sorted_activities.forEach((row, index) => {
        // Determine status class based on status value
        let status_class = 'status-danger';
        if (row.status.includes('Failed') || row.status.includes('Skipped')) {
            status_class = 'status-error';
        } else if ([
            'Updated Misc Accounts',
            'Journals Submitted',
            'Payment Initiated',
            'Payment Attempted'
        ].includes(row.status)) {
            status_class = 'status-success';
        }

        // Format update_on date
        let update_on = frappe.datetime.str_to_user(row.update_on);

        // Handle remarks
        let remarks = row.remarks ? `
            <div class="info remarks">
                <i class="fas fa-comment icon-${status_class}"></i>
                <span class="label">Remarks:</span>
                <div class="value">
                    <p>${frappe.utils.escape_html(row.remarks)}</p>
                </div>
            </div>
        ` : '';

        // Apply latest-activity class to the first row
        let row_class = index === 0 ? 'latest-activity' : '';

        html += `
            <li class="timeline-item ${status_class} ${row_class}">
                <div class="timeline-icon ${status_class}"></div>
                <div class="card ${status_class}">
                    <h2>
                        ${frappe.utils.escape_html(row.activity)}
                    </h2>
                    <div class="info">
                        <i class="fas fa-check-circle icon-${status_class}"></i>
                        <span class="label">Status:</span>
                        <span class="value ${status_class}">${frappe.utils.escape_html(row.status)}</span>
                    </div>
                    <div class="info">
                        <i class="fas fa-calendar-alt icon-${status_class}"></i>
                        <span class="label">Updated On:</span>
                        <span class="value">${update_on}</span>
                    </div>
                    <div class="info">
                        <i class="fas fa-user icon-${status_class}"></i>
                        <span class="label">Updated By:</span>
                        <span class="value">${frappe.utils.escape_html(row.user)}</span>
                    </div>
                    ${remarks}
                </div>
            </li>
        `;
    });

    html += '</ul>';
    return html;
}

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
        restrict_custom_buttons_by_role(frm);
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
                            log_vehicle_misc_activity(frm, 'Clear Workflow State', 'Failed', 'Failed to clear workflow state: ' + (r.exc || 'Unknown error'));
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

            // Add Make Payment button if status is 'Due Payment'
            if (frm.doc.status === 'Due Payment') {
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
            frm.set_intro(__('Status: ') + frm.doc.status, 'blue');
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
// function show_update_misc_dialog(frm) {
//     try {
//         let current_row_index = 0;
//         let misc_accounts = frm.doc.misc_accounts.map(row => ({
//             name: row.name,
//             misc_account: row.misc_account,
//             amount: row.amount,
//             journal_entry_id: row.journal_entry_id,
//             payment_status: row.payment_status || 'Due'
//         }));

//         function show_row_dialog() {
//             if (current_row_index >= misc_accounts.length) {
//                 frappe.confirm(
//                     __('Do you want to submit the journal entries? This action cannot be undone.'),
//                     function() {
//                         submit_journals(frm, misc_accounts);
//                     },
//                     function() {
//                         prompt_for_remarks(frm, misc_accounts);
//                     }
//                 );
//                 return;
//             }

//             let row = misc_accounts[current_row_index];
//             let dialog = new frappe.ui.Dialog({
//                 title: __('Update Misc Account') + ` (${current_row_index + 1}/${misc_accounts.length})`,
//                 fields: [
//                     {
//                         label: __('Account Name'),
//                         fieldname: 'misc_account',
//                         fieldtype: 'Data',
//                         default: row.misc_account,
//                         reqd: 1,
//                         read_only: 1
//                     },
//                     {
//                         label: __('Account Amount'),
//                         fieldname: 'amount',
//                         fieldtype: 'Currency',
//                         default: row.amount,
//                         reqd: 1
//                     }
//                 ],
//                 primary_action_label: current_row_index === misc_accounts.length - 1 ? __('Update & Finish') : __('Update & Next'),
//                 primary_action: function(values) {
//                     if (!values.misc_account) {
//                         frappe.throw(__('Account Name is mandatory.'));
//                     }
//                     if (!values.amount || values.amount <= 0) {
//                         frappe.throw(__('Account Amount must be greater than zero.'));
//                     }

//                     misc_accounts[current_row_index] = {
//                         ...row,
//                         misc_account: values.misc_account,
//                         amount: values.amount
//                     };

//                     current_row_index++;
//                     dialog.hide();
//                     show_row_dialog();
//                 },
//                 secondary_action_label: __('Cancel'),
//                 secondary_action: function() {
//                     dialog.hide();
//                 }
//             });
//             dialog.show();
//         }

//         show_row_dialog();
//     } catch (e) {
//         log_vehicle_misc_activity(frm, 'Update Misc Accounts', 'Failed', 'Failed to create dialog: ' + e.message);
//         frappe.msgprint({
//             title: __('Error'),
//             message: __('Failed to create dialog: ') + e.message,
//             indicator: 'red'
//         });
//     }
// }

// // Initiate journal submission
// function submit_journals(frm, misc_accounts) {
//     try {
//         update_document_and_journals(frm, misc_accounts, true);
//     } catch (e) {
//         log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error initiating journal submission: ' + e.message);
//         frappe.msgprint({
//             title: __('Error'),
//             message: __('Error initiating journal submission: ') + e.message,
//             indicator: 'red'
//         });
//     }
// }
function show_update_misc_dialog(frm) {
    try {
        // Prepare misc_accounts data
        let misc_accounts = frm.doc.misc_accounts.map(row => ({
            name: row.name,
            misc_account: row.misc_account,
            amount: row.amount,
            journal_entry_id: row.journal_entry_id,
            payment_status: row.payment_status || 'Due',
            confirmed: 0 // Default checkbox to unchecked
        }));

        // Handle empty misc_accounts
        if (!misc_accounts.length) {
            frappe.msgprint({
                title: __('No Accounts'),
                message: __('No misc accounts to update.'),
                indicator: 'orange'
            });
            return;
        }

        // Create dialog fields dynamically
        let fields = [];
        misc_accounts.forEach((row, index) => {
            // Add section header for each account
            fields.push({
                fieldtype: 'Section Break',
                label: __('Account') + ` ${index + 1}`
            });
            // Read-only misc_account
            fields.push({
                label: __('Account Name'),
                fieldname: `misc_account_${index}`,
                fieldtype: 'Data',
                default: row.misc_account,
                reqd: 1,
                read_only: 1
            });
            // Editable amount
            fields.push({
                label: __('Account Amount'),
                fieldname: `amount_${index}`,
                fieldtype: 'Currency',
                default: row.amount,
                reqd: 1
            });
            // Confirmed checkbox
            fields.push({
                label: __('Confirmed'),
                fieldname: `confirmed_${index}`,
                fieldtype: 'Check',
                default: 0
            });
            // Column break for layout (optional, for better spacing)
            fields.push({
                fieldtype: 'Column Break'
            });
        });

        // Create dialog
        let dialog = new frappe.ui.Dialog({
            title: __('Update Misc Accounts'),
            fields: fields,
            primary_action_label: __('Update & Submit'),
            primary_action: function(values) {
                // Validate and collect updated data
                let updated_accounts = misc_accounts.map((row, index) => {
                    let amount = values[`amount_${index}`];
                    let confirmed = values[`confirmed_${index}`];

                    // Validate fields
                    if (!values[`misc_account_${index}`]) {
                        frappe.throw(__('Account Name is mandatory for all accounts.'));
                    }
                    if (!amount || amount <= 0) {
                        frappe.throw(__('Account Amount must be greater than zero for all accounts.'));
                    }
                    if (confirmed === undefined) {
                        frappe.throw(__('Please confirm the amount for all accounts.'));
                    }
                    return {
                        misc_account: row.misc_account,
                        amount: amount,
                        journal_entry_id: row.journal_entry_id,
                        payment_status: row.payment_status || 'Due',
                        confirmed: confirmed
                    };
                });

                // Check if all confirmed checkboxes are checked
                if (!updated_accounts.every(row => row.confirmed)) {
                    frappe.msgprint({
                        title: __('Validation Error'),
                        message: __('Please confirm the amount for all accounts before submitting.'),
                        indicator: 'red'
                    });
                    return;
                }

                // Confirm submission
                frappe.confirm(
                    __('Do you want to submit the journal entries? This action cannot be undone.'),
                    function() {
                        dialog.hide();
                        submit_journals(frm, updated_accounts);
                    },
                    function() {
                        prompt_for_remarks(frm, updated_accounts);
                    }
                );
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                dialog.hide();
            }
        });

        dialog.show();
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Update Misc Accounts', 'Failed', 'Failed to create dialog: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Failed to create dialog: ') + e.message,
            indicator: 'red'
        });
    }
}

// Initiate journal submission (unchanged)
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
                payment_status: row.payment_status || 'Due'
            }));

            // Update parent status and journal_status only if not submitting journals
            if (!submit_journals) {
                frm.doc.status = 'Due Update';
                frm.doc.journal_status = frm.doc.journal_status || 'Draft';
                frm.doc.workflow_state = '';
            }

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
                                                            return { journal_id: row.journal_entry_id, name: row.name, skipped: true, reason: `Journal Entry ${row.journal_entry_id} is not in Draft status` };
                                                        }
                                                        update_journal_entry(frm, journal, row.amount, company_abbr);
                                                        return frappe.call({
                                                            method: 'frappe.client.save',
                                                            args: { doc: journal }
                                                        }).then(() => ({ journal_id: row.journal_entry_id, name: row.name, skipped: false }));
                                                    })
                                                    .catch(err => {
                                                        return { journal_id: row.journal_entry_id, name: row.name, skipped: true, reason: `Error updating journal ${row.journal_entry_id}: ${err.message}` };
                                                    });
                                            }
                                            return Promise.resolve({ journal_id: null, name: row.name, skipped: true, reason: 'No journal entry or already processed' });
                                        });

                                        Promise.all(promises)
                                            .then(results => {
                                                // Log skipped journals
                                                results.forEach(result => {
                                                    if (result.skipped && result.journal_id) {
                                                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Skipped', result.reason);
                                                    }
                                                });

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
                                                log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error processing journals: ' + err.message);
                                                frappe.msgprint({
                                                    title: __('Error'),
                                                    message: 'Error processing journals: ' + err.message,
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
            }, misc_accounts);
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

// Submit journals after updating
function submit_journals_after_update(frm, misc_accounts, update_results) {
    try {
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.get_company_abbr',
            callback: function(r) {
                if (!r.exc && r.message) {
                    let company_abbr = r.message;
                    let promises = misc_accounts.map(row => {
                        let update_result = update_results.find(res => res.name === row.name && res.journal_id === row.journal_entry_id);
                        if (row.journal_entry_id && frm.doc.journal_status === 'Draft' && update_result && !update_result.skipped) {
                            return frappe.db.get_doc('Journal Entry', row.journal_entry_id)
                                .then(journal => {
                                    if (journal.docstatus !== 0) {
                                        return { journal_id: row.journal_entry_id, name: row.name, submitted: false, reason: `Journal Entry ${row.journal_entry_id} is not in Draft status` };
                                    }
                                    return frappe.call({
                                        method: 'frappe.client.submit',
                                        args: { doc: journal }
                                    }).then(() => ({ journal_id: row.journal_entry_id, name: row.name, submitted: true }));
                                })
                                .catch(err => {
                                    return { journal_id: row.journal_entry_id, name: row.name, submitted: false, reason: `Error submitting journal ${row.journal_entry_id}: ${err.message}` };
                                });
                        }
                        return Promise.resolve({ journal_id: row.journal_entry_id, name: row.name, submitted: false, reason: 'No journal entry or already processed' });
                    });

                    Promise.all(promises)
                        .then(results => {
                            let all_submitted = results.every(result => !result.journal_id || result.submitted);
                            let failed_journals = results.filter(result => result.journal_id && !result.submitted);

                            // Log failed submissions
                            failed_journals.forEach(result => {
                                log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', result.reason);
                            });

                            if (all_submitted && results.some(result => result.submitted)) {
                                // Refresh document to avoid TimestampMismatchError
                                frm.reload_doc().then(() => {
                                    // Update document status and journal_status
                                    frm.doc.status = 'Due Payment';
                                    frm.doc.journal_status = 'Submitted';
                                    save_document_with_retry(frm, true, () => {
                                        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Success', 'All journals updated and submitted successfully');
                                        finalize_update(frm, true);
                                    }, misc_accounts);
                                }).catch(err => {
                                    log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Failed to refresh document for status update: ' + err.message);
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: 'Failed to refresh document for status update: ' + err.message,
                                        indicator: 'red'
                                    });
                                    finalize_update(frm, true);
                                });
                            } else {
                                // Log partial success or failure
                                log_vehicle_misc_activity(frm, 'Journals Submitted', all_submitted ? 'Success' : 'Partial Success', all_submitted ? 'All journals processed' : 'Some journals failed to submit');
                                finalize_update(frm, true);
                            }
                        })
                        .catch(err => {
                            log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error processing journal submissions: ' + err.message);
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error processing journal submissions: ' + err.message,
                                indicator: 'red'
                            });
                            finalize_update(frm, true);
                        });
                } else {
                    log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Failed to fetch company abbreviation');
                    frappe.msgprint({
                        title: __('Error'),
                        message: 'Error fetching company abbreviation',
                        indicator: 'red'
                    });
                    finalize_update(frm, true);
                }
            },
            error: function(err) {
                log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'));
                frappe.msgprint({
                    title: __('Error'),
                    message: 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'),
                    indicator: 'red'
                });
                finalize_update(frm, true);
            }
        });
    } catch (e) {
        log_vehicle_misc_activity(frm, 'Journals Submitted', 'Failed', 'Error submitting journals: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: 'Error submitting journals: ' + e.message,
            indicator: 'red'
        });
        finalize_update(frm, true);
    }
}

// Save document with retry logic
function save_document_with_retry(frm, has_changes, callback, misc_accounts, retry_count = 0) {
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
                        // Reapply misc_accounts to ensure consistency
                        frm.doc.misc_accounts = misc_accounts.map(row => ({
                            name: row.name,
                            misc_account: row.misc_account,
                            amount: row.amount,
                            journal_entry_id: row.journal_entry_id,
                            payment_status: row.payment_status || 'Due'
                        }));
                        save_document_with_retry(frm, has_changes, callback, misc_accounts, retry_count + 1);
                    }).catch(err => {
                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error refreshing document on retry: ' + err.message);
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error refreshing document on retry: ' + err.message,
                            indicator: 'red'
                        });
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
                        // Reapply misc_accounts to ensure consistency
                        frm.doc.misc_accounts = misc_accounts.map(row => ({
                            name: row.name,
                            misc_account: row.misc_account,
                            amount: row.amount,
                            journal_entry_id: row.journal_entry_id,
                            payment_status: row.payment_status || 'Due'
                        }));
                        save_document_with_retry(frm, has_changes, callback, misc_accounts, retry_count + 1);
                    }).catch(err => {
                        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error refreshing document on retry: ' + err.message);
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error refreshing document on retry: ' + err.message,
                            indicator: 'red'
                        });
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
        log_vehicle_misc_activity(frm, 'Updated Misc Accounts', 'Failed', 'Error saving document: ' + e.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Error saving document: ') + e.message,
            indicator: 'red'
        });
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

// Show payment dialog with single checkbox selection
function show_payment_dialog(frm) {
    try {
        let due_accounts = frm.doc.misc_accounts.filter(row => row.payment_status === 'Due' || row.payment_status === '' || row.payment_status === 'Pending');
        if (!due_accounts.length) {
            log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'No accounts with payment status Due, Pending, or empty.');
            frappe.msgprint({
                title: __('No Due Accounts'),
                message: __('There are no accounts with payment status Due, Pending, or empty.'),
                indicator: 'orange'
            });
            return;
        }

        let fields = [];
        let checkbox_fieldnames = [];
        due_accounts.forEach((row, index) => {
            let checkbox_fieldname = `selected_${row.name}`;
            checkbox_fieldnames.push(checkbox_fieldname);
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
                fieldname: checkbox_fieldname,
                label: __('Select for Payment'),
                default: 0,
                onchange: function() {
                    let current_value = this.get_value();
                    if (current_value) {
                        checkbox_fieldnames.forEach(fieldname => {
                            if (fieldname !== checkbox_fieldname) {
                                dialog.set_value(fieldname, 0);
                            }
                        });
                    }
                }
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
                    if (selected_accounts.length !== 1) {
                        log_vehicle_misc_activity(frm, 'Payment Attempted', 'Failed', 'Exactly one account must be selected for payment.');
                        frappe.throw(__('Please select exactly one account to proceed with payment.'));
                    }

                    let selected_account = selected_accounts[0];
                    let total_amount = selected_account.amount;
                    let account_names = selected_account.misc_account;

                    frappe.call({
                        method: 'autowings_app.custom_scripts.utils.get_company_abbr',
                        callback: function(r) {
                            if (!r.exc && r.message) {
                                let company_abbr = r.message;
                                let paid_to_account = `${selected_account.misc_account} Payable - ${company_abbr}`;
                                let supplier = selected_account.misc_account;

                                Promise.all([
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
                                        value: paid_to_account
                                    })),
                                    frappe.call({
                                        method: 'frappe.client.get_value',
                                        args: {
                                            doctype: 'Supplier',
                                            fieldname: 'name',
                                            filters: { name: supplier }
                                        }
                                    }).then(r => ({
                                        valid: !r.exc && !!r.message.name,
                                        type: 'supplier',
                                        value: supplier
                                    }))
                                ]).then(results => {
                                    let invalid_results = results.filter(res => !res.valid);
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
        frm.reload_doc().then(() => {
            frappe.msgprint({
                title: has_changes ? __('Success') : __('No Changes'),
                message: has_changes ? __('Misc accounts and journals updated successfully.') : __('No changes were made to the misc accounts.'),
                indicator: has_changes ? 'green' : 'orange'
            });
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


// role based custom button
// Function to restrict custom buttons based on roles
function restrict_custom_buttons_by_role(frm) {
    // Store the original add_custom_button method
    const original_add_custom_button = frm.add_custom_button;

    // Override add_custom_button
    frm.add_custom_button = function(label, callback, group) {
        // Check role-based visibility
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.can_show_button',
            args: {
                link_doc: frm.doc.doctype,
                button_name: label
            },
            callback: function(r) {
                if (r.message) {
                    // User is authorized; call the original method
                    original_add_custom_button.call(frm, label, callback, group);
                }
            },
            error: function(err) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error checking button visibility for ') + label + ': ' + err.message,
                    indicator: 'red'
                });
            }
        });
    };
}



frappe.ui.form.on("Vehicle Misc Sales", {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        frm.add_custom_button(__("Cancel Journal Entry"), function() {
            // Prompt for confirmation
            frappe.confirm(
                __("Are you sure you want to cancel or delete the linked Journal Entries?"),
                function() {
                    // Proceed with the server-side call if confirmed
                    frappe.call({
                        method: "autowings_app.custom_scripts.vehicle_sales_journal_cancel.cancel_journal_entry_misc_sales",
                        args: {
                            doc: frm.doc
                        },
                        callback: function(r) {
                            if (r.message) {
                                frm.reload_doc();
                            }
                        }
                    });
                },
                function() {
                    // Do nothing if the user cancels the prompt
                    frappe.msgprint(__("Action aborted."));
                }
            );
        }, __("Actions"));
    }
});