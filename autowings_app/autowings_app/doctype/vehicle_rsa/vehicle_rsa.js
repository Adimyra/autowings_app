// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Vehicle RSA", {
// 	refresh(frm) {

// 	},
// });

// veiw activity log

frappe.ui.form.on('Vehicle RSA', {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        console.log('Form refresh, checking rsa_activity');
        // Add View Activities button if rsa_activity has rows
        if (frm.doc.rsa_activity && frm.doc.rsa_activity.length > 0) {
            console.log('Adding View Activities button');
            frm.add_custom_button(__('View Activities'), function() {
                console.log('View Activities button clicked');
                try {
                    let dialog = new frappe.ui.Dialog({
                        title: __('RSA Activity Timeline'),
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

                    dialog.$wrapper.addClass('rsa-activity-modal');
                    dialog.$wrapper.find('.modal-content').prepend(`
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                        <style>
                            .rsa-activity-modal .modal-dialog {
                                max-width: 800px !important;
                                width: 90% !important;
                                margin: 30px auto !important;
                            }
                            .rsa-activity-modal .modal-content {
                                border-radius: 8px;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            }
                            .rsa-activity-modal .modal-body {
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
    let sorted_activities = frm.doc.rsa_activity.slice().sort((a, b) => {
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
            'RSA Details Updated',
            'RSA Verified',
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


// /now code begen

frappe.ui.form.on('Vehicle RSA', {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        try {
            // Clear workflow_state if present
            if (frm.doc.workflow_state) {
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Vehicle RSA',
                        name: frm.doc.name,
                        fieldname: {
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            frm.reload_doc();
                        } else {
                            log_rsa_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', 'Failed to clear workflow state');
                        }
                    },
                    error: function(err) {
                        log_rsa_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', 'Error clearing workflow state');
                    }
                });
            }

            // Add Update Form button
            // if (frm.doc.status === 'Due Update') {
            //     frm.add_custom_button(__('Update Form'), function() {
            //         try {
            //             show_update_rsa_dialog(frm);
            //         } catch (e) {
            //             frappe.msgprint({
            //                 title: __('Error'),
            //                 message: __('Failed to open update dialog: ') + e.message,
            //                 indicator: 'red'
            //             });
            //         }
            //     });
            // }
            if (frm.doc.status === 'Due Update') {
                frappe.call({
                    method: 'autowings_app.custom_scripts.utils.can_show_button',
                    args: {
                        link_doc: frm.doc.doctype,
                        button_name: 'Update Form'
                    },
                    callback: function(r) {
                        if (r.message) {
                            frm.add_custom_button(__('Update Form'), function() {
                                try {
                                    show_update_rsa_dialog(frm);
                                } catch (e) {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to open update dialog: ') + e.message,
                                        indicator: 'red'
                                    });
                                }
                            });
                        }
                    }
                });
            }

        //         if (frm.doc.status === 'Due Updation in Vahan' && frappe.user_roles.includes('Sales Manager')) {
        //     frm.add_custom_button(__('Update in Vahan'), function() {
        //         show_update_vahan_dialog(frm);
        //     });
        // }

            // Add Verify Form button
            // if (frm.doc.status === 'Due Verification') {
            //     frm.add_custom_button(__('Verify Form'), function() {
            //         frappe.confirm(
            //             __('Do you want to submit the linked journal? This action cannot be undone.'),
            //             function() {
            //                 verify_and_submit_journal(frm);
            //             },
            //             function() {
            //                 prompt_for_remarks_no_verify(frm);
            //             }
            //         );
            //     });
            // }

            // Add Verify Form button
            if (frm.doc.status === 'Due Verification') {
                frappe.call({
                    method: 'autowings_app.custom_scripts.utils.can_show_button',
                    args: {
                        link_doc: frm.doc.doctype,
                        button_name: 'Verify Form'
                    },
                    callback: function(r) {
                        if (r.message) {
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
                    }
                });
            }

            // if (frm.doc.status === 'Due Verification') {
            //     frappe.db.get_list('Adi Workflow Button Roles', {
            //         filters: {
            //             link_doc: frm.doc.doctype,
            //             button_name: 'Verify Form'
            //         },
            //         fields: ['role']
            //     }).then(records => {
            //         let can_add_button = false;
            //         if (records.length > 0) {
            //             // Check if user has any of the roles specified in Adi Workflow Button Roles
            //             can_add_button = records.some(record => frappe.user_roles.includes(record.role));
            //         } else {
            //             // Fallback: Show button to Sales Manager if no entry in Adi Workflow Button Roles
            //             can_add_button = frappe.user_roles.includes('Sales User');
            //         }

            //         if (can_add_button) {
            //             frm.add_custom_button(__('Verify Form'), function() {
            //                 frappe.confirm(
            //                     __('Do you want to submit the linked journal? This action cannot be undone.'),
            //                     function() {
            //                         verify_and_submit_journal(frm);
            //                     },
            //                     function() {
            //                         prompt_for_remarks_no_verify(frm);
            //                     }
            //                 );
            //             });
            //         }
            //     }).catch(err => {
            //         frappe.msgprint({
            //             title: __('Error'),
            //             message: __('Error checking button visibility: ') + err.message,
            //             indicator: 'red'
            //         });
            //     });
            // }

            // Add Make Payment button
            if (frm.doc.status === 'Payment Due' && frm.doc.payment_status === 'Due') {
                frappe.call({
                    method: 'autowings_app.custom_scripts.utils.can_show_button',
                    args: {
                        link_doc: frm.doc.doctype,
                        button_name: 'Make Payment'
                    },
                    callback: function(r) {
                        if (r.message) {

                frm.add_custom_button(__('Make Payment'), function() {
                    _rsa_payment_entry_action(frm);
                });
            }
            }
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

// Log activity to RSA Activity Log child table
function log_rsa_activity(frm, activity, status, remarks) {
    try {
        let activity_log = {
            doctype: 'RTO Activity Log',
            activity: activity,
            status: status,
            user: frappe.session.user,
            update_on: frappe.datetime.now_datetime(),
            remarks: (remarks || '').substring(0, 140), // Truncate to 140 characters
            parent: frm.doc.name,
            parentfield: 'rsa_activity',
            parenttype: 'Vehicle RSA'
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

function show_update_rsa_dialog(frm) {
    try {
        let fields = [
            {
                label: __('RSA Provider'),
                fieldname: 'rsa_provider',
                fieldtype: 'Link',
                options: 'Supplier',
                default: frm.doc.rsa_provider || '',
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
                label: __('RSA Amount'),
                fieldname: 'rsa_amount',
                fieldtype: 'Currency',
                default: frm.doc.rsa_amount || 0,
                reqd: 1
            },
            {
                label: __('RSA Policy Number'),
                fieldname: 'rsa_policy_number',
                fieldtype: 'Data',
                default: frm.doc.rsa_policy_number || '',
                reqd: 1
            },
            {
                label: __('RSA Start Date'),
                fieldname: 'rsa_start_date',
                fieldtype: 'Date',
                default: frm.doc.rsa_start_date || frappe.datetime.now_date(),
                reqd: 1
            },
            {
                label: __('RSA End Date'),
                fieldname: 'rsa_end_date',
                fieldtype: 'Date',
                default: frm.doc.rsa_end_date || '',
                read_only: 1
            }
        ];

        let dialog = new frappe.ui.Dialog({
            title: __('Update RSA Details'),
            fields: fields,
            primary_action_label: __('Update'),
            primary_action: function(values) {
                try {
                    // Validate inputs
                    if (!values.rsa_provider) {
                        frappe.throw(__('RSA Provider is mandatory.'));
                    }
                    if (!values.policy_name) {
                        frappe.throw(__('Policy Name is mandatory.'));
                    }
                    if (values.rsa_amount <= 0) {
                        frappe.throw(__('RSA Amount must be greater than zero.'));
                    }
                    if (!values.rsa_policy_number) {
                        frappe.throw(__('RSA Policy Number is mandatory.'));
                    }
                    if (!values.rsa_start_date) {
                        frappe.throw(__('RSA Start Date is mandatory.'));
                    }

                    // Check if any fields have changed
                    let has_changes = (
                        values.rsa_provider !== (frm.doc.rsa_provider || '') ||
                        values.policy_name !== (frm.doc.policy_name || '') ||
                        values.rsa_amount !== (frm.doc.rsa_amount || 0) ||
                        values.rsa_policy_number !== (frm.doc.rsa_policy_number || '') ||
                        values.rsa_start_date !== (frm.doc.rsa_start_date || '') ||
                        values.rsa_end_date !== (frm.doc.rsa_end_date || '')
                    );

                    // Refresh the document to avoid TimestampMismatchError
                    frm.reload_doc().then(() => {
                        // Update frm.doc with dialog values
                        frm.doc.rsa_provider = values.rsa_provider;
                        frm.doc.policy_name = values.policy_name;
                        frm.doc.rsa_amount = values.rsa_amount;
                        frm.doc.rsa_policy_number = values.rsa_policy_number;
                        frm.doc.rsa_start_date = values.rsa_start_date;
                        frm.doc.rsa_end_date = values.rsa_end_date;
                        frm.doc.rsa_status = 'Active';
                        frm.doc.status = 'Due Verification';
                        frm.doc.workflow_state = '';

                        // Save the document
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: frm.doctype,
                                name: frm.docname,
                                fieldname: {
                                    rsa_provider: values.rsa_provider,
                                    policy_name: values.policy_name,
                                    rsa_amount: values.rsa_amount,
                                    rsa_policy_number: values.rsa_policy_number,
                                    rsa_start_date: values.rsa_start_date,
                                    rsa_end_date: values.rsa_end_date,
                                    rsa_status: 'Active',
                                    status: 'Due Verification',
                                    workflow_state: ''
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    if (has_changes) {
                                        log_rsa_activity(frm, 'Updated RSA Details', 'RSA Details Updated', 'RSA details updated');
                                    }
                                    update_journal(frm, values.rsa_amount, dialog, has_changes);
                                } else {
                                    log_rsa_activity(frm, 'Updated RSA Details', 'RSA Details Update Failed', 'Failed to update RSA');
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to save RSA details: ') + (r.exc || 'Unknown error'),
                                        indicator: 'red'
                                    });
                                    dialog.hide();
                                }
                            },
                            error: function(err) {
                                log_rsa_activity(frm, 'Updated RSA Details', 'RSA Details Update Failed', 'Error updating RSA');
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('Error updating RSA: ') + (err.message || 'Unknown error'),
                                    indicator: 'red'
                                });
                                dialog.hide();
                            }
                        });
                    }).catch((err) => {
                        log_rsa_activity(frm, 'Updated RSA Details', 'RSA Details Update Failed', 'Failed to refresh document');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to refresh document: ') + err.message,
                            indicator: 'red'
                        });
                        dialog.hide();
                    });
                } catch (e) {
                    log_rsa_activity(frm, 'Updated RSA Details', 'RSA Details Update Failed', 'Error processing update');
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

        // Function to update end date based on start date and policy validity
        function update_end_date() {
            let rsa_provider = dialog.fields_dict.rsa_provider.get_value();
            let policy_name = dialog.fields_dict.policy_name.get_value();
            let start_date = dialog.fields_dict.rsa_start_date.get_value();

            if (rsa_provider && policy_name && start_date) {
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Supplier',
                        name: rsa_provider
                    },
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let policies = r.message.custom_under_rsa_group || [];
                            let selected_policy = policies.find(p => p.policy_name === policy_name);
                            
                            if (selected_policy) {
                                // Calculate RSA end date
                                let validity_years = selected_policy.validity_period || 0;
                                let end_date = frappe.datetime.add_months(
                                    start_date,
                                    validity_years * 12
                                );
                                // Subtract one day to get the correct end date
                                end_date = frappe.datetime.add_days(end_date, -1);
                                dialog.fields_dict.rsa_end_date.set_value(end_date);
                            } else {
                                dialog.fields_dict.rsa_end_date.set_value('');
                            }
                        } else {
                            dialog.fields_dict.rsa_end_date.set_value('');
                        }
                    },
                    error: function(err) {
                        dialog.fields_dict.rsa_end_date.set_value('');
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error fetching supplier: ') + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            } else {
                dialog.fields_dict.rsa_end_date.set_value('');
            }
        }

        // Add onchange handler for rsa_provider
        dialog.fields_dict.rsa_provider.$input.on('change', function() {
            let rsa_provider = dialog.fields_dict.rsa_provider.get_value();
            let policy_name_field = dialog.fields_dict.policy_name;

            if (rsa_provider) {
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Supplier',
                        name: rsa_provider
                    },
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let policies = r.message.custom_under_rsa_group || [];
                            let policy_options = policies.map(policy => policy.policy_name);

                            policy_name_field.df.fieldtype = 'Select';
                            policy_name_field.df.options = [''].concat(policy_options);
                            policy_name_field.refresh();

                            let current_policy = frm.doc.policy_name && policy_options.includes(frm.doc.policy_name)
                                ? frm.doc.policy_name
                                : '';
                            policy_name_field.set_value(current_policy);

                            update_end_date();
                        } else {
                            policy_name_field.df.fieldtype = 'Data';
                            policy_name_field.df.options = null;
                            policy_name_field.set_value(frm.doc.policy_name || '');
                            policy_name_field.refresh();
                            dialog.fields_dict.rsa_end_date.set_value('');
                        }
                    },
                    error: function(err) {
                        policy_name_field.df.fieldtype = 'Data';
                        policy_name_field.df.options = null;
                        policy_name_field.set_value(frm.doc.policy_name || '');
                        policy_name_field.refresh();
                        dialog.fields_dict.rsa_end_date.set_value('');
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
                dialog.fields_dict.rsa_end_date.set_value('');
            }
        });

        // Add onchange handler for policy_name
        dialog.fields_dict.policy_name.$input.on('change', function() {
            update_end_date();
        });

        // Add onchange handler for rsa_start_date
        dialog.fields_dict.rsa_start_date.$input.on('change', function() {
            update_end_date();
        });

        dialog.show();
        // Trigger onchange for rsa_provider after dialog is rendered
        setTimeout(() => {
            dialog.fields_dict.rsa_provider.$input.trigger('change');
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
                        frm.doc.rsa_provider
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
                                            log_rsa_activity(frm, 'Updated RSA Details', 'Journal Updated', 'Journal updated');
                                        }
                                        finalize_update(frm, dialog, has_changes);
                                    })
                                    .catch(err => {
                                        log_rsa_activity(frm, 'Updated RSA Details', 'Journal Update Failed', 'Error updating journal');
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: err.message || 'Error updating journal',
                                            indicator: 'red'
                                        });
                                        dialog.hide();
                                    });
                            } else {
                                log_rsa_activity(frm, 'Updated RSA Details', 'Account Validation Failed', 'Invalid accounts');
                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    message: 'One or more accounts are invalid',
                                    indicator: 'red'
                                });
                                dialog.hide();
                            }
                        },
                        error: function(err) {
                            log_rsa_activity(frm, 'Updated RSA Details', 'Account Validation Failed', 'Error validating accounts');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error validating accounts: ' + (err.message || 'Unknown error'),
                                indicator: 'red'
                            });
                            dialog.hide();
                        }
                    });
                } else {
                    log_rsa_activity(frm, 'Updated RSA Details', 'Company Abbreviation Fetch Failed', 'Failed to fetch company abbreviation');
                    frappe.msgprint({
                        title: __('Error'),
                        message: 'Error fetching company abbreviation',
                        indicator: 'red'
                    });
                    dialog.hide();
                }
            },
            error: function(err) {
                log_rsa_activity(frm, 'Updated RSA Details', 'Company Abbreviation Fetch Failed', 'Error fetching company abbreviation');
                frappe.msgprint({
                    title: __('Error'),
                    message: 'Error fetching company abbreviation: ' + (err.message || 'Unknown error'),
                    indicator: 'red'
                });
                dialog.hide();
            }
        });
    } catch (e) {
        log_rsa_activity(frm, 'Updated RSA Details', 'Journal Update Failed', 'Error updating journal');
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
            acc.against_account.includes(frm.doc.rsa_provider)
        );
        let payableAccount = journal.accounts.find(acc => 
            acc.account === `${frm.doc.rsa_provider} Payable - ${company_abbr}` && 
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
                    against_account: frm.doc.rsa_provider
                },
                {
                    account: `${frm.doc.rsa_provider} Payable - ${company_abbr}`,
                    party_type: 'Supplier',
                    party: frm.doc.rsa_provider,
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
                        doctype: 'Vehicle RSA',
                        name: frm.doc.name,
                        fieldname: {
                            status: new_status,
                            journal_status: frm.doc.journal_entry_id ? 'Submitted' : frm.doc.journal_status,
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_rsa_activity(frm, 'Verified RSA with Journal Submission', 'RSA Verified', 'RSA verified');
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('RSA verified and journal submitted.'),
                                indicator: 'green'
                            });
                        } else {
                            log_rsa_activity(frm, 'Verified RSA with Journal Submission', 'RSA Verification Failed', 'Failed to update status');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error updating Vehicle RSA: ' + (r.exc || 'Unknown error'),
                                indicator: 'red'
                            });
                        }
                    },
                    error: function(err) {
                        log_rsa_activity(frm, 'Verified RSA with Journal Submission', 'RSA Verification Failed', 'Error updating status');
                        frappe.msgprint({
                            title: __('Error'),
                            message: 'Error updating Vehicle RSA: ' + (err.message || 'Unknown error'),
                            indicator: 'red'
                        });
                    }
                });
            })
            .catch(err => {
                log_rsa_activity(frm, 'Verified RSA with Journal Submission', 'RSA Verification Failed', 'Error submitting journal');
                frappe.msgprint({
                    title: __('Error'),
                    message: err.message || 'Error submitting journal',
                    indicator: 'red'
                });
            });
    } catch (e) {
        log_rsa_activity(frm, 'Verified RSA with Journal Submission', 'RSA Verification Failed', 'Error submitting journal');
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
                        doctype: 'Vehicle RSA',
                        name: frm.doc.name,
                        fieldname: {
                            status: 'Due Update',
                            workflow_state: ''
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_rsa_activity(frm, 'Verified RSA without Journal Submission', 'RSA Verification Skipped', values.remarks.substring(0, 140));
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('RSA verification skipped, status set to Due Update.'),
                                indicator: 'green'
                            });
                            remark_dialog.hide();
                        } else {
                            log_rsa_activity(frm, 'Verified RSA without Journal Submission', 'RSA Verification Skipped Failed', 'Failed to update status');
                            frappe.msgprint({
                                title: __('Error'),
                                message: 'Error updating status: ' + (r.exc || 'Unknown error'),
                                indicator: 'red'
                            });
                        }
                    },
                    error: function(err) {
                        log_rsa_activity(frm, 'Verified RSA without Journal Submission', 'RSA Verification Skipped Failed', 'Error updating status');
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
        log_rsa_activity(frm, 'Verified RSA without Journal Submission', 'RSA Verification Skipped Failed', 'Error prompting for remarks');
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
                message: __('RSA details updated successfully.'),
                indicator: 'green'
            });
        } else {
            frappe.msgprint({
                title: __('No Changes'),
                message: __('No changes were made to the RSA details.'),
                indicator: 'orange'
            });
        }
        dialog.hide();
    } catch (e) {
        log_rsa_activity(frm, 'Updated RSA Details', 'Finalize Update Failed', 'Error finalizing update');
        frappe.msgprint({
            title: __('Error'),
            message: 'Error finalizing update: ' + e.message,
            indicator: 'red'
        });
        dialog.hide();
    }
}

// Function to handle RSA payment entry redirection
function _rsa_payment_entry_action(frm) {
    try {
        // Validate RSA Provider
        if (!frm.doc.rsa_provider) {
            log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', 'RSA Provider is mandatory.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('RSA Provider is mandatory to proceed with payment entry.'),
                indicator: 'red'
            });
            return;
        }

        // Validate RSA Amount
        if (!frm.doc.rsa_amount || frm.doc.rsa_amount <= 0) {
            log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', 'RSA Amount must be greater than zero.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('RSA Amount must be greater than zero.'),
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
                    let paid_to_account = `${frm.doc.rsa_provider} Payable - ${company_abbr}`;

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
                                log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', `Account ${paid_to_account} does not exist.`);
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
                                `party=${encodeURIComponent(frm.doc.rsa_provider)}&` +
                                `party_name=${encodeURIComponent(frm.doc.rsa_provider)}&` +
                                `paid_to=${encodeURIComponent(paid_to_account)}&` +
                                `paid_amount=${frm.doc.rsa_amount}&` +
                                `reference_doctype=Vehicle RSA&` +
                                `reference_name=${frm.doc.name}`;

                            // Log activity for payment initiation
                            log_rsa_activity(frm, 'Payment Initiated', 'Payment Entry Started', '');
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Redirecting to Payment Entry form.'),
                                indicator: 'green'
                            });

                            // Redirect to Payment Entry form
                            window.location.href = payment_entry_url;
                        },
                        error: function(err) {
                            log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', err.message || JSON.stringify(err));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                        }
                    });
                } else {
                    log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error retrieving company abbreviation: ') + (r.exc || JSON.stringify(r)),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error retrieving company abbreviation: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
            }
        });
    } catch (err) {
        log_rsa_activity(frm, 'Payment Attempted', 'Payment Failed', err.message || JSON.stringify(err));
        frappe.msgprint({
            title: __('Error'),
            message: __('Unexpected error: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
    }
}


// for vehicle_rsa.js
frappe.ui.form.on("Vehicle RSA", {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        frm.add_custom_button(__("Cancel Journal Entry"), function() {
            // Prompt for confirmation
            frappe.confirm(
                __("Are you sure you want to cancel or delete the linked Journal Entry?"),
                function() {
                    // Proceed with the server-side call if confirmed
                    frappe.call({
                        method: "autowings_app.custom_scripts.vehicle_sales_journal_cancel.cancel_journal_entry_rsa",
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


// create rsa if not created during sales invoice
console.log("Vehicle RSA script initialized");

// Displays error message to user
function showError(message) {
    frappe.msgprint({
        title: __('Error'),
        indicator: 'red',
        message: message
    });
}

// Displays success message to user
function showSuccess(message) {
    frappe.msgprint({
        title: __('Success'),
        indicator: 'green',
        message: message
    });
}

frappe.ui.form.on("Vehicle RSA", {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm); // Assumed to be defined elsewhere
        // Add custom button "Create Vehicle RSA"
        frm.add_custom_button(__("Create Vehicle RSA"), function() {
            // Create a dialog for input
            let d = new frappe.ui.Dialog({
                title: __("Create Vehicle RSA"),
                fields: [
                    {
                        label: __("Sales Invoice"),
                        fieldname: "sales_invoice",
                        fieldtype: "Link",
                        options: "Sales Invoice",
                        reqd: 1,
                        get_query: function() {
                            return {
                                filters: {
                                    docstatus: 1 // Only submitted Sales Invoices
                                }
                            };
                        },
                        onchange: function() {
                            const si = d.get_value("sales_invoice");
                            if (si) {
                                // Check if Vehicle RSA exists
                                frappe.call({
                                    method: "frappe.client.get_list",
                                    args: {
                                        doctype: "Vehicle RSA",
                                        filters: { sales_invoice: si },
                                        limit: 1
                                    },
                                    callback: function(res) {
                                        if (res.message.length > 0) {
                                            showError(__("Vehicle RSA already exists for Sales Invoice {0}.", [si]));
                                            d.set_value("sales_invoice", "");
                                            d.set_value("customer_name", "");
                                            d.set_value("customer", "");
                                            d.set_value("chassis_number", "");
                                            d.set_value("vsm_id", "");
                                            return;
                                        }
                                        // Fetch customer_name, customer, chassis_number, and vsm_id
                                        frappe.call({
                                            method: "frappe.client.get",
                                            args: {
                                                doctype: "Sales Invoice",
                                                name: si,
                                                fields: ["customer_name", "customer", "custom_vin", "custom_vsm_id"]
                                            },
                                            callback: function(r) {
                                                if (r.message) {
                                                    d.set_value("customer_name", r.message.customer_name || "");
                                                    d.set_value("customer", r.message.customer || "");
                                                    d.set_value("vsm_id", r.message.custom_vsm_id || "");
                                                    if (r.message.custom_vin?.length === 1) {
                                                        d.set_value("chassis_number", r.message.custom_vin[0].chassis_number);
                                                    } else {
                                                        d.set_value("chassis_number", "");
                                                        showError(__("VIN issue in Sales Invoice {0}. Please enter Chassis Number manually.", [si]));
                                                        d.fields_dict.chassis_number.df.read_only = 0;
                                                    }
                                                }
                                            },
                                            error: function(err) {
                                                console.error("Error fetching Sales Invoice:", err);
                                                showError(__("Failed to fetch Sales Invoice details: {0}", [err.message]));
                                                d.set_value("customer_name", "");
                                                d.set_value("customer", "");
                                                d.set_value("chassis_number", "");
                                                d.set_value("vsm_id", "");
                                                d.fields_dict.chassis_number.df.read_only = 0;
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    },
                    {
                        label: __("Customer Name"),
                        fieldname: "customer_name",
                        fieldtype: "Data",
                        read_only: 1
                    },
                    {
                        label: __("Customer"),
                        fieldname: "customer",
                        fieldtype: "Link",
                        options: "Customer",
                        hidden: 1,
                        read_only: 1
                    },
                    {
                        label: __("Vehicle Sales Master"),
                        fieldname: "vsm_id",
                        fieldtype: "Link",
                        options: "Vehicle Sales Master",
                        hidden: 1,
                        read_only: 1
                    },
                    {
                        label: __("Chassis Number"),
                        fieldname: "chassis_number",
                        fieldtype: "Data",
                        read_only: 1
                    },
                    {
                        label: __("RSA Provider"),
                        fieldname: "rsa_provider",
                        fieldtype: "Link",
                        options: "Supplier",
                        reqd: 1,
                        get_query: function() {
                            return {
                                filters: {
                                    supplier_group: "RSA Group"
                                }
                            };
                        }
                    },
                    {
                        label: __("RSA Amount"),
                        fieldname: "rsa_amount",
                        fieldtype: "Float",
                        reqd: 1
                    }
                ],
                primary_action_label: __("Create"),
                primary_action: async function(values) {
                    try {
                        // Validate for existing Vehicle RSA
                        const rsa_check = await frappe.call({
                            method: "frappe.client.get_list",
                            args: {
                                doctype: "Vehicle RSA",
                                filters: { sales_invoice: values.sales_invoice },
                                limit: 1
                            }
                        });
                        if (rsa_check.message.length > 0) {
                            showError(__("Vehicle RSA already exists for Sales Invoice {0}.", [values.sales_invoice]));
                            return;
                        }

                        // Create Vehicle RSA
                        const response = await frappe.call({
                            method: "autowings_app.autowings_app.doctype.vehicle_rsa.vehicle_rsa.create_vehicle_rsa_from_sales_invoice",
                            args: {
                                sales_invoice: values.sales_invoice,
                                rsa_provider: values.rsa_provider,
                                rsa_amount: values.rsa_amount,
                                customer: values.customer,
                                vsm_id: values.vsm_id,
                                chassis_number: values.chassis_number
                            }
                        });

                        if (response.message) {
                            frappe.set_route("Form", "Vehicle RSA", response.message);
                            showSuccess(__("Vehicle RSA {0} created successfully.", [response.message]));
                        }
                    } catch (err) {
                        console.error("Error creating Vehicle RSA:", err);
                        showError(__("Failed to create Vehicle RSA: {0}", [err.message]));
                    }
                    d.hide();
                },
                secondary_action_label: __("Cancel"),
                secondary_action: function() {
                    d.hide();
                }
            });
            d.show();
        }, __("Actions"));
    }
});