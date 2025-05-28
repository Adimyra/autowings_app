frappe.ui.form.on('Serial No', {
    onload: function(frm) {
        // Add custom button to the Serial No form
        frm.add_custom_button(__('Show VSM Details'), function() {
            // Get the custom_vsm_id from the form
            let vsm_id = frm.doc.custom_vsm_id;
            if (!vsm_id) {
                frappe.msgprint(__('No VSM ID found in this Serial No document.'));
                return;
            }

            // Make a server-side call to fetch VSM details
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Vehicle Sales Master',
                    name: vsm_id
                },
                callback: function(response) {
                    if (response.message) {
                        let vsm = response.message;

                        // Fetch RTO Registration details
                        frappe.call({
                            method: 'frappe.client.get',
                            args: {
                                doctype: 'RTO Registration',
                                name: vsm.rto_registration_id
                            },
                            callback: function(rto_response) {
                                let rto = rto_response.message || {};
                                
                                // Since Sales Invoice doc is not provided, assume posting date is unavailable
                                let posting_date = 'Unavailable (Sales Invoice document not provided)';

                                // Prepare modal content
                                let modal_content = `
                                    <div class="mb-4">
                                        <h2 class="text-xl font-bold">Vehicle Sales Master Details</h2>
                                        <p><strong>VSM ID:</strong> ${vsm.name}</p>
                                        <p><strong>Sales Invoice:</strong> ${vsm.sales_invoice}</p>
                                        <p><strong>Posting Date:</strong> ${posting_date}</p>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h3 class="text-lg font-semibold">Vehicle Information</h3>
                                        <p><strong>Chassis Number:</strong> ${vsm.chassis_number}</p>
                                        <p><strong>Vehicle Color:</strong> ${vsm.vehicle_color}</p>
                                        <p><strong>Engine Number:</strong> ${vsm.engine_number}</p>
                                        <p><strong>Manufacturing Date:</strong> ${vsm.manufacturing_date}</p>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h3 class="text-lg font-semibold">RTO Registration Details</h3>
                                        <p><strong>RTO Registration ID:</strong> ${rto.name || 'N/A'}</p>
                                        <p><strong>Customer:</strong> ${rto.customer || 'N/A'}</p>
                                        <p><strong>Sales Invoice:</strong> ${rto.sales_invoice || 'N/A'}</p>
                                        <p><strong>Journal Entry ID:</strong> ${rto.journal_entry_id || 'N/A'}</p>
                                        <p><strong>Journal Status:</strong> ${rto.journal_status || 'N/A'}</p>
                                        <p><strong>Chassis Number:</strong> ${rto.chassis_number || 'N/A'}</p>
                                        <p><strong>Status:</strong> ${rto.status || 'N/A'}</p>
                                        <p><strong>Registration Status:</strong> ${rto.registration_status || 'N/A'}</p>
                                        <p><strong>RTO Office:</strong> ${rto.rto_office || 'N/A'}</p>
                                        <p><strong>Registration Charge:</strong> ${rto.registration_charge || 'N/A'}</p>
                                        <p><strong>Application Entry Date:</strong> ${rto.application_entry_date || 'N/A'}</p>
                                        <p><strong>Application Number:</strong> ${rto.application_number || 'N/A'}</p>
                                        <p><strong>Registration Number:</strong> ${rto.registration_number || 'N/A'}</p>
                                        <p><strong>Number Plate Ordered:</strong> ${rto.number_plate_ordered ? 'Yes' : 'No'}</p>
                                        <p><strong>Number Plate Order Details:</strong> ${rto.number_plate_order_details || 'N/A'}</p>
                                        <p><strong>Order Date:</strong> ${rto.order_date || 'N/A'}</p>
                                        <p><strong>Number Plate Received:</strong> ${rto.number_plate_received ? 'Yes' : 'No'}</p>
                                        <p><strong>Number Plate Received Details:</strong> ${rto.number_plate_received_details || 'N/A'}</p>
                                        <p><strong>Received Date:</strong> ${rto.received_date || 'N/A'}</p>
                                        <p><strong>Number Plate Installed:</strong> ${rto.number_plate_installed ? 'Yes' : 'No'}</p>
                                        <p><strong>Document Submitted to DTO:</strong> ${rto.document_submitted_to_dto ? 'Yes' : 'No'}</p>
                                        <p><strong>Document Received from DTO:</strong> ${rto.document_received_from_dto ? 'Yes' : 'No'}</p>
                                        <p><strong>Handover to Customer:</strong> ${rto.handover_to_customer ? 'Yes' : 'No'}</p>
                                        <p><strong>Payment Date:</strong> ${rto.payment_date || 'N/A'}</p>
                                        <p><strong>Payment Reference:</strong> ${rto.payment_reference || 'N/A'}</p>
                                        <p><strong>Payment Status:</strong> ${rto.payment_status || 'N/A'}</p>
                                        <p><strong>Payment Entry ID:</strong> ${rto.payment_entry_id || 'N/A'}</p>
                                        
                                        <h4 class="text-md font-semibold mt-4">RTO Activity Log</h4>
                                        <ul class="list-disc pl-5">
                                            ${rto.rto_activity ? rto.rto_activity.map(activity => `
                                                <li>
                                                    <strong>Activity:</strong> ${activity.activity},
                                                    <strong>Status:</strong> ${activity.status},
                                                    <strong>Update On:</strong> ${activity.update_on}
                                                    ${activity.remarks ? `, <strong>Remarks:</strong> ${activity.remarks}` : ''}
                                                </li>
                                            `).join('') : '<li>No activities found</li>'}
                                        </ul>
                                        
                                        <h4 class="text-md font-semibold mt-4">Additional Accounts</h4>
                                        ${rto.additional_accounts ? `
                                            <p><strong>Smart Card ID:</strong> ${rto.additional_accounts[0].smart_card_id}</p>
                                            <p><strong>Account:</strong> ${rto.additional_accounts[0].account}</p>
                                            <p><strong>Amount:</strong> ${rto.additional_accounts[0].amount}</p>
                                            <p><strong>Journal Entry ID:</strong> ${rto.additional_accounts[0].journal_entry_id}</p>
                                            <p><strong>Status:</strong> ${rto.additional_accounts[0].status}</p>
                                            <p><strong>Payment Status:</strong> ${rto.additional_accounts[0].payment_status}</p>
                                        ` : '<p>No additional accounts found</p>'}
                                    </div>
                                    
                                    <div class="mt-4">
                                        <h3 class="text-lg font-semibold">Full VSM Details</h3>
                                        <pre class="bg-gray-100 p-4 rounded">${JSON.stringify(vsm, null, 2)}</pre>
                                    </div>
                                `;

                                // Create and show the modal dialog
                                let dialog = new frappe.ui.Dialog({
                                    title: __('VSM Details'),
                                    fields: [
                                        {
                                            fieldtype: 'HTML',
                                            options: `<div style="font-family: Arial, sans-serif;">${modal_content}</div>`
                                        }
                                    ],
                                    primary_action_label: __('Close'),
                                    primary_action: function() {
                                        dialog.hide();
                                    }
                                });
                                dialog.show();
                            },
                            error: function() {
                                frappe.msgprint(__('Failed to fetch RTO Registration details.'));
                            }
                        });
                    } else {
                        frappe.msgprint(__('Vehicle Sales Master not found for ID: ') + vsm_id);
                    }
                },
                error: function() {
                    frappe.msgprint(__('Error fetching VSM details.'));
                }
            });
        });
    }
});