

// Log to confirm script is loaded
console.log("Custom Payment Entry script loaded");

// Cached company abbreviation
let cached_company_abbr = null;

// Helper to fetch company abbreviation
function get_company_abbr(callback, error_callback) {
    if (cached_company_abbr) {
        console.log('Using cached company abbreviation:', cached_company_abbr);
        callback(cached_company_abbr);
        return;
    }
    frappe.call({
        method: 'autowings_app.custom_scripts.utils.get_company_abbr',
        callback: function(r) {
            if (r.message) {
                cached_company_abbr = r.message;
                console.log('Fetched company abbreviation:', cached_company_abbr);
                callback(cached_company_abbr);
            } else {
                console.error('No company abbreviation returned.');
                error_callback(new Error('No company abbreviation returned.'));
            }
        },
        error: function(err) {
            console.error('Error fetching company abbreviation:', err);
            error_callback(err);
        }
    });
}

frappe.ui.form.on("Payment Entry", {
    refresh: function(frm) {
        try {
            // Preload company abbreviation when form loads
            if (frm.doc.company) {
                get_company_abbr(function(abbr) {
                    frm.custom_company_abbr = abbr;
                    console.log('Preloaded company abbreviation:', abbr);
                }, function(err) {
                    console.error('Failed to preload abbreviation:', err);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to load company abbreviation. Please check server logs.'),
                        indicator: 'red'
                    });
                });
            } else {
                console.warn('No company selected for preloading abbreviation.');
            }
        } catch (err) {
            console.error('Error in refresh handler:', err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while initializing the form. Please check the console.'),
                indicator: 'red'
            });
        }
    },

    company: function(frm) {
        try {
            // Reset cached abbreviation when company changes
            cached_company_abbr = null;
            if (frm.doc.company) {
                get_company_abbr(function(abbr) {
                    frm.custom_company_abbr = abbr;
                    console.log('Updated company abbreviation:', abbr);
                }, function(err) {
                    console.error('Failed to update abbreviation:', err);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to load company abbreviation. Please check server logs.'),
                        indicator: 'red'
                    });
                });
            }
        } catch (err) {
            console.error('Error in company handler:', err);
        }
    }
});

frappe.ui.form.on("Payment Entry Reference", {
    reference_name: function(frm, cdt, cdn) {
        try {
            var row = locals[cdt][cdn];
            console.log(`Processing reference_name: ${row.reference_name}, reference_doctype: ${row.reference_doctype}`);

            // Clear custom_party_name if reference_doctype or reference_name is empty
            if (!row.reference_doctype || !row.reference_name) {
                frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                frm.refresh_field("references");
                return;
            }

            // Verify custom_party_name field exists
            if (!frm.fields_dict.references.grid.get_field("custom_party_name")) {
                console.warn('Custom field custom_party_name not found in Payment Entry Reference.');
                return;
            }

            // Handle Sales Invoice
            if (row.reference_doctype === "Sales Invoice") {
                frappe.db.get_value(
                    "Sales Invoice",
                    row.reference_name,
                    "customer",
                    function(value) {
                        if (value && value.customer) {
                            frappe.model.set_value(cdt, cdn, "custom_party_name", value.customer);
                            console.log(`Set custom_party_name to ${value.customer} for Sales Invoice: ${row.reference_name}`);
                        } else {
                            frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                            console.warn(`No customer found for Sales Invoice: ${row.reference_name}`);
                        }
                        frm.refresh_field("references");
                    },
                    function(err) {
                        frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                        console.error(`Error fetching Sales Invoice ${row.reference_name}:`, err);
                        frm.refresh_field("references");
                    }
                );
            }
            // Handle Journal Entry
            else if (row.reference_doctype === "Journal Entry") {
                get_company_abbr(function(abbr) {
                    if (!abbr) {
                        frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                        console.warn("No company abbreviation available for Journal Entry processing");
                        frm.refresh_field("references");
                        return;
                    }

                    frappe.call({
                        method: "frappe.client.get",
                        args: {
                            doctype: "Journal Entry",
                            name: row.reference_name,
                        },
                        callback: function(response) {
                            if (response.message && response.message.accounts) {
                                console.log(`Journal Entry ${row.reference_name} accounts:`, response.message.accounts);
                                for (var i = 0; i < response.message.accounts.length; i++) {
                                    if (
                                        response.message.accounts[i].account === `Debtors - ${abbr}` &&
                                        response.message.accounts[i].party_type === "Customer" &&
                                        response.message.accounts[i].party
                                    ) {
                                        frappe.model.set_value(
                                            cdt,
                                            cdn,
                                            "custom_party_name",
                                            response.message.accounts[i].party
                                        );
                                        console.log(
                                            `Set custom_party_name to ${response.message.accounts[i].party} for Journal Entry: ${row.reference_name}`
                                        );
                                        frm.refresh_field("references");
                                        return;
                                    }
                                }
                                frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                                console.warn(`No matching Debtors - ${abbr} Customer found for Journal Entry: ${row.reference_name}`);
                            } else {
                                frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                                console.warn(`No accounts found for Journal Entry: ${row.reference_name}`);
                            }
                            frm.refresh_field("references");
                        },
                        error: function(err) {
                            frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                            console.error(`Error fetching Journal Entry ${row.reference_name}:`, err);
                            frm.refresh_field("references");
                        }
                    });
                }, function(err) {
                    frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                    console.error('Failed to fetch company abbreviation:', err);
                    frm.refresh_field("references");
                });
            }
        } catch (err) {
            console.error('Error in reference_name handler:', err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while processing the reference. Please check the console.'),
                indicator: 'red'
            });
        }
    },

    reference_doctype: function(frm, cdt, cdn) {
        try {
            var row = locals[cdt][cdn];
            if (row.reference_name) {
                frm.script_manager.trigger("reference_name", cdt, cdn);
            }
        } catch (err) {
            console.error('Error in reference_doctype handler:', err);
        }
    }
});

frappe.ui.form.on("Payment Entry", {
    get_outstanding_documents: function(frm, filters, get_outstanding_invoices, get_orders_to_be_billed) {
        try {
            console.log("Custom get_outstanding_documents triggered");
            frappe.call({
                method: "erpnext.accounts.doctype.payment_entry.payment_entry.get_outstanding_reference_documents",
                args: {
                    args: {
                        posting_date: frm.doc.posting_date,
                        company: frm.doc.company,
                        party_type: frm.doc.party_type,
                        payment_type: frm.doc.payment_type,
                        party: frm.doc.party,
                        party_account: frm.doc.payment_type == "Receive" ? frm.doc.paid_from : frm.doc.paid_to,
                        cost_center: frm.doc.cost_center,
                        get_outstanding_invoices: get_outstanding_invoices || false,
                        get_orders_to_be_billed: get_orders_to_be_billed || false,
                        book_advance_payments_in_separate_party_account: frm.doc.book_advance_payments_in_separate_party_account || false
                    }
                },
                callback: function(r) {
                    if (r.message) {
                        frm.clear_table("references");
                        $.each(r.message, function(i, d) {
                            var c = frm.add_child("references");
                            c.reference_doctype = d.voucher_type;
                            c.reference_name = d.voucher_no;
                            c.due_date = d.due_date;
                            c.total_amount = d.invoice_amount;
                            c.outstanding_amount = d.outstanding_amount;
                            c.bill_no = d.bill_no;
                            c.payment_term = d.payment_term;
                            c.payment_term_outstanding = d.payment_term_outstanding;
                            c.allocated_amount = d.allocated_amount;
                            c.account = d.account;

                            // Trigger reference_name to populate custom_party_name
                            frm.script_manager.trigger("reference_name", c.doctype, c.name);
                        });
                        frm.refresh_field("references");
                    } else {
                        console.warn("No outstanding documents returned");
                        frappe.msgprint({
                            title: __('Warning'),
                            message: __('No outstanding documents found.'),
                            indicator: 'orange'
                        });
                    }
                },
                error: function(err) {
                    console.error("Error in get_outstanding_documents:", err);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error fetching outstanding documents. Please check server logs.'),
                        indicator: 'red'
                    });
                }
            });
        } catch (err) {
            console.error('Error in get_outstanding_documents handler:', err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while fetching outstanding documents. Please check the console.'),
                indicator: 'red'
            });
        }
    }
});

frappe.ui.form.on("Payment Entry", {
    party: function(frm) {
        try {
            if (frm.doc.party && frm.doc.party_type) {
                let doctype = frm.doc.party_type;
                let field = doctype === "Customer" ? "customer_group" : doctype === "Supplier" ? "supplier_group" : null;
                if (field) {
                    // Verify custom_party_group field exists
                    if (!frm.fields_dict.custom_party_group) {
                        console.warn('Custom field custom_party_group not found in Payment Entry.');
                        return;
                    }

                    frappe.db.get_value(doctype, frm.doc.party, field, (value) => {
                        let party_group = value[field] || "";
                        frm.set_value("custom_party_group", party_group);
                        // Check if custom_party_group is "Financer" and set paid_from
                        if (party_group === "Financer") {
                            get_company_abbr(function(abbr) {
                                if (abbr) {
                                    frm.set_value("paid_from", `Finance Receivable - ${abbr}`);
                                    console.log(`Set paid_from to Finance Receivable - ${abbr} for Financer group`);
                                } else {
                                    frm.set_value("paid_from", "");
                                    console.warn("No company abbreviation available for setting paid_from");
                                }
                            }, function(err) {
                                frm.set_value("paid_from", "");
                                console.error('Failed to fetch company abbreviation:', err);
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('Failed to load company abbreviation for Financer group.'),
                                    indicator: 'red'
                                });
                            });
                        }
                    });
                } else {
                    frm.set_value("custom_party_group", "");
                    frm.set_value("paid_from", "");
                }
            } else {
                frm.set_value("custom_party_group", "");
                frm.set_value("paid_from", "");
            }
        } catch (err) {
            console.error('Error in party handler:', err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while processing the party. Please check the console.'),
                indicator: 'red'
            });
        }
    },

    party_type: function(frm) {
        try {
            if (frm.doc.party) {
                frm.script_manager.trigger("party");
            } else {
                frm.set_value("custom_party_group", "");
                frm.set_value("paid_from", "");
            }
        } catch (err) {
            console.error('Error in party_type handler:', err);
        }
    }
});

// for supplier party type
frappe.ui.form.on("Payment Entry", {
    party: function(frm) {
        try {
            if (frm.doc.payment_type === "Pay" && frm.doc.party_type === "Supplier" && frm.doc.party) {
                get_company_abbr(function(abbr) {
                    if (abbr) {
                        frappe.db.get_value("Supplier", frm.doc.party, "supplier_name", (value) => {
                            if (value && value.supplier_name) {
                                let paid_to_account = `${value.supplier_name} Payable - ${abbr}`;
                                frm.set_value("paid_to", paid_to_account);
                                console.log(`Set paid_to to ${paid_to_account} for Supplier: ${frm.doc.party}`);

                                // Validate that the paid_to account exists
                                frappe.db.get_value('Account', paid_to_account, 'name')
                                    .then(r => {
                                        if (!r.message.name) {
                                            frappe.msgprint({
                                                title: __('Validation Error'),
                                                message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
                                                indicator: 'red'
                                            });
                                            frm.set_value("paid_to", "");
                                        }
                                    })
                                    .catch(err => {
                                        console.error(`Error validating account ${paid_to_account}:`, err);
                                        frappe.msgprint({
                                            title: __('Error'),
                                            message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
                                            indicator: 'red'
                                        });
                                        frm.set_value("paid_to", "");
                                    });
                            } else {
                                console.warn(`No supplier_name found for Supplier: ${frm.doc.party}`);
                                frm.set_value("paid_to", "");
                            }
                        });
                    } else {
                        console.warn("No company abbreviation available for setting paid_to");
                        frm.set_value("paid_to", "");
                    }
                }, function(err) {
                    console.error('Failed to fetch company abbreviation:', err);
                    frm.set_value("paid_to", "");
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to load company abbreviation for Supplier account.'),
                        indicator: 'red'
                    });
                });
            }
        } catch (err) {
            console.error('Error in party handler:', err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while processing the party. Please check the console.'),
                indicator: 'red'
            });
        }
    }
});

// // Log to confirm script is loaded
// console.log("Custom Payment Entry script loaded");

// // Cached company abbreviation
// let cached_company_abbr = null;

// // Helper to fetch company abbreviation
// function get_company_abbr(callback, error_callback) {
//     if (cached_company_abbr) {
//         console.log('Using cached company abbreviation:', cached_company_abbr);
//         callback(cached_company_abbr);
//         return;
//     }
//     frappe.call({
//         method: 'autowings_app.custom_scripts.utils.get_company_abbr',
//         callback: function(r) {
//             if (r.message) {
//                 cached_company_abbr = r.message;
//                 console.log('Fetched company abbreviation:', cached_company_abbr);
//                 callback(cached_company_abbr);
//             } else {
//                 console.error('No company abbreviation returned.');
//                 error_callback(new Error('No company abbreviation returned.'));
//             }
//         },
//         error: function(err) {
//             console.error('Error fetching company abbreviation:', err);
//             error_callback(err);
//         }
//     });
// }

// frappe.ui.form.on("Payment Entry", {
//     refresh: function(frm) {
//         try {
//             // Preload company abbreviation when form loads
//             if (frm.doc.company) {
//                 get_company_abbr(function(abbr) {
//                     frm.custom_company_abbr = abbr;
//                     console.log('Preloaded company abbreviation:', abbr);
//                 }, function(err) {
//                     console.error('Failed to preload abbreviation:', err);
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Failed to load company abbreviation. Please check server logs.'),
//                         indicator: 'red'
//                     });
//                 });
//             } else {
//                 console.warn('No company selected for preloading abbreviation.');
//             }
//         } catch (err) {
//             console.error('Error in refresh handler:', err);
//             frappe.msgprint({
//                 title: __('Error'),
//                 message: __('An error occurred while initializing the form. Please check the console.'),
//                 indicator: 'red'
//             });
//         }
//     },

//     company: function(frm) {
//         try {
//             // Reset cached abbreviation when company changes
//             cached_company_abbr = null;
//             if (frm.doc.company) {
//                 get_company_abbr(function(abbr) {
//                     frm.custom_company_abbr = abbr;
//                     console.log('Updated company abbreviation:', abbr);
//                 }, function(err) {
//                     console.error('Failed to update abbreviation:', err);
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Failed to load company abbreviation. Please check server logs.'),
//                         indicator: 'red'
//                     });
//                 });
//             }
//         } catch (err) {
//             console.error('Error in company handler:', err);
//         }
//     },

//     party: function(frm) {
//         try {
//             if (frm.doc.party && frm.doc.party_type) {
//                 let doctype = frm.doc.party_type;
//                 let field = doctype === "Customer" ? "customer_group" : doctype === "Supplier" ? "supplier_group" : null;

//                 // Handle Supplier-specific paid_to logic
//                 if (doctype === "Supplier") {
//                     get_company_abbr(function(abbr) {
//                         if (abbr) {
//                             // Fetch party_name from Supplier doctype
//                             frappe.db.get_value("Supplier", frm.doc.party, "supplier_name", (value) => {
//                                 if (value && value.supplier_name) {
//                                     let paid_to_account = `${value.supplier_name} Payable - ${abbr}`;
//                                     frm.set_value("paid_to", paid_to_account);
//                                     console.log(`Set paid_to to ${paid_to_account} for Supplier: ${frm.doc.party}`);
                                    
//                                     // Validate that the paid_to account exists
//                                     frappe.db.get_value('Account', paid_to_account, 'name')
//                                         .then(r => {
//                                             if (!r.message.name) {
//                                                 frappe.msgprint({
//                                                     title: __('Validation Error'),
//                                                     message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
//                                                     indicator: 'red'
//                                                 });
//                                                 frm.set_value("paid_to", "");
//                                             }
//                                         })
//                                         .catch(err => {
//                                             console.error(`Error validating account ${paid_to_account}:`, err);
//                                             frappe.msgprint({
//                                                 title: __('Error'),
//                                                 message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
//                                                 indicator: 'red'
//                                             });
//                                             frm.set_value("paid_to", "");
//                                         });
//                                 } else {
//                                     console.warn(`No supplier_name found for Supplier: ${frm.doc.party}`);
//                                     frm.set_value("paid_to", "");
//                                 }
//                             });
//                         } else {
//                             console.warn("No company abbreviation available for setting paid_to");
//                             frm.set_value("paid_to", "");
//                         }
//                     }, function(err) {
//                         console.error('Failed to fetch company abbreviation:', err);
//                         frm.set_value("paid_to", "");
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: __('Failed to load company abbreviation for Supplier account.'),
//                             indicator: 'red'
//                         });
//                     });
//                 } else {
//                     frm.set_value("paid_to", ""); // Clear paid_to for non-Supplier party types
//                 }

//                 // Existing logic for custom_party_group and Financer
//                 if (field) {
//                     // Verify custom_party_group field exists
//                     if (!frm.fields_dict.custom_party_group) {
//                         console.warn('Custom field custom_party_group not found in Payment Entry.');
//                         return;
//                     }

//                     frappe.db.get_value(doctype, frm.doc.party, field, (value) => {
//                         let party_group = value[field] || "";
//                         frm.set_value("custom_party_group", party_group);
//                         // Check if custom_party_group is "Financer" and set paid_from
//                         if (party_group === "Financer") {
//                             get_company_abbr(function(abbr) {
//                                 if (abbr) {
//                                     frm.set_value("paid_from", `Finance Receivable - ${abbr}`);
//                                     console.log(`Set paid_from to Finance Receivable - ${abbr} for Financer group`);
//                                 } else {
//                                     frm.set_value("paid_from", "");
//                                     console.warn("No company abbreviation available for setting paid_from");
//                                 }
//                             }, function(err) {
//                                 frm.set_value("paid_from", "");
//                                 console.error('Failed to fetch company abbreviation:', err);
//                                 frappe.msgprint({
//                                     title: __('Error'),
//                                     message: __('Failed to load company abbreviation for Financer group.'),
//                                     indicator: 'red'
//                                 });
//                             });
//                         } else {
//                             frm.set_value("paid_from", ""); // Clear paid_from for non-Financer groups
//                         }
//                     });
//                 } else {
//                     frm.set_value("custom_party_group", "");
//                     frm.set_value("paid_from", "");
//                 }
//             } else {
//                 frm.set_value("custom_party_group", "");
//                 frm.set_value("paid_from", "");
//                 frm.set_value("paid_to", "");
//             }
//         } catch (err) {
//             console.error('Error in party handler:', err);
//             frappe.msgprint({
//                 title: __('Error'),
//                 message: __('An error occurred while processing the party. Please check the console.'),
//                 indicator: 'red'
//             });
//         }
//     },

//     party_type: function(frm) {
//         try {
//             if (frm.doc.party) {
//                 frm.script_manager.trigger("party");
//             } else {
//                 frm.set_value("custom_party_group", "");
//                 frm.set_value("paid_from", "");
//                 frm.set_value("paid_to", "");
//             }
//         } catch (err) {
//             console.error('Error in party_type handler:', err);
//         }
//     }
// });

// // on submit payment entry udpate rto registration

// frappe.ui.form.on("Payment Entry", {
//     on_submit: function(frm) {
//         try {
//             let journal_entries = frm.doc.references
//                 .filter(ref => ref.reference_doctype === "Journal Entry")
//                 .map(ref => ref.reference_name);

//             console.log("On submit triggered for Payment Entry:", frm.doc.name, "Journal Entries:", journal_entries);

//             if (journal_entries.length === 0) {
//                 console.log("No Journal Entry references found in Payment Entry.");
//                 return;
//             }

//             frappe.call({
//                 method: "autowings_app.custom_scripts.payment_entry.update_rto_registration_on_payment",
//                 args: {
//                     payment_entry_name: frm.doc.name,
//                     posting_date: frm.doc.posting_date,
//                     reference_no: frm.doc.reference_no,
//                     journal_entries: journal_entries
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.updated) {
//                         console.log(`Updated ${r.message.updated} RTO Registration documents.`);
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: __('RTO Registration documents updated successfully.'),
//                             indicator: 'green'
//                         });
//                     } else {
//                         console.log("No RTO Registration documents updated.");
//                     }
//                 },
//                 error: function(err) {
//                     console.error("Error updating RTO Registration:", err);
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Failed to update RTO Registration documents. Please check server logs.'),
//                         indicator: 'red'
//                     });
//                 }
//             });
//         } catch (err) {
//             console.error("Error in on_submit handler:", err);
//             frappe.msgprint({
//                 title: __('Error'),
//                 message: __('An error occurred while processing the payment submission. Please check the console.'),
//                 indicator: 'red'
//             });
//         }
//     }
// });


frappe.ui.form.on("Payment Entry", {
    on_submit: function(frm) {
        try {
            // Extract Journal Entry references from Payment Entry
            let journal_entries = frm.doc.references
                .filter(ref => ref.reference_doctype === "Journal Entry")
                .map(ref => ref.reference_name);

            console.log("On submit triggered for Payment Entry:", frm.doc.name, "Journal Entries:", journal_entries);

            if (journal_entries.length === 0) {
                console.log("No Journal Entry references found in Payment Entry.");
                return;
            }

            // Update RTO Registration documents where journal_entry_id matches
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "RTO Registration",
                    filters: {
                        journal_entry_id: ["in", journal_entries],
                        payment_status: "Due"
                    },
                    fields: ["name", "journal_entry_id", "status", "payment_status"]
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        let rto_docs = r.message;
                        console.log("Found RTO Registration documents:", rto_docs.map(doc => doc.name));

                        rto_docs.forEach(rto_doc => {
                            let new_status = rto_doc.status === "Due Payment to RTO" ? "Due Registration Number Entry" : rto_doc.status;
                            frappe.call({
                                method: "frappe.client.set_value",
                                args: {
                                    doctype: "RTO Registration",
                                    name: rto_doc.name,
                                    fieldname: {
                                        payment_date: frm.doc.posting_date,
                                        payment_status: "Paid",
                                        payment_entry_id: frm.doc.name,
                                        payment_reference: frm.doc.reference_no,
                                        status: new_status
                                    }
                                },
                                callback: function(update_r) {
                                    if (update_r.message) {
                                        console.log(`Updated RTO Registration ${rto_doc.name} with payment details and status: ${new_status}`);
                                        // Log activity for RTO Registration
                                        log_rto_activity({
                                            doctype: "RTO Registration",
                                            name: rto_doc.name,
                                            parentfield: "rto_activity",
                                            activity: "Payment to RTO Recorded",
                                            status: "Payment Recorded",
                                            remarks: `Payment Entry ${frm.doc.name} submitted.`
                                        });
                                        frappe.msgprint({
                                            title: __('Success'),
                                            message: __('RTO Registration document updated successfully.'),
                                            indicator: 'green'
                                        });
                                    }
                                },
                                error: function(err) {
                                    console.error(`Error updating RTO Registration ${rto_doc.name}:`, err);
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to update RTO Registration document. Please check server logs.'),
                                        indicator: 'red'
                                    });
                                }
                            });
                        });
                    } else {
                        console.log("No matching RTO Registration documents found with payment_status: Due.");
                    }
                },
                error: function(err) {
                    console.error("Error fetching RTO Registration documents:", err);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to fetch RTO Registration documents. Please check server logs.'),
                        indicator: 'red'
                    });
                }
            });

            // Update Vehicle Smart Card documents where journal_entry_id matches
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Vehicle Smart Card",
                    filters: {
                        journal_entry_id: ["in", journal_entries],
                        smart_card_payment_status: "Due"
                    },
                    fields: ["name", "journal_entry_id", "smart_card_payment_status"]
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        let smart_card_docs = r.message;
                        console.log("Found Vehicle Smart Card documents:", smart_card_docs.map(doc => doc.name));

                        smart_card_docs.forEach(smart_card_doc => {
                            frappe.call({
                                method: "frappe.client.set_value",
                                args: {
                                    doctype: "Vehicle Smart Card",
                                    name: smart_card_doc.name,
                                    fieldname: {
                                        payment_date: frm.doc.posting_date,
                                        smart_card_payment_status: "Paid",
                                        payment_entry_id: frm.doc.name,
                                        payment_reference: frm.doc.reference_no,
                                        status: "Due Updation in Vahan"
                                    }
                                },
                                callback: function(update_r) {
                                    if (update_r.message) {
                                        console.log(`Updated Vehicle Smart Card ${smart_card_doc.name} with payment details and status: Due Updation in Vahan`);
                                        // Log activity for Vehicle Smart Card
                                        log_rto_activity({
                                            doctype: "Vehicle Smart Card",
                                            name: smart_card_doc.name,
                                            parentfield: "rto_activity",
                                            activity: "Payment for Smart Card Recorded",
                                            status: "Payment Recorded",
                                            remarks: `Payment Entry ${frm.doc.name} submitted.`
                                        });
                                        frappe.msgprint({
                                            title: __('Success'),
                                            message: __('Vehicle Smart Card updated successfully.'),
                                            indicator: 'green'
                                        });
                                    }
                                },
                                error: function(err) {
                                    console.error(`Error updating Vehicle Smart Card ${smart_card_doc.name}:`, err);
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to update Vehicle Smart Card. Please check server logs.'),
                                        indicator: 'red'
                                    });
                                }
                            });
                        });
                    } else {
                        console.log("No matching Vehicle Smart Card documents found with payment_status: Due.");
                    }
                },
                error: function(err) {
                    console.error("Error fetching Vehicle Smart Card documents:", err);
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to fetch Vehicle Smart Card documents. Please check server logs.'),
                        indicator: 'red'
                    });
                }
            });
        } catch (err) {
            console.error("Error in on_submit handler:", err);
            frappe.msgprint({
                title: __('Error'),
                message: __('An error occurred while processing the payment submission. Please check the console.'),
                indicator: 'red'
            });
        }
    }
});

// Reusable function to log activity in rto_activity child table for any doctype
function log_rto_activity(params) {
    let activity_log = {
        doctype: "RTO Activity Log",
        activity: params.activity,
        status: params.status,
        user: frappe.session.user,
        update_on: frappe.datetime.now_datetime(),
        remarks: params.remarks || "",
        parent: params.name,
        parentfield: params.parentfield,
        parenttype: params.doctype
    };

    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: activity_log
        },
        callback: function(r) {
            if (r.exc) {
                console.error(`Error logging activity for ${params.doctype} ${params.name}:`, r.exc);
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
            } else {
                console.log(`Activity logged for ${params.doctype} ${params.name}: ${params.activity}`);
            }
        },
        error: function(err) {
            console.error(`Error logging activity for ${params.doctype} ${params.name}:`, err);
            frappe.msgprint({
                title: __('Error'),
                message: __('Error logging activity: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
        }
    });
}
// frappe.ui.form.on("Payment Entry", {
//     on_submit: function(frm) {
//         try {
//             // Extract Journal Entry references from Payment Entry
//             let journal_entries = frm.doc.references
//                 .filter(ref => ref.reference_doctype === "Journal Entry")
//                 .map(ref => ref.reference_name);

//             console.log("On submit triggered for Payment Entry:", frm.doc.name, "Journal Entries:", journal_entries);

//             if (journal_entries.length === 0) {
//                 console.log("No Journal Entry references found in Payment Entry.");
//                 return;
//             }

//             // Fetch RTO Registration documents with journal_entry_id or additional_accounts
//             frappe.call({
//                 method: "frappe.client.get_list",
//                 args: {
//                     doctype: "RTO Registration",
//                     filters: {
//                         journal_entry_id: ["in", journal_entries]
//                     },
//                     fields: ["name", "journal_entry_id", "additional_accounts"]
//                 },
//                 callback: function(r) {
//                     if (r.message && r.message.length > 0) {
//                         let rto_docs = r.message;
//                         console.log("Found RTO Registration documents:", rto_docs.map(doc => doc.name));

//                         rto_docs.forEach(rto_doc => {
//                             // Update main RTO Registration if journal_entry_id matches
//                             if (journal_entries.includes(rto_doc.journal_entry_id)) {
//                                 frappe.call({
//                                     method: "frappe.client.set_value",
//                                     args: {
//                                         doctype: "RTO Registration",
//                                         name: rto_doc.name,
//                                         fieldname: {
//                                             payment_date: frm.doc.posting_date,
//                                             payment_status: "Paid",
//                                             status: "Due Registration Number Entry",
//                                             payment_entry_id: frm.doc.name,
//                                             payment_reference: frm.doc.reference_no
//                                         }
//                                     },
//                                     callback: function(update_r) {
//                                         if (update_r.message) {
//                                             console.log(`Updated RTO Registration ${rto_doc.name} with payment details.`);
//                                             frappe.msgprint({
//                                                 title: __('Success'),
//                                                 message: __('RTO Registration document updated successfully.'),
//                                                 indicator: 'green'
//                                             });
//                                         }
//                                     },
//                                     error: function(err) {
//                                         console.error(`Error updating RTO Registration ${rto_doc.name}:`, err);
//                                         frappe.msgprint({
//                                             title: __('Error'),
//                                             message: __('Failed to update RTO Registration document. Please check server logs.'),
//                                             indicator: 'red'
//                                         });
//                                     }
//                                 });
//                             }

//                             // Update additional_accounts child table if journal_entry_id matches
//                             if (rto_doc.additional_accounts && rto_doc.additional_accounts.length > 0) {
//                                 rto_doc.additional_accounts.forEach(account => {
//                                     if (journal_entries.includes(account.journal_entry_id)) {
//                                         console.log(`Found matching journal_entry_id ${account.journal_entry_id} in RTO Additional AC ${account.name}`);
//                                         frappe.call({
//                                             method: "frappe.client.set_value",
//                                             args: {
//                                                 doctype: "RTO Additional AC",
//                                                 name: account.name,
//                                                 fieldname: {
//                                                     payment_date: frm.doc.posting_date,
//                                                     payment_status: "Paid",
//                                                     status: "Due Registration Number Entry",
//                                                     payment_entry_id: frm.doc.name,
//                                                     payment_reference: frm.doc.reference_no
//                                                 }
//                                             },
//                                             callback: function(child_update_r) {
//                                                 if (child_update_r.message) {
//                                                     console.log(`Successfully updated RTO Additional AC ${account.name} with payment details.`);
//                                                     frappe.msgprint({
//                                                         title: __('Success'),
//                                                         message: __('RTO Additional AC updated successfully.'),
//                                                         indicator: 'green'
//                                                     });
//                                                 } else {
//                                                     console.warn(`No response for updating RTO Additional AC ${account.name}`);
//                                                 }
//                                             },
//                                             error: function(err) {
//                                                 console.error(`Error updating RTO Additional AC ${account.name}:`, err);
//                                                 frappe.msgprint({
//                                                     title: __('Error'),
//                                                     message: __('Failed to update RTO Additional AC. Please check server logs.'),
//                                                     indicator: 'red'
//                                                 });
//                                             }
//                                         });
//                                     }
//                                 });
//                             }
//                         });
//                     } else {
//                         console.log("No matching RTO Registration documents found for journal_entry_id.");
//                     }

//                     // Fetch RTO Registration documents for additional_accounts check (if not already covered)
//                     frappe.call({
//                         method: "frappe.client.get_list",
//                         args: {
//                             doctype: "RTO Registration",
//                             filters: {
//                                 journal_entry_id: ["not in", journal_entries] // Avoid re-fetching already processed documents
//                             },
//                             fields: ["name", "additional_accounts"]
//                         },
//                         callback: function(child_r) {
//                             if (child_r.message && child_r.message.length > 0) {
//                                 let rto_docs = child_r.message;
//                                 console.log("Fetched RTO Registration documents for additional_accounts check:", rto_docs.map(doc => doc.name));

//                                 rto_docs.forEach(rto_doc => {
//                                     if (rto_doc.additional_accounts && rto_doc.additional_accounts.length > 0) {
//                                         rto_doc.additional_accounts.forEach(account => {
//                                             if (journal_entries.includes(account.journal_entry_id)) {
//                                                 console.log(`Found matching journal_entry_id ${account.journal_entry_id} in RTO Additional AC ${account.name}`);
//                                                 frappe.call({
//                                                     method: "frappe.client.set_value",
//                                                     args: {
//                                                         doctype: "RTO Additional AC",
//                                                         name: account.name,
//                                                         fieldname: {
//                                                             payment_date: frm.doc.posting_date,
//                                                             payment_status: "Paid",
//                                                             payment_entry_id: frm.doc.name,
//                                                             payment_reference: frm.doc.reference_no
//                                                         }
//                                                     },
//                                                     callback: function(child_update_r) {
//                                                         if (child_update_r.message) {
//                                                             console.log(`Successfully updated RTO Additional AC ${account.name} with payment details.`);
//                                                             frappe.msgprint({
//                                                                 title: __('Success'),
//                                                                 message: __('RTO Additional AC updated successfully.'),
//                                                                 indicator: 'green'
//                                                             });
//                                                         } else {
//                                                             console.warn(`No response for updating RTO Additional AC ${account.name}`);
//                                                         }
//                                                     },
//                                                     error: function(err) {
//                                                         console.error(`Error updating RTO Additional AC ${account.name}:`, err);
//                                                         frappe.msgprint({
//                                                             title: __('Error'),
//                                                             message: __('Failed to update RTO Additional AC. Please check server logs.'),
//                                                             indicator: 'red'
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     }
//                                 });
//                             } else {
//                                 console.log("No additional RTO Registration documents found for additional_accounts check.");
//                             }
//                         },
//                         error: function(err) {
//                             console.error("Error fetching RTO Registration documents for additional_accounts:", err);
//                             frappe.msgprint({
//                                 title: __('Error'),
//                                 message: __('Failed to fetch RTO Registration documents for additional_accounts. Please check server logs.'),
//                                 indicator: 'red'
//                             });
//                         }
//                     });
//                 },
//                 error: function(err) {
//                     console.error("Error fetching RTO Registration documents:", err);
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Failed to fetch RTO Registration documents. Please check server logs.'),
//                         indicator: 'red'
//                     });
//                 }
//             });
//         } catch (err) {
//             console.error("Error in on_submit handler:", err);
//             frappe.msgprint({
//                 title: __('Error'),
//                 message: __('An error occurred while processing the payment submission. Please check the console.'),
//                 indicator: 'red'
//             });
//         }
//     }
// });
