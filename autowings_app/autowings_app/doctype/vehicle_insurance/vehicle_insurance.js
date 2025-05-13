// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('Vehicle Insurance', {
    refresh: function(frm) {
        console.log('Form refresh, checking insurance_activity');
        // Add View Activities button if insurance_activity has rows
        if (frm.doc.insurance_activity && frm.doc.insurance_activity.length > 0) {
            console.log('Adding View Activities button');
            frm.add_custom_button(__('View Activities'), function() {
                console.log('View Activities button clicked');
                try {
                    let dialog = new frappe.ui.Dialog({
                        title: __('Insurance Activity Timeline'),
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

                    dialog.$wrapper.addClass('insurance-activity-modal');
                    dialog.$wrapper.find('.modal-content').prepend(`
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                        <style>
                            .insurance-activity-modal .modal-dialog {
                                max-width: 800px !important;
                                width: 90% !important;
                                margin: 30px auto !important;
                            }
                            .insurance-activity-modal .modal-content {
                                border-radius: 8px;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            }
                            .insurance-activity-modal .modal-body {
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
    let sorted_activities = frm.doc.insurance_activity.slice().sort((a, b) => {
        return new Date(b.update_on) - new Date(a.update_on);
    });

    // Calculate progress percentage based on document status
    let progress_percentage = 0;
    switch (frm.doc.status) {
        case 'Due Update':
            progress_percentage = 20;
            break;
        case 'Due Verification':
            progress_percentage = 50;
            break;
        case 'Payment Due':
            progress_percentage = 80;
            break;
        case 'Completed':
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
            'Insurance Details Updated',
            'Insurance Verified',
            'Journal Updated',
            'Payment Recorded',
            'Process Completed'
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

// frappe.ui.form.on("Vehicle Insurance", {
// 	refresh(frm) {

// 	},
// });

// frappe.ui.form.on('Vehicle Insurance', {
//     refresh: function(frm) {
//         // Add custom button "Update Journal"
//         frm.add_custom_button(__('Update Journal'), function() {
//             trigger_update_journal(frm);
//         }).addClass('btn-update-journals');
//     },
    
//     insurance_amount: function(frm) {
//         // Trigger update journal when insurance_amount field changes
//         if (frm.doc.insurance_amount && frm.doc.journal_entry_id) {
//             trigger_update_journal(frm);
//         }
//     }
// });

// // Function to trigger the update journal process
// function trigger_update_journal(frm) {
//     // Create a dialog modal for final insurance amount
//     let d = new frappe.ui.Dialog({
//         title: __('Update Insurance Amount'),
//         fields: [
//             {
//                 label: __('Final Insurance Amount'),
//                 fieldname: 'final_insurance_amount',
//                 fieldtype: 'Currency',
//                 default: frm.doc.insurance_amount,
//                 reqd: 1
//             }
//         ],
//         primary_action_label: __('Update and Submit'),
//         primary_action: function(values) {
//             // Confirm before updating
//             frappe.confirm(
//                 __('Are you sure you want to update the journal entry with the new insurance amount?'),
//                 function() {
//                     // Update Vehicle Insurance and Journal Entry
//                     update_insurance_and_journal(frm, values.final_insurance_amount, d);
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

// // Function to update Vehicle Insurance and Journal Entry
// function update_insurance_and_journal(frm, new_amount, dialog) {
//     // Update Vehicle Insurance amount
//     frappe.call({
//         method: 'frappe.client.set_value',
//         args: {
//             doctype: 'Vehicle Insurance',
//             name: frm.doc.name,
//             fieldname: 'insurance_amount',
//             value: new_amount
//         },
//         callback: function(r) {
//             // Fetch journal entry
//             frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
//                 .then(journal => {
//                     if (journal.docstatus === 0) {
//                         // Draft journal: Update and submit
//                         update_draft_journal(frm, journal, new_amount, dialog);
//                     } else if (journal.docstatus === 1) {
//                         // Submitted journal: Prompt for cancellation and amendment
//                         frappe.confirm(
//                             __('Journal already submitted. Do you want to update still? Then you have to cancel this journal. Do you want to cancel and amend new Journal?'),
//                             function() {
//                                 // Cancel and amend journal
//                                 cancel_and_amend_journal(frm, journal, new_amount, dialog);
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
//             frappe.msgprint(__('Error updating insurance amount: ') + err.message);
//             dialog.hide();
//         }
//     });
// }

// // Function to update and submit draft journal entry
// function update_draft_journal(frm, journal, new_amount, dialog) {
//     // Update journal entry accounts
//     let accounts = journal.accounts.map(account => {
//         let updated_account = { ...account };
//         if (updated_account.account === 'Debtors - A') {
//             if (updated_account.debit_in_account_currency > 0) {
//                 updated_account.debit_in_account_currency = new_amount;
//                 updated_account.debit = new_amount;
//             }
//         } else if (updated_account.account === 'Insurance Charges Payable - A') {
//             if (updated_account.credit_in_account_currency > 0) {
//                 updated_account.credit_in_account_currency = new_amount;
//                 updated_account.credit = new_amount;
//             }
//         }
//         return updated_account;
//     });

//     // Update journal fields
//     journal.total_debit = new_amount;
//     journal.total_credit = new_amount;
//     journal.total_amount = new_amount;
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
// function cancel_and_amend_journal(frm, journal, new_amount, dialog) {
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
//             amended_journal.total_debit = new_amount;
//             amended_journal.total_credit = new_amount;
//             amended_journal.total_amount = new_amount;
//             amended_journal.accounts = amended_journal.accounts.map(account => {
//                 let updated_account = { ...account };
//                 updated_account.name = undefined;
//                 updated_account.creation = undefined;
//                 updated_account.modified = undefined;
//                 updated_account.modified_by = undefined;
//                 updated_account.docstatus = 0;
//                 if (updated_account.account === 'Debtors - A') {
//                     if (updated_account.debit_in_account_currency > 0) {
//                         updated_account.debit_in_account_currency = new_amount;
//                         updated_account.debit = new_amount;
//                     }
//                 } else if (updated_account.account === 'Insurance Charges Payable - A') {
//                     if (updated_account.credit_in_account_currency > 0) {
//                         updated_account.credit_in_account_currency = new_amount;
//                         updated_account.credit = new_amount;
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
//                             // Update journal_entry_id in Vehicle Insurance
//                             frappe.call({
//                                 method: 'frappe.client.set_value',
//                                 args: {
//                                     doctype: 'Vehicle Insurance',
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


frappe.ui.form.on('Vehicle Insurance', {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        try {
            // Clear workflow_state if present
            if (frm.doc.workflow_state) {
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Vehicle Insurance',
                        name: frm.doc.name,
                        fieldname: {
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            frm.reload_doc();
                        } else {
                            log_insurance_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', 'Failed to clear workflow state');
                        }
                    },
                    error: function(err) {
                        log_insurance_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', 'Error clearing workflow state');
                    }
                });
            }

            // Add Update Form button
            if (frm.doc.status === 'Due Update') {
                frm.add_custom_button(__('Update Form'), function() {
                    try {
                        show_update_insurance_dialog(frm);
                    } catch (e) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to open update dialog: ') + e.message,
                            indicator: 'red'
                        });
                    }
                });
            }

            // Add Verify Form button
            if (frm.doc.status === 'Due Verification') {
                frm.add_custom_button(__('Verify Form'), function() {
                    frappe.confirm(
                        __('Do you want to submit the linked journal? This action cannot be undone.'),
                        function() {
                            verify_and_submit_journal(frm);
                        },
                        function() {
                            prompt_for_remarks_no_verify(frm);
                        }
                    );
                });
            }

            // Override form status indicator
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

// Log activity to Insurance Activity Log child table
function log_insurance_activity(frm, activity, status, remarks) {
    try {
        let activity_log = {
            doctype: 'RTO Activity Log',
            activity: activity,
            status: status,
            user: frappe.session.user,
            update_on: frappe.datetime.now_datetime(),
            remarks: (remarks || '').substring(0, 140), // Truncate to 140 characters
            parent: frm.doc.name,
            parentfield: 'insurance_activity',
            parenttype: 'Vehicle Insurance'
        };

        frappe.call({
            method: 'frappe.client.insert',
            args: {
                doc: activity_log
            },
            callback: function(r) {
                if (r.exc) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error logging activity: ') + (r.exc || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error logging activity: ') + (err.message || 'Unknown error'),
                    indicator: 'red'
                });
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

function show_update_insurance_dialog(frm) {
    try {
        let fields = [
            {
                label: __('Insurance Provider'),
                fieldname: 'insurance_provider',
                fieldtype: 'Link',
                options: 'Supplier',
                default: frm.doc.insurance_provider || '',
                reqd: 1
            },
            {
                label: __('Policy Name'),
                fieldname: 'policy_name',
                fieldtype: 'Select',
                default: frm.doc.policy_name || '',
                reqd: 1
            },
            {
                label: __('Insurance Amount'),
                fieldname: 'insurance_amount',
                fieldtype: 'Currency',
                default: frm.doc.insurance_amount || 0,
                reqd: 1
            },
            {
                label: __('Insurance Policy Number'),
                fieldname: 'insurance_policy_number',
                fieldtype: 'Data',
                default: frm.doc.insurance_policy_number || '',
                reqd: 1
            },
            {
                label: __('Insurance Start Date'),
                fieldname: 'insurance_start_date',
                fieldtype: 'Date',
                default: frm.doc.insurance_start_date || frappe.datetime.now_date(),
                reqd: 1
            },
            {
                label: __('OD End Date'),
                fieldname: 'od_end_date',
                fieldtype: 'Date',
                default: frm.doc.od_end_date || '',
                read_only: 1
            },
            {
                label: __('TP End Date'),
                fieldname: 'tp_end_date',
                fieldtype: 'Date',
                default: frm.doc.tp_end_date || '',
                read_only: 1
            }
        ];

        let dialog = new frappe.ui.Dialog({
            title: __('Update Insurance Details'),
            fields: fields,
            primary_action_label: __('Update'),
            primary_action: function(values) {
                try {
                    // Validate inputs
                    if (!values.insurance_provider) {
                        frappe.throw(__('Insurance Provider is mandatory.'));
                    }
                    if (!values.policy_name) {
                        frappe.throw(__('Policy Name is mandatory.'));
                    }
                    if (values.insurance_amount <= 0) {
                        frappe.throw(__('Insurance Amount must be greater than zero.'));
                    }
                    if (!values.insurance_policy_number) {
                        frappe.throw(__('Insurance Policy Number is mandatory.'));
                    }
                    if (!values.insurance_start_date) {
                        frappe.throw(__('Insurance Start Date is mandatory.'));
                    }

                    // Check if any fields have changed
                    let has_changes = (
                        values.insurance_provider !== (frm.doc.insurance_provider || '') ||
                        values.policy_name !== (frm.doc.policy_name || '') ||
                        values.insurance_amount !== (frm.doc.insurance_amount || 0) ||
                        values.insurance_policy_number !== (frm.doc.insurance_policy_number || '') ||
                        values.insurance_start_date !== (frm.doc.insurance_start_date || '') ||
                        values.od_end_date !== (frm.doc.od_end_date || '') ||
                        values.tp_end_date !== (frm.doc.tp_end_date || '')
                    );

                    // Refresh the document to avoid TimestampMismatchError
                    frm.reload_doc().then(() => {
                        // Update frm.doc with dialog values
                        frm.doc.insurance_provider = values.insurance_provider;
                        frm.doc.policy_name = values.policy_name;
                        frm.doc.insurance_amount = values.insurance_amount;
                        frm.doc.insurance_policy_number = values.insurance_policy_number;
                        frm.doc.insurance_start_date = values.insurance_start_date;
                        frm.doc.od_end_date = values.od_end_date;
                        frm.doc.tp_end_date = values.tp_end_date;
                        frm.doc.insurance_status = 'Active';
                        frm.doc.status = 'Due Verification';
                        frm.doc.workflow_state = '';

                        // Save the document
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: frm.doctype,
                                name: frm.docname,
                                fieldname: {
                                    insurance_provider: values.insurance_provider,
                                    policy_name: values.policy_name,
                                    insurance_amount: values.insurance_amount,
                                    insurance_policy_number: values.insurance_policy_number,
                                    insurance_start_date: values.insurance_start_date,
                                    od_end_date: values.od_end_date,
                                    tp_end_date: values.tp_end_date,
                                    insurance_status: 'Active',
                                    status: 'Due Verification',
                                    workflow_state: ''
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    if (has_changes) {
                                        log_insurance_activity(frm, 'Updated Insurance Details', 'Insurance Details Updated', 'Insurance details updated');
                                    }
                                    update_journal(frm, values.insurance_amount, dialog, has_changes);
                                } else {
                                    log_insurance_activity(frm, 'Updated Insurance Details', 'Insurance Details Update Failed', 'Failed to update insurance');
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to save insurance details: ') + (r.exc || 'Unknown error'),
                                        indicator: 'red'
                                    });
                                    dialog.hide();
                                }
                            },
                            error: function(err) {
                                log_insurance_activity(frm, 'Updated Insurance Details', 'Insurance Details Update Failed', 'Error updating insurance');
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('Error updating insurance: ') + (err.message || 'Unknown error'),
                                    indicator: 'red'
                                });
                                dialog.hide();
                            }
                        });
                    }).catch((err) => {
                        log_insurance_activity(frm, 'Updated Insurance Details', 'Insurance Details Update Failed', 'Failed to refresh document');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to refresh document: ') + err.message,
                            indicator: 'red'
                        });
                        dialog.hide();
                    });
                } catch (e) {
                    log_insurance_activity(frm, 'Updated Insurance Details', 'Insurance Details Update Failed', 'Error processing update');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error processing update: ') + e.message,
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

        // Function to update end dates based on start date and policy validity
        function update_end_dates() {
            let insurance_provider = dialog.fields_dict.insurance_provider.get_value();
            let policy_name = dialog.fields_dict.policy_name.get_value();
            let start_date = dialog.fields_dict.insurance_start_date.get_value();

            if (insurance_provider && policy_name && start_date) {
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Supplier',
                        name: insurance_provider
                    },
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let policies = r.message.custom_under_insurer || [];
                            let selected_policy = policies.find(p => p.policy_name === policy_name);
                            
                            if (selected_policy) {
                                // Calculate OD end date
                                let od_years = selected_policy.od_validity_period || 0;
                                let od_end_date = frappe.datetime.add_months(
                                    start_date,
                                    od_years * 12
                                );
                                // Subtract one day to get the correct end date
                                od_end_date = frappe.datetime.add_days(od_end_date, -1);
                                dialog.fields_dict.od_end_date.set_value(od_end_date);

                                // Calculate TP end date
                                let tp_years = selected_policy.tp_validity_period || 0;
                                let tp_end_date = frappe.datetime.add_months(
                                    start_date,
                                    tp_years * 12
                                );
                                // Subtract one day to get the correct end date
                                tp_end_date = frappe.datetime.add_days(tp_end_date, -1);
                                dialog.fields_dict.tp_end_date.set_value(tp_end_date);
                            } else {
                                dialog.fields_dict.od_end_date.set_value('');
                                dialog.fields_dict.tp_end_date.set_value('');
                            }
                        } else {
                            dialog.fields_dict.od_end_date.set_value('');
                            dialog.fields_dict.tp_end_date.set_value('');
                        }
                    },
                    error: function(err) {
                        dialog.fields_dict.od_end_date.set_value('');
                        dialog.fields_dict.tp_end_date.set_value('');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error fetching supplier: ') + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            } else {
                dialog.fields_dict.od_end_date.set_value('');
                dialog.fields_dict.tp_end_date.set_value('');
            }
        }

        // Add onchange handler for insurance_provider
        dialog.fields_dict.insurance_provider.$input.on('change', function() {
            let insurance_provider = dialog.fields_dict.insurance_provider.get_value();
            let policy_name_field = dialog.fields_dict.policy_name;

            if (insurance_provider) {
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Supplier',
                        name: insurance_provider
                    },
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let policies = r.message.custom_under_insurer || [];
                            let policy_options = policies.map(policy => policy.policy_name);

                            policy_name_field.df.fieldtype = 'Select';
                            policy_name_field.df.options = [''].concat(policy_options);
                            policy_name_field.refresh();

                            let current_policy = frm.doc.policy_name && policy_options.includes(frm.doc.policy_name)
                                ? frm.doc.policy_name
                                : '';
                            policy_name_field.set_value(current_policy);

                            update_end_dates();
                        } else {
                            policy_name_field.df.fieldtype = 'Data';
                            policy_name_field.df.options = null;
                            policy_name_field.set_value(frm.doc.policy_name || '');
                            policy_name_field.refresh();
                            dialog.fields_dict.od_end_date.set_value('');
                            dialog.fields_dict.tp_end_date.set_value('');
                        }
                    },
                    error: function(err) {
                        policy_name_field.df.fieldtype = 'Data';
                        policy_name_field.df.options = null;
                        policy_name_field.set_value(frm.doc.policy_name || '');
                        policy_name_field.refresh();
                        dialog.fields_dict.od_end_date.set_value('');
                        dialog.fields_dict.tp_end_date.set_value('');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error fetching policies: ') + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            } else {
                policy_name_field.df.fieldtype = 'Data';
                policy_name_field.df.options = null;
                policy_name_field.set_value(frm.doc.policy_name || '');
                policy_name_field.refresh();
                dialog.fields_dict.od_end_date.set_value('');
                dialog.fields_dict.tp_end_date.set_value('');
            }
        });

        // Add onchange handler for policy_name
        dialog.fields_dict.policy_name.$input.on('change', function() {
            update_end_dates();
        });

        // Add onchange handler for insurance_start_date
        dialog.fields_dict.insurance_start_date.$input.on('change', function() {
            update_end_dates();
        });

        dialog.show();
        // Trigger onchange for insurance_provider after dialog is rendered
        setTimeout(() => {
            dialog.fields_dict.insurance_provider.$input.trigger('change');
        }, 100);
    } catch (e) {
        frappe.msgprint({
            title: __('Error'),
            message: __('Failed to create dialog: ') + e.message,
            indicator: 'red'
        });
    }
}

// Update journal
function update_journal(frm, new_amount, dialog, has_changes) {
    try {
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.get_company_abbr',
            callback: function(r) {
                if (!r.exc && r.message) {
                    let company_abbr = r.message;
                    let accounts_to_validate = [
                        'Debtors',
                        frm.doc.insurance_provider
                    ];

                    frappe.call({
                        method: 'autowings_app.custom_scripts.utils.validate_accounts',
                        args: {
                            accounts: accounts_to_validate,
                            company: frm.doc.company || 'Autowings'
                        },
                        callback: function(r) {
                            if (!r.exc && r.message) {
                                let promises = [];

                                if (frm.doc.journal_entry_id) {
                                    promises.push(
                                        frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                                            .then(journal => {
                                                if (journal.docstatus !== 0) {
                                                    throw new Error('Journal Entry is not in Draft status');
                                                }
                                                update_journal_entry(frm, journal, new_amount, company_abbr);
                                                return frappe.call({
                                                    method: 'frappe.client.save',
                                                    args: { doc: journal }
                                                });
                                            })
                                            .catch(err => {
                                                throw new Error('Error updating journal: ' + err.message);
                                            })
                                    );
                                }

                                Promise.all(promises)
                                    .then(() => {
                                        if (has_changes) {
                                            log_insurance_activity(frm, 'Updated Insurance Details', 'Journal Updated', 'Journal updated');
                                        }
                                        finalize_update(frm, dialog, has_changes);
                                    })
                                    .catch(err => {
                                        log_insurance_activity(frm, 'Updated Insurance Details', 'Journal Update Failed', 'Error updating journal');
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: err.message || 'Error updating journal',
                                            indicator: 'red'
                                        });
                                        dialog.hide();
                                    });
                            } else {
                                log_insurance_activity(frm, 'Updated Insurance Details', 'Account Validation Failed', 'Invalid accounts');
                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    message: 'One or more accounts are invalid',
                                    indicator: 'red'
                                });
                                dialog.hide();
                            }
                        },
                        error: function(err) {
                            log_insurance_activity(frm, 'Updated Insurance Details', 'Account Validation Failed', 'Error validating accounts');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error validating accounts: ' + (err.message || 'Unknown error'),
                                indicator: 'red'
                            });
                            dialog.hide();
                        }
                    });
                } else {
                    log_insurance_activity(frm, 'Updated Insurance Details', 'Company Abbreviation Fetch Failed', 'Failed to fetch company abbreviation');
                    frappe.msgprint({
                        title: __('Error'),
                        message: 'Error fetching company abbreviation',
                        indicator: 'red'
                    });
                    dialog.hide();
                }
            },
            error: function(err) {
                log_insurance_activity(frm, 'Updated Insurance Details', 'Company Abbreviation Fetch Failed', 'Error fetching company abbreviation');
                frappe.msgprint({
                    title: __('Error'),
                    message: 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'),
                    indicator: 'red'
                });
                dialog.hide();
            }
        });
    } catch (e) {
        log_insurance_activity(frm, 'Updated Insurance Details', 'Journal Update Failed', 'Error updating journal');
        frappe.msgprint({
            title: __('Error'),
            message: 'Error updating journal: ' + e.message,
            indicator: 'red'
        });
        dialog.hide();
    }
}

// Update journal entry
function update_journal_entry(frm, journal, new_amount, company_abbr) {
    try {
        let debtorAccount = journal.accounts.find(acc => 
            acc.account === `Debtors - ${company_abbr}` && 
            acc.debit_in_account_currency > 0 &&
            acc.against_account.includes(frm.doc.insurance_provider)
        );
        let payableAccount = journal.accounts.find(acc => 
            acc.account === `${frm.doc.insurance_provider} Payable - ${company_abbr}` && 
            acc.credit_in_account_currency > 0
        );

        if (debtorAccount && payableAccount) {
            debtorAccount.debit_in_account_currency = new_amount;
            debtorAccount.debit = new_amount;
            payableAccount.credit_in_account_currency = new_amount;
            payableAccount.credit = new_amount;
        } else {
            journal.accounts = [
                {
                    account: `Debtors - ${company_abbr}`,
                    party_type: 'Customer',
                    party: frm.doc.customer,
                    debit_in_account_currency: new_amount,
                    debit: new_amount,
                    credit_in_account_currency: 0,
                    credit: 0,
                    cost_center: `Main - ${company_abbr}`,
                    against_account: frm.doc.insurance_provider
                },
                {
                    account: `${frm.doc.insurance_provider} Payable - ${company_abbr}`,
                    party_type: 'Supplier',
                    party: frm.doc.insurance_provider,
                    debit_in_account_currency: 0,
                    debit: 0,
                    credit_in_account_currency: new_amount,
                    credit: new_amount,
                    cost_center: `Main - ${company_abbr}`,
                    against_account: frm.doc.customer
                }
            ];
        }

        journal.total_debit = new_amount;
        journal.total_credit = new_amount;
        journal.total_amount = new_amount;
    } catch (e) {
        throw new Error('Error updating journal entry: ' + e.message);
    }
}

// Verify and submit journal
function verify_and_submit_journal(frm) {
    try {
        let promises = [];

        if (frm.doc.journal_entry_id) {
            promises.push(
                frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                    .then(journal => {
                        if (journal.docstatus !== 0) {
                            throw new Error('Journal Entry is not in Draft status');
                        }
                        return frappe.call({
                            method: 'frappe.client.submit',
                            args: { doc: journal }
                        });
                    })
                    .catch(err => {
                        throw new Error('Error submitting journal: ' + err.message);
                    })
            );
        }

        Promise.all(promises)
            .then(() => {
                let new_status = frm.doc.payment_status === 'Due' ? 'Payment Due' : 'Completed';
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Vehicle Insurance',
                        name: frm.doc.name,
                        fieldname: {
                            status: new_status,
                            journal_status: frm.doc.journal_entry_id ? 'Submitted' : frm.doc.journal_status,
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_insurance_activity(frm, 'Verified Insurance with Journal Submission', 'Insurance Verified', 'Insurance verified');
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Insurance verified and journal submitted.'),
                                indicator: 'green'
                            });
                        } else {
                            log_insurance_activity(frm, 'Verified Insurance with Journal Submission', 'Insurance Verification Failed', 'Failed to update status');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error updating Vehicle Insurance: ' + (r.exc || 'Unknown error'),
                                indicator: 'red'
                            });
                        }
                    },
                    error: function(err) {
                        log_insurance_activity(frm, 'Verified Insurance with Journal Submission', 'Insurance Verification Failed', 'Error updating status');
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error updating Vehicle Insurance: ' + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            })
            .catch(err => {
                log_insurance_activity(frm, 'Verified Insurance with Journal Submission', 'Insurance Verification Failed', 'Error submitting journal');
                frappe.msgprint({
                    title: __('Error'),
                    message: err.message || 'Error submitting journal',
                    indicator: 'red'
                });
            });
    } catch (e) {
        log_insurance_activity(frm, 'Verified Insurance with Journal Submission', 'Insurance Verification Failed', 'Error submitting journal');
        frappe.msgprint({
            title: __('Error'),
            message: 'Error submitting journal: ' + e.message,
            indicator: 'red'
        });
    }
}

// Prompt for remarks if journal is not submitted
function prompt_for_remarks_no_verify(frm) {
    try {
        let remark_dialog = new frappe.ui.Dialog({
            title: __('Enter Remarks'),
            fields: [
                {
                    label: __('Remarks'),
                    fieldname: 'remarks',
                    fieldtype: 'Small Text',
                    reqd: 1,
                    description: __('Please provide the reason for not submitting the journal.')
                }
            ],
            primary_action_label: __('Save'),
            primary_action: function(values) {
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Vehicle Insurance',
                        name: frm.doc.name,
                        fieldname: {
                            status: 'Due Update',
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_insurance_activity(frm, 'Verified Insurance without Journal Submission', 'Insurance Verification Skipped', values.remarks.substring(0, 140));
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Insurance verification skipped, status set to Due Update.'),
                                indicator: 'green'
                            });
                            remark_dialog.hide();
                        } else {
                            log_insurance_activity(frm, 'Verified Insurance without Journal Submission', 'Insurance Verification Skipped Failed', 'Failed to update status');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error updating status: ' + (r.exc || 'Unknown error'),
                                indicator: 'red'
                            });
                        }
                    },
                    error: function(err) {
                        log_insurance_activity(frm, 'Verified Insurance without Journal Submission', 'Insurance Verification Skipped Failed', 'Error updating status');
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error updating status: ' + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                remark_dialog.hide();
            }
        });
        remark_dialog.show();
    } catch (e) {
        log_insurance_activity(frm, 'Verified Insurance without Journal Submission', 'Insurance Verification Skipped Failed', 'Error prompting for remarks');
        frappe.msgprint({
            title: __('Error'),
            message: 'Error prompting for remarks: ' + e.message,
            indicator: 'red'
        });
    }
}

// Finalize the update
function finalize_update(frm, dialog, has_changes) {
    try {
        frm.reload_doc();
        if (has_changes) {
            frappe.msgprint({
                title: __('Success'),
                message: __('Insurance details updated successfully.'),
                indicator: 'green'
            });
        } else {
            frappe.msgprint({
                title: __('No Changes'),
                message: __('No changes were made to the insurance details.'),
                indicator: 'orange'
            });
        }
        dialog.hide();
    } catch (e) {
        log_insurance_activity(frm, 'Updated Insurance Details', 'Finalize Update Failed', 'Error finalizing update');
        frappe.msgprint({
            title: __('Error'),
            message: 'Error finalizing update: ' + e.message,
            indicator: 'red'
        });
        dialog.hide();
    }
}


// for due payment 
frappe.ui.form.on('Vehicle Insurance', {
    refresh: function(frm) {
        console.log('Form refresh, status:', frm.doc.status, 'payment_status:', frm.doc.payment_status);
        // Add Make Payment button
        if (frm.doc.status === 'Payment Due' && frm.doc.payment_status === 'Due') {
            console.log('Adding Make Payment button');
            frm.add_custom_button(__('Make Payment'), function() {
                console.log('Make Payment button clicked');
                _insurance_payment_entry_action(frm);
            });
        }
    }
});

// Function to handle insurance payment entry redirection
function _insurance_payment_entry_action(frm) {
    try {
        // Validate Insurance Provider
        if (!frm.doc.insurance_provider) {
            log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', 'Insurance Provider is mandatory.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Insurance Provider is mandatory to proceed with payment entry.'),
                indicator: 'red'
            });
            return;
        }

        // Validate Insurance Amount
        if (!frm.doc.insurance_amount || frm.doc.insurance_amount <= 0) {
            log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', 'Insurance Amount must be greater than zero.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Insurance Amount must be greater than zero.'),
                indicator: 'red'
            });
            return;
        }

        // Get company abbreviation
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.get_company_abbr',
            callback: function(r) {
                if (!r.exc && r.message) {
                    let company_abbr = r.message;
                    let paid_to_account = `${frm.doc.insurance_provider} Payable - ${company_abbr}`;

                    // Validate that the paid_to account exists
                    frappe.call({
                        method: 'frappe.client.get_value',
                        args: {
                            doctype: 'Account',
                            fieldname: 'name',
                            filters: { name: paid_to_account }
                        },
                        callback: function(r) {
                            if (!r.exc && !r.message.name) {
                                log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', `Account ${paid_to_account} does not exist.`);
                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
                                    indicator: 'red'
                                });
                                return;
                            }

                            // Construct Payment Entry URL with pre-filled values
                            let payment_entry_url = `/app/payment-entry/new-payment-entry?` +
                                `payment_type=Pay&` +
                                `party_type=Supplier&` +
                                `party=${encodeURIComponent(frm.doc.insurance_provider)}&` +
                                `party_name=${encodeURIComponent(frm.doc.insurance_provider)}&` +
                                `paid_to=${encodeURIComponent(paid_to_account)}&` +
                                `paid_amount=${frm.doc.insurance_amount}&` +
                                `reference_doctype=Vehicle Insurance&` +
                                `reference_name=${frm.doc.name}`;

                            // Log activity for payment initiation
                            log_insurance_activity(frm, 'Payment Initiated', 'Payment Entry Started', '');
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Redirecting to Payment Entry form.'),
                                indicator: 'green'
                            });

                            // Redirect to Payment Entry form
                            window.location.href = payment_entry_url;
                        },
                        error: function(err) {
                            log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', err.message || JSON.stringify(err));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                        }
                    });
                } else {
                    log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error retrieving company abbreviation: ') + (r.exc || JSON.stringify(r)),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error retrieving company abbreviation: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
            }
        });
    } catch (err) {
        log_insurance_activity(frm, 'Payment Attempted', 'Payment Failed', err.message || JSON.stringify(err));
        frappe.msgprint({
            title: __('Error'),
            message: __('Unexpected error: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
    }
}

// Log activity to Insurance Activity Log child table
function log_insurance_activity(frm, activity, status, remarks) {
    console.log('Logging activity:', activity, status, remarks);
    let activity_log = {
        doctype: 'RTO Activity Log',
        activity: activity,
        status: status,
        user: frappe.session.user,
        update_on: frappe.datetime.now_datetime(),
        remarks: remarks || '',
        parent: frm.doc.name,
        parentfield: 'insurance_activity',
        parenttype: 'Vehicle Insurance'
    };

    frappe.call({
        method: 'frappe.client.insert',
        args: {
            doc: activity_log
        },
        callback: function(r) {
            if (r.exc) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
                console.error('Activity Log Error:', r.exc);
            } else {
                console.log('Activity logged successfully:', r.message);
            }
        },
        error: function(err) {
            console.error('Error logging activity:', err);
        }
    });
}


// for role based custom button
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


frappe.ui.form.on("Vehicle Insurance", {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        
        frm.add_custom_button(__("Cancel Journal Entry"), function() {
            // Prompt for confirmation
            frappe.confirm(
                __("Are you sure you want to cancel or delete the linked Journal Entry?"),
                function() {
                    // Proceed with the server-side call if confirmed
                    frappe.call({
                        method: "autowings_app.custom_scripts.vehicle_sales_journal_cancel.cancel_journal_entry_insurance",
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