// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Vehicle Smart Card", {
// 	refresh(frm) {

// 	},
// });

// frappe.ui.form.on('Vehicle Smart Card', {
//     refresh: function(frm) {
//         // Check if rto_activity child table has rows
//         if (frm.doc.rto_activity && frm.doc.rto_activity.length > 0) {
//             // Add custom button to the form
//             frm.add_custom_button(__('View Activities'), function() {
//                 // Create a new dialog (modal) with large size
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('RTO Activity Log'),
//                     size: 'large', // Set modal size to large
//                     fields: [
//                         {
//                             fieldtype: 'HTML',
//                             fieldname: 'activity_table',
//                             options: generate_activity_table(frm)
//                         }
//                     ],
//                     primary_action_label: __('Close'),
//                     primary_action: function() {
//                         dialog.hide();
//                     }
//                 });
//                 // Add custom CSS for flexible modal width and table styling
//                 dialog.$wrapper.find('.modal-content').prepend(`
//                     <style>
//                         .modal-dialog {
//                             max-width: 90vw !important; /* Flexible width up to 90% of viewport */
//                             width: auto !important;
//                         }
//                         .activity-table {
//                             width: 100%;
//                             table-layout: auto;
//                         }
//                         .activity-table th, .activity-table td {
//                             padding: 10px;
//                             text-align: left;
//                             vertical-align: middle;
//                             word-wrap: break-word;
//                         }
//                         .activity-table th {
//                             background-color: #f4f4f4;
//                             font-weight: bold;
//                         }
//                         .status-error {
//                             color: #d9534f; /* Red for error */
//                         }
//                         .status-success {
//                             color: #5cb85c; /* Green for success */
//                         }
//                         .status-danger {
//                             color: #f0ad4e; /* Orange for other statuses */
//                         }
//                         .remarks-yellow {
//                             background-color: #fff3cd; /* Yellow background for remarks */
//                             display: block;
//                             padding: 4px;
//                             border-radius: 3px;
//                         }
//                     </style>
//                 `);
//                 dialog.show();
//             });
//         }
//     }
// });

// // Function to generate HTML table for activities in descending order
// function generate_activity_table(frm) {
//     // Sort activities in descending order based on update_on
//     let sorted_activities = frm.doc.rto_activity.slice().sort((a, b) => {
//         return new Date(b.update_on) - new Date(a.update_on);
//     });

//     let html = `
//         <table class="table table-bordered activity-table">
//             <thead>
//                 <tr>
//                     <th>Activity</th>
//                     <th>Status</th>
//                     <th>Updated By</th>
//                     <th>Updated On</th>
//                     <th>Remarks</th>
//                 </tr>
//             </thead>
//             <tbody>
//     `;
    
//     sorted_activities.forEach(row => {
//         // Determine status class based on status value
//         let status_class = 'status-danger'; // Default to orange
//         if (row.status === 'Application Verification Skipped') {
//             status_class = 'status-error'; // Red for error
//         } else if (['Application Verified', 'Payment Recorded', 'Registration Updated', 'Application Details Updated', 'Journals and Smart Cards Updated'].includes(row.status)) {
//             status_class = 'status-success'; // Green for success
//         }

//         // Format update_on date
//         let update_on = frappe.datetime.str_to_user(row.update_on);

//         // Handle remarks (empty or yellow background)
//         let remarks = row.remarks ? `<span class="remarks-yellow">${frappe.utils.escape_html(row.remarks)}</span>` : '-';

//         html += `
//             <tr>
//                 <td>${frappe.utils.escape_html(row.activity)}</td>
//                 <td class="${status_class}">${frappe.utils.escape_html(row.status)}</td>
//                 <td>${frappe.utils.escape_html(row.user)}</td>
//                 <td>${update_on}</td>
//                 <td>${remarks}</td>
//             </tr>
//         `;
//     });

//     html += '</tbody></table>';
//     return html;
// }

frappe.ui.form.on('Vehicle Smart Card', {
    refresh: function(frm) {
        // Check if rto_activity child table has rows
        if (frm.doc.rto_activity && frm.doc.rto_activity.length > 0) {
            // Add custom button to the form
            frm.add_custom_button(__('View Activities'), function() {
                // Create a new dialog (modal) with large size
                let dialog = new frappe.ui.Dialog({
                    title: __('Smart Card Activity Timeline'),
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

                // Add a unique class to this modal for targeted styling
                dialog.$wrapper.addClass('rto-activity-modal');

                // Add custom CSS for this specific modal and timeline styling
                dialog.$wrapper.find('.modal-content').prepend(`
                    <style>
                        .rto-activity-modal .modal-dialog {
                            max-width: 800px !important;
                            width: 90% !important;
                            margin: 30px auto !important;
                        }
                        .rto-activity-modal .modal-content {
                            border-radius: 8px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        }
                        .rto-activity-modal .modal-body {
                            padding: 20px;
                            overflow-y: auto;
                            max-height: 70vh;
                        }
                        .timeline {
                            position: relative;
                            padding: 20px 0;
                            list-style: none;
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
                            margin-bottom: 20px;
                            padding-left: 60px;
                        }
                        .timeline-icon {
                            position: absolute;
                            left: 20px;
                            top: 5px;
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            background: #fff;
                            border: 3px solid;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .status-error .timeline-icon { border-color: #d9534f; }
                        .status-success .timeline-icon { border-color: #5cb85c; }
                        .status-danger .timeline-icon { border-color: #f0ad4e; }
                        .timeline-content {
                            background: #fff;
                            padding: 15px;
                            border-radius: 6px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                            position: relative;
                            transition: transform 0.2s;
                        }
                        .timeline-content:hover {
                            transform: translateY(-2px);
                        }
                        .timeline-content h4 {
                            margin: 0 0 8px;
                            font-size: 16px;
                            color: #333;
                        }
                        .timeline-content p {
                            margin: 0;
                            color: #666;
                            font-size: 14px;
                        }
                        .status-error { color: #d9534f; }
                        .status-success { color: #5cb85c; }
                        .status-danger { color: #f0ad4e; }
                        .remarks-yellow {
                            background-color: #fff3cd;
                            display: inline-block;
                            padding: 4px 8px;
                            border-radius: 3px;
                            margin-top: 8px;
                        }
                        .latest-activity .timeline-content {
                            border-left: 4px solid #5cb85c;
                        }
                        .progress-bar-container {
                            margin-bottom: 20px;
                        }
                        .progress-bar {
                            height: 20px;
                            background: #e9ecef;
                            border-radius: 10px;
                            overflow: hidden;
                        }
                        .progress-bar-fill {
                            height: 100%;
                            background: #5cb85c;
                            transition: width 0.3s ease;
                        }
                    </style>
                `);
                dialog.show();
            });
        }
    }
});

// Function to generate timeline HTML with progress bar
function generate_activity_timeline(frm) {
    // Sort activities in descending order based on update_on
    let sorted_activities = frm.doc.rto_activity.slice().sort((a, b) => {
        return new Date(b.update_on) - new Date(a.update_on);
    });

    // Show progress bar only if frm.doc.status is "Completed"
    let progressBarHtml = frm.doc.status === 'Completed' ? `
        <div class="progress-bar-container">
            <h4>Completed: 100%</h4>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: 100%"></div>
            </div>
        </div>
    ` : '';

    let html = `
        ${progressBarHtml}
        <ul class="timeline">
    `;

    sorted_activities.forEach((row, index) => {
        // Determine status class based on status value
        let status_class = 'status-danger';
        if (row.status === 'Application Verification Skipped') {
            status_class = 'status-error';
        } else if (['Application Verified', 'Payment Recorded', 'Registration Updated', 'Application Details Updated', 'Journals and Smart Cards Updated'].includes(row.status)) {
            status_class = 'status-success';
        }

        // Format update_on date
        let update_on = frappe.datetime.str_to_user(row.update_on);

        // Handle remarks
        let remarks = row.remarks ? `<span class="remarks-yellow">${frappe.utils.escape_html(row.remarks)}</span>` : '';

        // Apply latest-activity class to the first row
        let row_class = index === 0 ? 'latest-activity' : '';

        html += `
            <li class="timeline-item ${status_class} ${row_class}">
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <h4>${frappe.utils.escape_html(row.activity)}</h4>
                    <p><strong>Status:</strong> <span class="${status_class}">${frappe.utils.escape_html(row.status)}</span></p>
                    <p><strong>Updated By:</strong> ${frappe.utils.escape_html(row.user)}</p>
                    <p><strong>Updated On:</strong> ${update_on}</p>
                    ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
                </div>
            </li>
        `;
    });

    html += '</ul>';
    return html;
}



// for status
frappe.ui.form.on('Vehicle Smart Card', {
    refresh: function(frm) {
        // Clear workflow_state if present
        if (frm.doc.workflow_state) {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Vehicle Smart Card',
                    name: frm.doc.name,
                    fieldname: {
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        frm.reload_doc();
                    } else {
                        log_rto_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', r.exc || JSON.stringify(r));
                    }
                }
            });
        }

        // Add Make Payment to RTO button
        if (frm.doc.status === 'Due Payment to RTO' && frm.doc.smart_card_payment_status === 'Due') {
            frm.add_custom_button(__('Make Payment to RTO'), function() {
                _rto_payment_entry_action(frm);
            });
        }

        // Add Update in Vahan button
        if (frm.doc.status === 'Due Updation in Vahan') {
            frm.add_custom_button(__('Update in Vahan'), function() {
                show_update_vahan_dialog(frm);
            });
        }

        // Add Handover to Customer button
        if (frm.doc.status === 'Handover to Customer') {
            frm.add_custom_button(__('Handover to Customer'), function() {
                show_handover_dialog(frm);
            });
        }

        // Set form status indicator
        frm.set_intro(__('Status: ') + frm.doc.status, 'blue');
    }
});

// Function to log RTO activity to the rto_activity child table
function log_rto_activity(frm, activity, status, remarks) {
    try {
        let activity_log = {
            doctype: 'RTO Activity Log',
            activity: activity,
            status: status,
            user: frappe.session.user,
            update_on: frappe.datetime.now_datetime(),
            remarks: remarks || '',
            parent: frm.doc.name,
            parentfield: 'rto_activity',
            parenttype: 'Vehicle Smart Card'
        };

        frappe.call({
            method: 'frappe.client.insert',
            args: {
                doc: activity_log
            },
            callback: function(r) {
                if (r.exc) {
                    console.error('Failed to log RTO activity:', r.exc);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                console.error('Error logging RTO activity:', err.message || 'Unknown error');
            }
        });
    } catch (err) {
        console.error('Unexpected error in log_rto_activity:', err.message || 'Unknown error');
    }
}

// Function to handle RTO payment entry redirection
function _rto_payment_entry_action(frm) {
    try {
        // Hardcode RTO Office as "Smart Card"
        const rto_office = "Smart Card";

        // Validate Smart Card Charge
        if (!frm.doc.smart_card_charge || frm.doc.smart_card_charge <= 0) {
            log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'Smart Card Charge must be greater than zero.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Smart Card Charge must be greater than zero.'),
                indicator: 'red'
            });
            return;
        }

        // Get company abbreviation
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.get_company_abbr',
            callback: function(r) {
                if (r.exc || !r.message) {
                    log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error retrieving company abbreviation: ') + (r.exc || JSON.stringify(r)),
                        indicator: 'red'
                    });
                    return;
                }

                const company_abbr = r.message;
                const paid_to_account = `${rto_office} Payable - ${company_abbr}`;

                // Validate that the paid_to account exists
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Account',
                        fieldname: 'name',
                        filters: { name: paid_to_account }
                    },
                    callback: function(r) {
                        if (r.exc || !r.message?.name) {
                            log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', `Account ${paid_to_account} does not exist.`);
                            frappe.msgprint({
                                title: __('Validation Error'),
                                message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
                                indicator: 'red'
                            });
                            return;
                        }

                        // Construct Payment Entry URL with pre-filled values
                        const payment_entry_url = `/app/payment-entry/new-payment-entry?` +
                            `payment_type=Pay&` +
                            `party_type=Supplier&` +
                            `party=${encodeURIComponent(rto_office)}&` +
                            `party_name=${encodeURIComponent(rto_office)}&` +
                            `paid_to=${encodeURIComponent(paid_to_account)}&` +
                            `paid_amount=${frm.doc.smart_card_charge}&` +
                            `reference_doctype=Vehicle Smart Card&` +
                            `reference_name=${frm.doc.name}`;

                        // Log activity for payment initiation
                        log_rto_activity(frm, 'Payment to RTO Initiated', 'Payment Entry Started', '');

                        // Show success message and redirect
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Redirecting to Payment Entry form.'),
                            indicator: 'green'
                        });

                        window.location.href = payment_entry_url;
                    },
                    error: function(err) {
                        log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', err.message || 'Account validation failed');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error validating account: ') + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            },
            error: function(err) {
                log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', err.message || 'Failed to retrieve company abbreviation');
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error retrieving company abbreviation: ') + (err.message || 'Unknown error'),
                    indicator: 'red'
                });
            }
        });
    } catch (err) {
        log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', err.message || 'Unexpected error');
        frappe.msgprint({
            title: __('Error'),
            message: __('Unexpected error: ') + (err.message || 'Unknown error'),
            indicator: 'red'
        });
    }
}

// Show dialog for updating Vahan details
function show_update_vahan_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Update in Vahan'),
        fields: [
            {
                label: __('Vahan Update Date'),
                fieldname: 'vahan_update_date',
                fieldtype: 'Date',
                default: frappe.datetime.now_date(),
                reqd: 1
            },
            {
                label: __('Remarks'),
                fieldname: 'remarks',
                fieldtype: 'Small Text',
                reqd: 1
            }
        ],
        primary_action_label: __('Update'),
        primary_action: function(values) {
            if (!values.vahan_update_date) {
                frappe.throw(__('Vahan Update Date is mandatory.'));
            }
            if (!values.remarks) {
                frappe.throw(__('Remarks are mandatory.'));
            }

            // Update Vehicle Smart Card status
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Vehicle Smart Card',
                    name: frm.doc.name,
                    fieldname: {
                        vahan_update_date: values.vahan_update_date,
                        status: 'Handover to Customer',
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        // Log activity
                        log_rto_activity(frm, 'Vahan Details Updated', 'Vahan Update Completed', values.remarks);
                        frm.reload_doc();
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Vahan details updated successfully.'),
                            indicator: 'green'
                        });
                        dialog.hide();
                    } else {
                        log_rto_activity(frm, 'Vahan Details Updated', 'Vahan Update Failed', r.exc || JSON.stringify(r));
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error updating Vahan details: ') + (r.exc || JSON.stringify(r)),
                            indicator: 'red'
                        });
                    }
                },
                error: function(err) {
                    log_rto_activity(frm, 'Vahan Details Updated', 'Vahan Update Failed', err.message || 'Unknown error');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error updating Vahan details: ') + (err.message || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            });
        },
        secondary_action_label: __('Cancel'),
        secondary_action: function() {
            dialog.hide();
            log_rto_activity(frm, 'Vahan Details Update Cancelled', 'Update Cancelled', 'User cancelled the Vahan update.');
            frappe.msgprint({
                title: __('Action Cancelled'),
                message: __('Vahan update cancelled.'),
                indicator: 'red'
            });
        }
    });
    dialog.show();
}

// Show dialog for handing over to customer
function show_handover_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Handover to Customer'),
        fields: [
            {
                label: __('Handover Date'),
                fieldname: 'handover_date',
                fieldtype: 'Datetime',
                default: frappe.datetime.now_datetime(),
                reqd: 1
            },
            {
                label: __('Handed Over By'),
                fieldname: 'handed_over_by',
                fieldtype: 'Link',
                options: 'User',
                reqd: 1
            },
            {
                label: __('Handover Remarks'),
                fieldname: 'handover_remarks',
                fieldtype: 'Small Text',
                reqd: 1
            }
        ],
        primary_action_label: __('Confirm'),
        primary_action: function(values) {
            if (!values.handover_date) {
                frappe.throw(__('Handover Date is mandatory.'));
            }
            if (!values.handed_over_by) {
                frappe.throw(__('Handed Over By is mandatory.'));
            }
            if (!values.handover_remarks) {
                frappe.throw(__('Handover Remarks are mandatory.'));
            }

            // Update Vehicle Smart Card status
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Vehicle Smart Card',
                    name: frm.doc.name,
                    fieldname: {
                        status: 'Completed',
                        handover_date: values.handover_date,
                        handed_over_by: values.handed_over_by,
                        handover_remarks: values.handover_remarks,
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        // Log activity
                        log_rto_activity(frm, 'Handover to Customer', 'Handover Completed', `Handed over by ${values.handed_over_by} on ${values.handover_date}: ${values.handover_remarks}`);
                        frm.reload_doc();
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Smart Card handed over to customer successfully.'),
                            indicator: 'green'
                        });
                        dialog.hide();
                    } else {
                        log_rto_activity(frm, 'Handover to Customer', 'Handover Failed', r.exc || JSON.stringify(r));
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error confirming handover: ') + (r.exc || JSON.stringify(r)),
                            indicator: 'red'
                        });
                    }
                },
                error: function(err) {
                    log_rto_activity(frm, 'Handover to Customer', 'Handover Failed', err.message || 'Unknown error');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error confirming handover: ') + (err.message || 'Unknown error'),
                        indicator: 'red'
                    });
                }
            });
        },
        secondary_action_label: __('Cancel'),
        secondary_action: function() {
            dialog.hide();
            log_rto_activity(frm, 'Handover to Customer Cancelled', 'Handover Cancelled', 'User cancelled the handover.');
            frappe.msgprint({
                title: __('Action Cancelled'),
                message: __('Handover to customer cancelled.'),
                indicator: 'red'
            });
        }
    });
    dialog.show();
}