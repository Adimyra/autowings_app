// Log to confirm script is loaded
console.log("Custom Payment Entry script loaded");

frappe.ui.form.on("Payment Entry Reference", {
    reference_name: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        console.log(`Processing reference_name: ${row.reference_name}, reference_doctype: ${row.reference_doctype}`);

        // Clear custom_party_name if reference_doctype or reference_name is empty
        if (!row.reference_doctype || !row.reference_name) {
            frappe.model.set_value(cdt, cdn, "custom_party_name", "");
            return;
        }

        // Handle Sales Invoice
        if (row.reference_doctype === "Sales Invoice") {
            frappe.db.get_value(
                "Sales Invoice",
                row.reference_name,
                "customer",
                function (value) {
                    if (value && value.customer) {
                        frappe.model.set_value(cdt, cdn, "custom_party_name", value.customer);
                        console.log(`Set custom_party_name to ${value.customer} for Sales Invoice: ${row.reference_name}`);
                    } else {
                        frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                        console.warn(`No customer found for Sales Invoice: ${row.reference_name}`);
                    }
                    frm.refresh_field("references");
                },
                function (err) {
                    frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                    console.error(`Error fetching Sales Invoice ${row.reference_name}:`, err);
                    frm.refresh_field("references");
                }
            );
        }
        // Handle Journal Entry
        else if (row.reference_doctype === "Journal Entry") {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Journal Entry",
                    name: row.reference_name,
                },
                callback: function (response) {
                    if (response.message && response.message.accounts) {
                        console.log(`Journal Entry ${row.reference_name} accounts:`, response.message.accounts);
                        for (var i = 0; i < response.message.accounts.length; i++) {
                            if (
                                response.message.accounts[i].account === "Debtors - A" &&
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
                        console.warn(`No matching Debtors - A Customer found for Journal Entry: ${row.reference_name}`);
                    } else {
                        frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                        console.warn(`No accounts found for Journal Entry: ${row.reference_name}`);
                    }
                    frm.refresh_field("references");
                },
                error: function (err) {
                    frappe.model.set_value(cdt, cdn, "custom_party_name", "");
                    console.error(`Error fetching Journal Entry ${row.reference_name}:`, err);
                    frm.refresh_field("references");
                }
            });
        }
    },

    reference_doctype: function (frm, cdt, cdn) {
        // Trigger reference_name logic when reference_doctype changes
        var row = locals[cdt][cdn];
        if (row.reference_name) {
            frm.script_manager.trigger("reference_name", cdt, cdn);
        }
    }
});

frappe.ui.form.on("Payment Entry", {
    get_outstanding_documents: function (frm, filters, get_outstanding_invoices, get_orders_to_be_billed) {
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
            callback: function (r) {
                if (r.message) {
                    frm.clear_table("references");
                    $.each(r.message, function (i, d) {
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
                }
            },
            error: function (err) {
                console.error("Error in get_outstanding_documents:", err);
                frappe.msgprint(__("Error fetching outstanding documents"));
            }
        });
    }
});


//get party group
// frappe.ui.form.on("Payment Entry", {
//     party: function (frm) {
//         if (frm.doc.party && frm.doc.party_type) {
//             let doctype = frm.doc.party_type;
//             let field = doctype === "Customer" ? "customer_group" : doctype === "Supplier" ? "supplier_group" : null;
//             if (field) {
//                 frappe.db.get_value(doctype, frm.doc.party, field, (value) => {
//                     frm.set_value("custom_party_group", value[field] || "");
//                 });
//             } else {
//                 frm.set_value("custom_party_group", "");
//             }
//         } else {
//             frm.set_value("custom_party_group", "");
//         }
//     },

//     party_type: function (frm) {
//         if (frm.doc.party) {
//             frm.script_manager.trigger("party");
//         } else {
//             frm.set_value("custom_party_group", "");
//         }
//     }
// });

frappe.ui.form.on("Payment Entry", {
    party: function (frm) {
        if (frm.doc.party && frm.doc.party_type) {
            let doctype = frm.doc.party_type;
            let field = doctype === "Customer" ? "customer_group" : doctype === "Supplier" ? "supplier_group" : null;
            if (field) {
                frappe.db.get_value(doctype, frm.doc.party, field, (value) => {
                    let party_group = value[field] || "";
                    frm.set_value("custom_party_group", party_group);
                    // Check if custom_party_group is "Financer" and set paid_from
                    if (party_group === "Financer") {
                        frm.set_value("paid_from", "Finance Receivable - A");
                    }
                });
            } else {
                frm.set_value("custom_party_group", "");
                frm.set_value("paid_from", ""); // Optional: Clear paid_from if no group
            }
        } else {
            frm.set_value("custom_party_group", "");
            frm.set_value("paid_from", ""); // Optional: Clear paid_from if no party
        }
    },

    party_type: function (frm) {
        if (frm.doc.party) {
            frm.script_manager.trigger("party");
        } else {
            frm.set_value("custom_party_group", "");
            frm.set_value("paid_from", ""); // Optional: Clear paid_from if no party
        }
    }
});