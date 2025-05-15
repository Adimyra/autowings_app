
frappe.listview_settings['RTO Registration'] = {
    onload: function(listview) {
        // Custom Button 1: Receive Documents from DTO (moved to Bulk Actions dropdown)
        listview.page.add_actions_menu_item(__("Receive Documents from DTO"), function() {
            // Fetch all RTO Registration documents with status "Documents Not Received from DTO"
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'RTO Registration',
                    filters: { status: 'Documents Not Received from DTO' },
                    fields: ['name', 'customer', 'chassis_number', 'modified'],
                    limit_page_length: 0
                },
                callback: function(response) {
                    const eligible_docs = response.message || [];
                    console.log("Eligible Documents (status = Documents Not Received from DTO):", eligible_docs);

                    if (eligible_docs.length === 0) {
                        frappe.msgprint({
                            title: __('No Eligible Documents'),
                            message: __('No RTO Registration documents with status "Documents Not Received from DTO" found.'),
                            indicator: 'orange'
                        });
                        return;
                    }

                    // Prepare HTML for dialog
                    let dialog_html = '<div style="margin-bottom: 20px;">';
                    dialog_html += '<h4 style="color: green;">' + __('Documents Not Received from DTO') + '</h4>';
                    dialog_html += `
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #28a745; padding: 10px; margin-bottom: 20px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #e9f7ef;">
                                        <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">
                                            <input type="checkbox" id="select-all-docs">
                                        </th>
                                        <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">ID</th>
                                        <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">Customer</th>
                                        <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">Chassis Number</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                    eligible_docs.forEach(doc => {
                        dialog_html += `
                            <tr>
                                <td style="border: 1px solid #28a745; padding: 8px;">
                                    <input type="checkbox" class="eligible-doc" data-name="${doc.name}">
                                </td>
                                <td style="border: 1px solid #28a745; padding: 8px;">
                                    <a href="/app/rto-registration/${doc.name}" target="_blank">${doc.name}</a>
                                </td>
                                <td style="border: 1px solid #28a745; padding: 8px;">${doc.customer || 'N/A'}</td>
                                <td style="border: 1px solid #28a745; padding: 8px;">${doc.chassis_number || 'N/A'}</td>
                            </tr>`;
                    });
                    dialog_html += `
                                </tbody>
                            </table>
                        </div>`;
                    dialog_html += '</div>';

                    // Create dialog fields
                    let dialog_fields = [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'doc_list',
                            options: dialog_html
                        },
                        {
                            label: __('Received Date'),
                            fieldname: 'doc_rec_date',
                            fieldtype: 'Datetime',
                            reqd: 1,
                            default: frappe.datetime.now_datetime()
                        },
                        {
                            label: __('Remarks'),
                            fieldname: 'doc_rec_remarks',
                            fieldtype: 'Small Text'
                        }
                    ];

                    // Create dialog
                    let dialog = new frappe.ui.Dialog({
                        title: __('Receive Documents from DTO'),
                        fields: dialog_fields,
                        primary_action_label: __('Receive'),
                        primary_action: function(values) {
                            if (!values.doc_rec_date) {
                                frappe.throw(__('Received Date is mandatory.'));
                            }

                            // Get checked documents
                            let checked_docs = [];
                            dialog.$wrapper.find('.eligible-doc:checked').each(function() {
                                checked_docs.push($(this).data('name'));
                            });
                            console.log("Checked Documents for Processing:", checked_docs);

                            if (checked_docs.length === 0) {
                                frappe.msgprint({
                                    title: __('No Documents Selected'),
                                    message: __('Please select at least one document to receive.'),
                                    indicator: 'orange'
                                });
                                return;
                            }

                            // Submit documents with retry mechanism
                            const receive_doc = (doc_name, retry_count = 0, max_retries = 3) => {
                                let doc = eligible_docs.find(d => d.name === doc_name);
                                if (!doc) {
                                    console.log(`Document ${doc_name} not found in eligible_docs`);
                                    return;
                                }

                                console.log(`Processing document: ${doc_name}`);
                                frappe.call({
                                    method: 'frappe.client.set_value',
                                    args: {
                                        doctype: 'RTO Registration',
                                        name: doc.name,
                                        fieldname: {
                                            doc_rec_date: values.doc_rec_date,
                                            doc_rec_remarks: values.doc_rec_remarks || '',
                                            document_received_from_dto: 1,
                                            status: 'Due Scanning RC'
                                        }
                                    },
                                    callback: function(r) {
                                        if (!r.exc) {
                                            log_rto_activity(doc, 'Documents Received from DTO', 'Receipt Confirmed', values.doc_rec_remarks);
                                            frappe.msgprint({
                                                title: __('Success'),
                                                message: __('Documents received from DTO for {0}.', [doc.name]),
                                                indicator: 'green'
                                            });
                                        } else if (r.exc.includes('TimestampMismatchError') && retry_count < max_retries) {
                                            console.log(`TimestampMismatchError for ${doc_name}, retrying (${retry_count + 1}/${max_retries})`);
                                            frappe.call({
                                                method: 'frappe.client.get',
                                                args: {
                                                    doctype: 'RTO Registration',
                                                    name: doc.name,
                                                    fields: ['name', 'customer', 'chassis_number', 'modified']
                                                },
                                                callback: function(refresh_response) {
                                                    if (refresh_response.message) {
                                                        eligible_docs = eligible_docs.map(d => d.name === doc.name ? refresh_response.message : d);
                                                        receive_doc(doc_name, retry_count + 1, max_retries);
                                                    }
                                                }
                                            });
                                        } else {
                                            log_rto_activity(doc, 'Documents Received from DTO', 'Receipt Failed', r.exc || JSON.stringify(r));
                                            frappe.msgprint({
                                                title: __('Error'),
                                                message: __('Error confirming receipt for {0}: {1}', [doc.name, r.exc || JSON.stringify(r)]),
                                                indicator: 'red'
                                            });
                                        }
                                    },
                                    error: function(err) {
                                        log_rto_activity(doc, 'Documents Received from DTO', 'Receipt Failed', err.message || JSON.stringify(err));
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: __('Error confirming receipt for {0}: {1}', [doc.name, err.message || JSON.stringify(err)]),
                                            indicator: 'red'
                                        });
                                    }
                                });
                            };

                            // Receive only checked documents
                            checked_docs.forEach(doc_name => receive_doc(doc_name));

                            dialog.hide();
                            listview.refresh();
                        },
                        secondary_action_label: __('Cancel'),
                        secondary_action: function() {
                            dialog.hide();
                            dialog.$wrapper.find('.eligible-doc:checked').each(function() {
                                let doc_name = $(this).data('name');
                                let doc = eligible_docs.find(d => d.name === doc_name);
                                if (doc) {
                                    log_rto_activity(doc, 'Document Receipt Cancelled', 'Receipt Cancelled', '');
                                }
                            });
                        }
                    });

                    // Add Select All functionality
                    dialog.on_page_show = function() {
                        console.log('Dialog shown, binding Select All event');
                        dialog.$wrapper.find('#select-all-docs').on('change', function() {
                            const is_checked = $(this).prop('checked');
                            console.log('Select All checkbox changed, checked:', is_checked);
                            dialog.$wrapper.find('.eligible-doc').prop('checked', is_checked);
                        });
                        dialog.$wrapper.find('.eligible-doc').on('change', function() {
                            console.log('Individual checkbox changed, total checked:', dialog.$wrapper.find('.eligible-doc:checked').length);
                            if (dialog.$wrapper.find('.eligible-doc:checked').length === dialog.$wrapper.find('.eligible-doc').length) {
                                dialog.$wrapper.find('#select-all-docs').prop('checked', true);
                            } else {
                                dialog.$wrapper.find('#select-all-docs').prop('checked', false);
                            }
                        });
                    };

                    dialog.show();
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error fetching RTO Registration documents: {0}', [err.message || JSON.stringify(err)]),
                        indicator: 'red'
                    });
                }
            });
        });

        // Custom Button 2: Submit Documents to DTO (moved to Bulk Actions dropdown)
        listview.page.add_actions_menu_item(__("Submit Documents to DTO"), function() {
            const selected_docs = listview.get_checked_items();
            if (selected_docs.length === 0) {
                frappe.msgprint({
                    title: __('No Selection'),
                    message: __('Please select at least one RTO Registration document.'),
                    indicator: 'orange'
                });
                return;
            }

            console.log("Selected Documents:", selected_docs);

            // Filter documents: only include those with status "Due Documents Submission to DTO"
            let filtered_docs = selected_docs.filter(doc => doc.status === 'Due Documents Submission to DTO');
            if (filtered_docs.length === 0) {
                frappe.msgprint({
                    title: __('No Eligible Documents'),
                    message: __('None of the selected documents have the status "Due Documents Submission to DTO".'),
                    indicator: 'orange'
                });
                return;
            }

            console.log("Filtered Documents (status = Due Documents Submission to DTO):", filtered_docs);

            // Fetch full RTO Registration documents to include child tables
            let doc_names = filtered_docs.map(doc => doc.name);
            let eligible_docs = [];
            let not_eligible_docs = [];

            // Process documents in batches
            let promises = doc_names.map(doc_name => {
                return new Promise((resolve, reject) => {
                    frappe.call({
                        method: 'frappe.client.get',
                        args: {
                            doctype: 'RTO Registration',
                            name: doc_name,
                            fields: ['name', 'status', 'customer', 'chassis_number', 'additional_accounts', 'modified']
                        },
                        callback: function(response) {
                            if (response.message) {
                                resolve(response.message);
                            } else {
                                reject(new Error(`Unable to fetch document ${doc_name}`));
                            }
                        },
                        error: function(err) {
                            reject(err);
                        }
                    });
                });
            });

            Promise.all(promises)
                .then(docs => {
                    console.log("Fetched Documents with Child Tables:", docs);

                    // Categorize documents
                    docs.forEach(doc => {
                        let all_payments_paid = true;
                        if (doc.additional_accounts && Array.isArray(doc.additional_accounts)) {
                            all_payments_paid = doc.additional_accounts.every(account => account.payment_status === 'Paid');
                        }

                        if (all_payments_paid) {
                            eligible_docs.push(doc);
                        } else {
                            not_eligible_docs.push(doc);
                        }
                    });

                    console.log("Eligible Documents:", eligible_docs);
                    console.log("Not Eligible Documents:", not_eligible_docs);

                    // Prepare HTML for dialog
                    let dialog_html = '<div style="margin-bottom: 20px;">';
                    dialog_html += '<h4 style="color: green;">' + __('Eligible for Submission') + '</h4>';
                    if (eligible_docs.length > 0) {
                        dialog_html += `
                            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #28a745; padding: 10px; margin-bottom: 20px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background-color: #e9f7ef;">
                                            <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">Select</th>
                                            <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">ID</th>
                                            <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">Customer</th>
                                            <th style="border: 1px solid #28a745; padding: 8px; text-align: left;">Chassis Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;
                        eligible_docs.forEach(doc => {
                            dialog_html += `
                                <tr>
                                    <td style="border: 1px solid #28a745; padding: 8px;">
                                        <input type="checkbox" class="eligible-doc" data-name="${doc.name}" checked>
                                    </td>
                                    <td style="border: 1px solid #28a745; padding: 8px;">
                                        <a href="/app/rto-registration/${doc.name}" target="_blank">${doc.name}</a>
                                    </td>
                                    <td style="border: 1px solid #28a745; padding: 8px;">${doc.customer || 'N/A'}</td>
                                    <td style="border: 1px solid #28a745; padding: 8px;">${doc.chassis_number || 'N/A'}</td>
                                </tr>`;
                        });
                        dialog_html += `
                                    </tbody>
                                </table>
                            </div>`;
                    } else {
                        dialog_html += '<p>' + __('No eligible documents found. All documents have due payments.') + '</p>';
                    }

                    dialog_html += '<h4 style="color: red;">' + __('Not Eligible (Payment Due)') + '</h4>';
                    if (not_eligible_docs.length > 0) {
                        dialog_html += '<div style="max-height: 200px; overflow-y: auto; border: 1px solid #dc3545; padding: 10px;">';
                        not_eligible_docs.forEach(doc => {
                            let due_accounts = (doc.additional_accounts || [])
                                .filter(account => account.payment_status === 'Due')
                                .map(account => ({
                                    smart_card_id: account.smart_card_id || 'N/A',
                                    account: account.account,
                                    payment_status: account.payment_status
                                }));

                            dialog_html += `
                                <div style="margin-bottom: 10px;">
                                    <strong>RTO ID: <a href="/app/rto-registration/${doc.name}" target="_blank">${doc.name}</a></strong><br>
                                    Reason: Smart Card Payment Due<br>`;
                            
                            if (due_accounts.length > 0) {
                                dialog_html += 'Details: ';
                                due_accounts.forEach(account => {
                                    dialog_html += `
                                        <span>
                                            ${account.account} -
                                            ${account.smart_card_id !== 'N/A' 
                                                ? `<a href="/app/vehicle-smart-card/${account.smart_card_id}" target="_blank">${account.smart_card_id}</a>` 
                                                : 'N/A'}, 
                                            Payment Status: ${account.payment_status}
                                        </span>, `;
                                });
                                dialog_html = dialog_html.slice(0, -2);
                                dialog_html += '<br>';
                            }
                            dialog_html += '</div>';
                        });
                        dialog_html += '</div>';
                    } else {
                        dialog_html += '<p>' + __('No documents with payment due.') + '</p>';
                    }
                    dialog_html += '</div>';

                    // Create dialog fields
                    let dialog_fields = [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'doc_list',
                            options: dialog_html
                        }
                    ];

                    if (eligible_docs.length > 0) {
                        dialog_fields.push(
                            {
                                label: __('Submission Date'),
                                fieldname: 'doc_sub_date',
                                fieldtype: 'Datetime',
                                reqd: 1,
                                default: frappe.datetime.now_datetime()
                            },
                            {
                                label: __('Remarks'),
                                fieldname: 'doc_sub_remarks',
                                fieldtype: 'Small Text'
                            }
                        );
                    }

                    // Create dialog
                    let dialog = new frappe.ui.Dialog({
                        title: __('Submit Documents to DTO'),
                        fields: dialog_fields,
                        primary_action_label: __('Submit'),
                        primary_action: function(values) {
                            if (eligible_docs.length > 0 && !values.doc_sub_date) {
                                frappe.throw(__('Submission Date is mandatory.'));
                            }

                            let checked_docs = [];
                            dialog.$wrapper.find('.eligible-doc:checked').each(function() {
                                checked_docs.push($(this).data('name'));
                            });

                            if (checked_docs.length === 0) {
                                frappe.msgprint({
                                    title: __('No Documents Selected'),
                                    message: __('Please select at least one eligible document to submit.'),
                                    indicator: 'orange'
                                });
                                return;
                            }

                            const submit_doc = (doc_name, retry_count = 0, max_retries = 3) => {
                                let doc = eligible_docs.find(d => d.name === doc_name);
                                if (!doc) return;

                                frappe.call({
                                    method: 'frappe.client.set_value',
                                    args: {
                                        doctype: 'RTO Registration',
                                        name: doc.name,
                                        fieldname: {
                                            doc_sub_date: values.doc_sub_date,
                                            doc_sub_remarks: values.doc_sub_remarks || '',
                                            document_submitted_to_dto: 1,
                                            status: 'Documents Not Received from DTO'
                                        }
                                    },
                                    callback: function(r) {
                                        if (!r.exc) {
                                            log_rto_activity(doc, 'Documents Submitted to DTO', 'Submission Completed', values.doc_sub_remarks);
                                            frappe.msgprint({
                                                title: __('Success'),
                                                message: __('Documents submitted to DTO for {0}.', [doc.name]),
                                                indicator: 'green'
                                            });
                                        } else if (r.exc.includes('TimestampMismatchError') && retry_count < max_retries) {
                                            frappe.call({
                                                method: 'frappe.client.get',
                                                args: {
                                                    doctype: 'RTO Registration',
                                                    name: doc.name,
                                                    fields: ['name', 'status', 'customer', 'chassis_number', 'additional_accounts', 'modified']
                                                },
                                                callback: function(refresh_response) {
                                                    if (refresh_response.message) {
                                                        eligible_docs = eligible_docs.map(d => d.name === doc.name ? refresh_response.message : d);
                                                        submit_doc(doc_name, retry_count + 1, max_retries);
                                                    }
                                                }
                                            });
                                        } else {
                                            log_rto_activity(doc, 'Documents Submitted to DTO', 'Submission Failed', r.exc || JSON.stringify(r));
                                            frappe.msgprint({
                                                title: __('Error'),
                                                message: __('Error submitting documents for {0}: {1}', [doc.name, r.exc || JSON.stringify(r)]),
                                                indicator: 'red'
                                            });
                                        }
                                    },
                                    error: function(err) {
                                        log_rto_activity(doc, 'Documents Submitted to DTO', 'Submission Failed', err.message || JSON.stringify(err));
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: __('Error submitting documents for {0}: {1}', [doc.name, err.message || JSON.stringify(err)]),
                                            indicator: 'red'
                                        });
                                    }
                                });
                            };

                            checked_docs.forEach(doc_name => submit_doc(doc_name));

                            dialog.hide();
                            listview.refresh();
                        },
                        secondary_action_label: __('Cancel'),
                        secondary_action: function() {
                            dialog.hide();
                            dialog.$wrapper.find('.eligible-doc:checked').each(function() {
                                let doc_name = $(this).data('name');
                                let doc = eligible_docs.find(d => d.name === doc_name);
                                if (doc) {
                                    log_rto_activity(doc, 'Document Submission Cancelled', 'Submission Cancelled', '');
                                }
                            });
                        }
                    });
                    dialog.show();
                })
                .catch(err => {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error fetching RTO Registration documents: {0}', [err.message || JSON.stringify(err)]),
                        indicator: 'red'
                    });
                });
        });
    }
};

function log_rto_activity(doc, activity, status, remarks) {
    frappe.call({
        method: 'frappe.client.insert',
        args: {
            doc: {
                doctype: 'RTO Activity Log',
                parent: doc.name,
                parenttype: 'RTO Registration',
                parentfield: 'rto_activity',
                activity: activity,
                status: status,
                user: frappe.session.user,
                update_on: frappe.datetime.now_datetime(),
                remarks: remarks || ''
            }
        },
        callback: function(r) {
            if (r.exc) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Failed to log activity for {0}: {1}', [doc.name, r.exc]),
                    indicator: 'red'
                });
            }
        },
        error: function(err) {
            frappe.msgprint({
                title: __('Error'),
                message: __('Failed to log activity for {0}: {1}', [doc.name, err.message || JSON.stringify(err)]),
                indicator: 'red'
            });
        }
    });
}