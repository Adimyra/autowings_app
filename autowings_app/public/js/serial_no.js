frappe.ui.form.on('Serial No', {
    onload: function(frm) {
        // Add custom button to always appear on the Serial No form
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

                        // Fetch Sales Invoice details to get posting_date
                        frappe.call({
                            method: 'frappe.client.get',
                            args: {
                                doctype: 'Sales Invoice',
                                name: vsm.sales_invoice
                            },
                            callback: function(invoice_response) {
                                let posting_date = invoice_response.message ? invoice_response.message.posting_date : 'N/A';

                                // Fetch RTO Registration details
                                frappe.call({
                                    method: 'frappe.client.get',
                                    args: {
                                        doctype: 'RTO Registration',
                                        name: vsm.rto_registration_id
                                    },
                                    callback: function(rto_response) {
                                        let rto = rto_response.message || {};

                                        // Fetch Vehicle Insurance details
                                        frappe.call({
                                            method: 'frappe.client.get',
                                            args: {
                                                doctype: 'Vehicle Insurance',
                                                name: vsm.insurance_id
                                            },
                                            callback: function(insurance_response) {
                                                let insurance = insurance_response.message || {};

                                                // Fetch Vehicle RSA details
                                                frappe.call({
                                                    method: 'frappe.client.get',
                                                    args: {
                                                        doctype: 'Vehicle RSA',
                                                        name: vsm.rsa_id
                                                    },
                                                    callback: function(rsa_response) {
                                                        let rsa = rsa_response.message || {};

                                                        // Fetch Vehicle Extended Warranty details
                                                        frappe.call({
                                                            method: 'frappe.client.get',
                                                            args: {
                                                                doctype: 'Vehicle Extended Warranty',
                                                                name: vsm.extended_warranty_id
                                                            },
                                                            callback: function(warranty_response) {
                                                                let warranty = warranty_response.message || {};

                                                                // Fetch Vehicle Finance details
                                                                frappe.call({
                                                                    method: 'frappe.client.get',
                                                                    args: {
                                                                        doctype: 'Vehicle Finance',
                                                                        name: vsm.finance_id
                                                                    },
                                                                    callback: function(finance_response) {
                                                                        let finance = finance_response.message || {};

                                                                        // Fetch Vehicle Misc Sales details
                                                                        frappe.call({
                                                                            method: 'frappe.client.get',
                                                                            args: {
                                                                                doctype: 'Vehicle Misc Sales',
                                                                                name: vsm.vehicle_misc_sales_id
                                                                            },
                                                                            callback: function(misc_response) {
                                                                                let misc = misc_response.message || {};

                                                                                // Prepare modal content with Tailwind CSS and separators
                                                                                let modal_content = `
                                                                                    <div class="p-6 bg-white rounded-lg shadow-lg">
                                                                                        <div class="mb-6">
                                                                                            <h2 class="text-2xl font-bold text-gray-800 mb-4">Vehicle Sales Master Details</h2>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">VSM ID:</span> <a href="/app/vehicle-sales-master/${vsm.name}" class="text-blue-600 hover:underline">${vsm.name}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Sales Invoice:</span> ${vsm.sales_invoice}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Posting Date:</span> ${posting_date}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Vehicle Information</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Chassis Number:</span> <a href="/app/serial-no/${vsm.chassis_number}" class="text-blue-600 hover:underline">${vsm.chassis_number}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Vehicle Color:</span> ${vsm.vehicle_color}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Engine Number:</span> ${vsm.engine_number}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Manufacturing Date:</span> ${vsm.manufacturing_date}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">RTO Registration Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">RTO Registration ID:</span> <a href="/app/rto-registration/${rto.name}" class="text-blue-600 hover:underline">${rto.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Status:</span> ${rto.status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RTO Office:</span> ${rto.rto_office || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Registration Charge:</span> ${rto.registration_charge || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Application Entry Date:</span> ${rto.application_entry_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Application Number:</span> ${rto.application_number || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Registration Number:</span> ${rto.registration_number || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Number Plate Ordered:</span> ${rto.number_plate_ordered ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Number Plate Received:</span> ${rto.number_plate_received ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Number Plate Installed:</span> ${rto.number_plate_installed ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Document Submitted to DTO:</span> ${rto.document_submitted_to_dto ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Document Received from DTO:</span> ${rto.document_received_from_dto ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Handover to Customer:</span> ${rto.handover_to_customer ? 'Yes' : 'No'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Status:</span> ${rto.payment_status || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Additional Accounts</h3>
                                                                                            ${rto.additional_accounts ? `
                                                                                                <div class="grid grid-cols-1 gap-2">
                                                                                                    <p><span class="font-semibold text-gray-600">Smart Card ID:</span> <a href="/app/vehicle-smart-card/${rto.additional_accounts[0].smart_card_id}" class="text-blue-600 hover:underline">${rto.additional_accounts[0].smart_card_id}</a></p>
                                                                                                    <p><span class="font-semibold text-gray-600">Account:</span> ${rto.additional_accounts[0].account}</p>
                                                                                                    <p><span class="font-semibold text-gray-600">Amount:</span> ${rto.additional_accounts[0].amount}</p>
                                                                                                    <p><span class="font-semibold text-gray-600">Status:</span> ${rto.additional_accounts[0].status}</p>
                                                                                                    <p><span class="font-semibold text-gray-600">Payment Status:</span> ${rto.additional_accounts[0].payment_status}</p>
                                                                                                </div>
                                                                                            ` : '<p class="text-gray-600">No additional accounts found</p>'}
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Smart Card Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Smart Card ID:</span> <a href="/app/vehicle-smart-card/${vsm.smart_card_id}" class="text-blue-600 hover:underline">${vsm.smart_card_id}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Smart Card Status:</span> ${vsm.smart_card_status || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Insurance Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Insurance ID:</span> <a href="/app/vehicle-insurance/${insurance.name}" class="text-blue-600 hover:underline">${insurance.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Insurance Status:</span> ${insurance.insurance_status || vsm.insurance_status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Insurance Provider:</span> ${insurance.insurance_provider || vsm.insurance_provider || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Policy Name:</span> ${insurance.policy_name || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Insurance Amount:</span> ${insurance.insurance_amount || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Insurance Policy Number:</span> ${insurance.insurance_policy_number || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Insurance Start Date:</span> ${insurance.insurance_start_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">OD End Date:</span> ${insurance.od_end_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">TP End Date:</span> ${insurance.tp_end_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Date:</span> ${insurance.payment_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Reference:</span> ${insurance.payment_reference || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Status:</span> ${insurance.payment_status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Entry ID:</span> ${insurance.payment_entry_id || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">RSA Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">RSA ID:</span> <a href="/app/vehicle-rsa/${rsa.name}" class="text-blue-600 hover:underline">${rsa.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA Status:</span> ${rsa.rsa_status || vsm.rsa_status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA Provider:</span> ${rsa.rsa_provider || vsm.rsa_provider || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Policy Name:</span> ${rsa.policy_name || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA Amount:</span> ${rsa.rsa_amount || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA Policy Number:</span> ${rsa.rsa_policy_number || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA Start Date:</span> ${rsa.rsa_start_date || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">RSA End Date:</span> ${rsa.rsa_end_date || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Extended Warranty Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Extended Warranty ID:</span> <a href="/app/vehicle-extended-warranty/${warranty.name}" class="text-blue-600 hover:underline">${warranty.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Warranty Status:</span> ${warranty.warranty_status || vsm.warranty_status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Extended Warranty Provider:</span> ${warranty.extended_warranty_provider || vsm.warranty_provider || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Extended Warranty Amount:</span> ${warranty.extended_warranty_amount || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Validity Period:</span> ${warranty.validity_period || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Status:</span> ${warranty.payment_status || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Finance Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Finance ID:</span> <a href="/app/vehicle-finance/${finance.name}" class="text-blue-600 hover:underline">${finance.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Loan Status:</span> ${finance.loan_status || vsm.loan_status || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Finance Provider:</span> ${finance.finance_provider || vsm.finance_provider || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Loan Amount:</span> ${finance.loan_amount || vsm.loan_amount || 'N/A'}</p>
                                                                                                <p><span class="font-semibold text-gray-600">Payment Status:</span> ${finance.payment_status || 'N/A'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <hr class="my-6 border-gray-300">

                                                                                        <div class="mb-6">
                                                                                            <h3 class="text-xl font-semibold text-gray-800 mb-3">Miscellaneous Sales Details</h3>
                                                                                            <div class="grid grid-cols-1 gap-2">
                                                                                                <p><span class="font-semibold text-gray-600">Misc Sales ID:</span> <a href="/app/vehicle-misc-sales/${misc.name}" class="text-blue-600 hover:underline">${misc.name || 'N/A'}</a></p>
                                                                                                <p><span class="font-semibold text-gray-600">Status:</span> ${misc.status || vsm.misc_sales_status || 'N/A'}</p>
                                                                                            </div>
                                                                                            ${misc.misc_accounts && misc.misc_accounts.length > 0 ? `
                                                                                                <div class="mt-4">
                                                                                                    <h4 class="text-lg font-semibold text-gray-800 mb-3">Misc Accounts</h4>
                                                                                                    ${misc.misc_accounts.map(account => `
                                                                                                        <div class="grid grid-cols-1 gap-2 mb-4 border-t pt-2">
                                                                                                            <p><span class="font-semibold text-gray-600">Misc Account:</span> ${account.misc_account}</p>
                                                                                                            <p><span class="font-semibold text-gray-600">Amount:</span> ${account.amount}</p>
                                                                                                            <p><span class="font-semibold text-gray-600">Journal Entry ID:</span> ${account.journal_entry_id}</p>
                                                                                                            <p><span class="font-semibold text-gray-600">Payment Status:</span> ${account.payment_status}</p>
                                                                                                        </div>
                                                                                                    `).join('')}
                                                                                                </div>
                                                                                            ` : '<p class="text-gray-600 mt-4">No misc accounts found</p>'}
                                                                                        </div>
                                                                                    </div>
                                                                                `;

                                                                                // Create and show the modal dialog
                                                                                let dialog = new frappe.ui.Dialog({
                                                                                    title: __('VSM Details'),
                                                                                    fields: [
                                                                                        {
                                                                                            fieldtype: 'HTML',
                                                                                            options: `
                                                                                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                                                                                <div style="font-family: Arial, sans-serif;">${modal_content}</div>
                                                                                            `
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
                                                                                frappe.msgprint(__('Failed to fetch Vehicle Misc Sales details.'));
                                                                            }
                                                                        });
                                                                    },
                                                                    error: function() {
                                                                        frappe.msgprint(__('Failed to fetch Vehicle Finance details.'));
                                                                    }
                                                                });
                                                            },
                                                            error: function() {
                                                                frappe.msgprint(__('Failed to fetch Vehicle Extended Warranty details.'));
                                                            }
                                                        });
                                                    },
                                                    error: function() {
                                                        frappe.msgprint(__('Failed to fetch Vehicle RSA details.'));
                                                    }
                                                });
                                            },
                                            error: function() {
                                                frappe.msgprint(__('Failed to fetch Vehicle Insurance details.'));
                                            }
                                        });
                                    },
                                    error: function() {
                                        frappe.msgprint(__('Failed to fetch RTO Registration details.'));
                                    }
                                });
                            },
                            error: function() {
                                frappe.msgprint(__('Failed to fetch Sales Invoice details.'));
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