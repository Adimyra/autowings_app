frappe.ui.form.on("Autowings Settings", {
    refresh: function(frm) {
        // Ensure fields are initialized properly
        if (!frm.doc.update_doc) {
            clear_all_fields(frm);
        }
    },

    update_doc: function(frm) {
        // Clear dependent fields when update_doc changes
        frm.set_value("journal_entry_id", "");
        frm.set_value("payment_entry_id", "");
        clear_doc_details(frm);
    },

    journal_entry_id: function(frm) {
        // Fetch details from Journal Entry when journal_entry_id is selected
        if (frm.doc.journal_entry_id) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Journal Entry",
                    name: frm.doc.journal_entry_id,
                    fields: ["posting_date", "docstatus", "total_debit", "accounts"]
                },
                callback: function(r) {
                    if (r.message) {
                        const journal_entry = r.message;
                        // Find customer from accounts where party_type is "Customer"
                        const customer_account = journal_entry.accounts.find(acc => acc.party_type === "Customer");
                        const customer = customer_account ? customer_account.party : "";
                        // Map docstatus to readable status
                        const doc_status = journal_entry.docstatus === 0 ? "Draft" : journal_entry.docstatus === 1 ? "Submitted" : "Cancelled";
                        // Set fields
                        frm.set_value("customer", customer);
                        frm.set_value("posting_date", journal_entry.posting_date);
                        frm.set_value("doc_status", doc_status);
                        frm.set_value("amount", journal_entry.total_debit); // total_debit and total_credit are equal
                    } else {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("Failed to fetch Journal Entry details.")
                        });
                        clear_doc_details(frm);
                    }
                },
                error: function(err) {
                    console.error("Error fetching Journal Entry:", err);
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to fetch Journal Entry details: {0}", [err.message])
                    });
                    clear_doc_details(frm);
                }
            });
        } else {
            clear_doc_details(frm);
        }
    },

    payment_entry_id: function(frm) {
        // Fetch details from Payment Entry when payment_entry_id is selected
        if (frm.doc.payment_entry_id) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Payment Entry",
                    name: frm.doc.payment_entry_id,
                    fields: ["posting_date", "docstatus", "paid_amount", "party_type", "party", "references"]
                },
                callback: function(r) {
                    if (r.message) {
                        const payment_entry = r.message;
                        let customer = "";
                        // Check if party_type is "Customer"
                        if (payment_entry.party_type === "Customer") {
                            customer = payment_entry.party;
                        } else if (payment_entry.party_type === "Supplier" && payment_entry.references.length > 0) {
                            // Fetch customer from the referenced Journal Entry
                            const ref = payment_entry.references[0];
                            if (ref.reference_doctype === "Journal Entry") {
                                frappe.call({
                                    method: "frappe.client.get",
                                    args: {
                                        doctype: "Journal Entry",
                                        name: ref.reference_name,
                                        fields: ["accounts"]
                                    },
                                    callback: function(jr) {
                                        if (jr.message) {
                                            const journal_entry = jr.message;
                                            const customer_account = journal_entry.accounts.find(acc => acc.party_type === "Customer");
                                            customer = customer_account ? customer_account.party : "";
                                            update_payment_entry_details(frm, payment_entry, customer);
                                        } else {
                                            update_payment_entry_details(frm, payment_entry, "");
                                        }
                                    },
                                    error: function(err) {
                                        console.error("Error fetching referenced Journal Entry:", err);
                                        update_payment_entry_details(frm, payment_entry, "");
                                    }
                                });
                                return; // Wait for the nested call to complete
                            }
                        }
                        update_payment_entry_details(frm, payment_entry, customer);
                    } else {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("Failed to fetch Payment Entry details.")
                        });
                        clear_doc_details(frm);
                    }
                },
                error: function(err) {
                    console.error("Error fetching Payment Entry:", err);
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to fetch Payment Entry details: {0}", [err.message])
                    });
                    clear_doc_details(frm);
                }
            });
        } else {
            clear_doc_details(frm);
        }
    },

    update: function(frm) {
        // Handle the Update button click
        if (!frm.doc.update_doc) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please select whether to update a Journal Entry or Payment Entry.")
            });
            return;
        }

        let doc_id = "";
        let doctype = frm.doc.update_doc;

        if (frm.doc.update_doc === "Journal Entry") {
            if (!frm.doc.journal_entry_id) {
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: __("Please select a Journal Entry to update.")
                });
                return;
            }
            doc_id = frm.doc.journal_entry_id;
        } else if (frm.doc.update_doc === "Payment Entry") {
            if (!frm.doc.payment_entry_id) {
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: __("Please select a Payment Entry to update.")
                });
                return;
            }
            doc_id = frm.doc.payment_entry_id;
        }

        if (!frm.doc.amount || frm.doc.amount <= 0) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please enter a valid Amount greater than 0.")
            });
            return;
        }

        if (!frm.doc.posting_date) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please enter a Posting Date.")
            });
            return;
        }

        // Fetch docstatus to determine if a confirmation is needed
        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: doctype,
                filters: { name: doc_id },
                fieldname: "docstatus"
            },
            callback: function(r) {
                if (r.message && r.message.docstatus !== undefined) {
                    const docstatus = r.message.docstatus;
                    if (docstatus === 1) {
                        // Show confirmation prompt for submitted document
                        frappe.confirm(
                            __("This document is submitted. Do you really want to update?"),
                            function() {
                                // User confirmed, proceed with update
                                perform_update(frm, doctype, doc_id);
                            },
                            function() {
                                // User cancelled, do nothing
                                frappe.msgprint({
                                    title: __("Cancelled"),
                                    indicator: "orange",
                                    message: __("Update operation cancelled.")
                                });
                            }
                        );
                    } else {
                        // Document is Draft or Cancelled, proceed without confirmation
                        perform_update(frm, doctype, doc_id);
                    }
                } else {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to fetch document status.")
                    });
                }
            },
            error: function(err) {
                console.error("Error fetching docstatus:", err);
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: __("Failed to fetch document status: {0}", [err.message])
                });
            }
        });
    },

    after_save: function(frm) {
        // Clear all fields after saving to ensure the form is reset
        clear_all_fields(frm);
        // Reload the form to reflect the cleared state
        frm.reload_doc();
    }
});

// Helper function to perform the update via server-side method
function perform_update(frm, doctype, doc_id) {
    frappe.call({
        method: "autowings_app.autowings_app.doctype.autowings_settings.autowings_settings.update_document",
        args: {
            doctype: doctype,
            doc_id: doc_id,
            amount: frm.doc.amount,
            posting_date: frm.doc.posting_date
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                frappe.msgprint({
                    title: __("Success"),
                    indicator: "green",
                    message: __("{0} {1} updated successfully.", [doctype, doc_id])
                });
                // Clear all fields after successful update
                clear_all_fields(frm);
                // Reload the form to ensure the cleared state is reflected
                frm.reload_doc();
            } else {
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: r.message ? r.message.error : __("Failed to update {0}.", [doctype])
                });
            }
        },
        error: function(err) {
            console.error("Error during update:", err);
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Failed to update {0}: {1}", [doctype, err.message])
            });
        }
    });
}

// Helper function to update fields for Payment Entry
function update_payment_entry_details(frm, payment_entry, customer) {
    const doc_status = payment_entry.docstatus === 0 ? "Draft" : payment_entry.docstatus === 1 ? "Submitted" : "Cancelled";
    frm.set_value("customer", customer);
    frm.set_value("posting_date", payment_entry.posting_date);
    frm.set_value("doc_status", doc_status);
    frm.set_value("amount", payment_entry.paid_amount);
}

// Helper function to clear Doc Details section
function clear_doc_details(frm) {
    frm.set_value("customer", "");
    frm.set_value("customer_name", "");
    frm.set_value("posting_date", "");
    frm.set_value("doc_status", "");
    frm.set_value("amount", 0);
}

// Helper function to clear all fields
function clear_all_fields(frm) {
    frm.set_value("update_doc", "");
    frm.set_value("journal_entry_id", "");
    frm.set_value("payment_entry_id", "");
    clear_doc_details(frm);
}






// update for vsm

frappe.ui.form.on("Autowings Settings", {
    refresh: function(frm) {
        // Hide doc_id and open_doc fields by default on form refresh
        frm.set_df_property("doc_id", "hidden", 1);
        frm.set_df_property("open_doc", "hidden", 1);
        // Ensure doc_status2 is a Data field by default and read-only
        frm.set_df_property("doc_status2", "fieldtype", "Data");
        frm.set_df_property("doc_status2", "read_only", 1);
        frm.set_df_property("doc_status2", "options", "");
        // If vehicle_doc is not selected, ensure fields are cleared
        if (!frm.doc.vehicle_doc) {
            frm.set_value("doc_id", "");
            frm.set_value("doc_customer2", "");
            frm.set_value("doc_status2", "");
        } else {
            // If vehicle_doc is set on refresh, trigger the vehicle_doc handler
            frm.trigger("vehicle_doc");
        }
    },

    vehicle_doc: function(frm) {
        // Map vehicle_doc options to their corresponding doctypes
        const doctypeMap = {
            "RTO Registration": "RTO Registration",
            "Vehicle Insurance": "Vehicle Insurance",
            "Vehicle Finance": "Vehicle Finance",
            "Vehicle Smart Card": "Vehicle Smart Card",
            "Vehicle RSA": "Vehicle RSA",
            "Vehicle Extended Warranty": "Vehicle Extended Warranty",
            "Vehicle Misc Sales": "Vehicle Misc Sales"
        };

        if (frm.doc.vehicle_doc) {
            const selectedDoctype = doctypeMap[frm.doc.vehicle_doc];
            if (selectedDoctype) {
                // Clear previous values
                frm.set_value("doc_id", "");
                frm.set_value("doc_customer2", "");
                frm.set_value("doc_status2", "");
                // Show doc_id field and set it as a Link field
                frm.set_df_property("doc_id", "hidden", 0);
                frm.set_df_property("doc_id", "fieldtype", "Link");
                frm.set_df_property("doc_id", "options", selectedDoctype);
                frm.set_df_property("doc_id", "label", `${frm.doc.vehicle_doc} ID`);
                // Add a query filter to enforce the correct doctype
                frm.set_query("doc_id", function() {
                    return {
                        filters: {
                            doctype: selectedDoctype
                        }
                    };
                });
                // Hide open_doc since doc_id is cleared
                frm.set_df_property("open_doc", "hidden", 1);
                // Reset doc_status2 to Data field
                frm.set_df_property("doc_status2", "fieldtype", "Data");
                frm.set_df_property("doc_status2", "read_only", 1);
                frm.set_df_property("doc_status2", "options", "");
                // Refresh fields
                frm.refresh_field("doc_id");
                frm.refresh_field("doc_status2");
                frm.refresh_field("open_doc");
            } else {
                // If the selected option is invalid, hide doc_id and clear values
                frm.set_df_property("doc_id", "hidden", 1);
                frm.set_value("doc_id", "");
                frm.set_value("doc_customer2", "");
                frm.set_value("doc_status2", "");
                frm.set_df_property("open_doc", "hidden", 1);
            }
        } else {
            // If vehicle_doc is cleared, hide doc_id and clear values
            frm.set_df_property("doc_id", "hidden", 1);
            frm.set_value("doc_id", "");
            frm.set_value("doc_customer2", "");
            frm.set_value("doc_status2", "");
            frm.set_df_property("open_doc", "hidden", 1);
            // Clear the query filter
            frm.set_query("doc_id", function() {
                return {};
            });
            // Reset doc_status2 to Data field
            frm.set_df_property("doc_status2", "fieldtype", "Data");
            frm.set_df_property("doc_status2", "read_only", 1);
            frm.set_df_property("doc_status2", "options", "");
            frm.refresh_field("doc_status2");
            frm.refresh_field("open_doc");
        }
    },

    fetch: function(frm) {
        if (!frm.doc.vehicle_doc || !frm.doc.doc_id) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please select a Vehicle Doc and Doc ID.")
            });
            return;
        }

        // Map vehicle_doc options to their corresponding doctypes and routes
        const doctypeMap = {
            "RTO Registration": { doctype: "RTO Registration", route: "rto-registration" },
            "Vehicle Insurance": { doctype: "Vehicle Insurance", route: "vehicle-insurance" },
            "Vehicle Finance": { doctype: "Vehicle Finance", route: "vehicle-finance" },
            "Vehicle Smart Card": { doctype: "Vehicle Smart Card", route: "vehicle-smart-card" },
            "Vehicle RSA": { doctype: "Vehicle RSA", route: "vehicle-rsa" },
            "Vehicle Extended Warranty": { doctype: "Vehicle Extended Warranty", route: "vehicle-extended-warranty" },
            "Vehicle Misc Sales": { doctype: "Vehicle Misc Sales", route: "vehicle-misc-sales" }
        };

        // Define status options based on vehicle_doc selection
        const statusOptionsMap = {
            "RTO Registration": [
                "Due Application Entry",
                "Required Update",
                "Due Verification of Application",
                "Due Payment to RTO",
                "Due Registration Number Entry",
                "Due Number Plate Ordering",
                "Number Plate Not Received",
                "Due Number Plate Installation",
                "Due Documents Submission to DTO",
                "Documents Not Received from DTO",
                "Due Scanning RC",
                "Due Handover to Customer",
                "Completed"
            ],
            "Vehicle Insurance": [
                "Due Update",
                "Due Verification",
                "Payment Due",
                "Completed"
            ],
            "Vehicle Finance": [
                "Due Update",
                "Due Verification",
                "Payment Not Received",
                "Completed"
            ],
            "Vehicle Smart Card": [
                "Due Payment to RTO",
                "Completed"
            ],
            "Vehicle RSA": [
                "Due Update",
                "Due Verification",
                "Payment Due",
                "Completed"
            ],
            "Vehicle Extended Warranty": [
                "Due Update",
                "Due Verification",
                "Payment Due",
                "Completed"
            ],
            "Vehicle Misc Sales": [
                "Due Update",
                "Due Payment",
                "Completed"
            ]
        };

        const selectedDoctypeInfo = doctypeMap[frm.doc.vehicle_doc];
        if (!selectedDoctypeInfo) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Invalid Vehicle Doc selected.")
            });
            return;
        }

        // Fetch the document specified in doc_id
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: selectedDoctypeInfo.doctype,
                name: frm.doc.doc_id,
                fields: ["customer", "status"]
            },
            callback: function(r) {
                if (r.message) {
                    const doc = r.message;
                    // Populate doc_customer2 and doc_status2
                    frm.set_value("doc_customer2", doc.customer || "");
                    frm.set_value("doc_status2", doc.status || "");

                    // Change doc_status2 to a Select field with appropriate options
                    const statusOptions = statusOptionsMap[frm.doc.vehicle_doc];
                    if (statusOptions) {
                        frm.set_df_property("doc_status2", "fieldtype", "Select");
                        frm.set_df_property("doc_status2", "read_only", 0);
                        frm.set_df_property("doc_status2", "options", statusOptions.join("\n"));
                        // Ensure the fetched status is selected if it exists in the options
                        if (doc.status && statusOptions.includes(doc.status)) {
                            frm.set_value("doc_status2", doc.status);
                        } else {
                            frm.set_value("doc_status2", statusOptions[0]); // Default to the first option
                        }
                        frm.refresh_field("doc_status2");
                    } else {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("No status options available for the selected Vehicle Doc.")
                        });
                    }

                    // Show open_doc button if doc_id and doc_customer2 have values
                    if (frm.doc.doc_id && frm.doc.doc_customer2) {
                        frm.set_df_property("open_doc", "hidden", 0);
                    } else {
                        frm.set_df_property("open_doc", "hidden", 1);
                    }
                    frm.refresh_field("open_doc");
                } else {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to fetch document details for {0}: {1}", [selectedDoctypeInfo.doctype, frm.doc.doc_id])
                    });
                    // Clear the fields if fetch fails
                    frm.set_value("doc_customer2", "");
                    frm.set_value("doc_status2", "");
                    frm.set_df_property("open_doc", "hidden", 1);
                    // Reset doc_status2 to Data field
                    frm.set_df_property("doc_status2", "fieldtype", "Data");
                    frm.set_df_property("doc_status2", "read_only", 1);
                    frm.set_df_property("doc_status2", "options", "");
                    frm.refresh_field("doc_status2");
                    frm.refresh_field("open_doc");
                }
            },
            error: function(err) {
                console.error("Error fetching document:", err);
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: __("Failed to fetch document details: {0}", [err.message])
                });
                // Clear the fields on error
                frm.set_value("doc_customer2", "");
                frm.set_value("doc_status2", "");
                frm.set_df_property("open_doc", "hidden", 1);
                // Reset doc_status2 to Data field
                frm.set_df_property("doc_status2", "fieldtype", "Data");
                frm.set_df_property("doc_status2", "read_only", 1);
                frm.set_df_property("doc_status2", "options", "");
                frm.refresh_field("doc_status2");
                frm.refresh_field("open_doc");
            }
        });
    },

    open_doc: function(frm) {
        if (!frm.doc.vehicle_doc || !frm.doc.doc_id) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please select a Vehicle Doc and Doc ID.")
            });
            return;
        }

        // Map vehicle_doc options to their corresponding routes
        const routeMap = {
            "RTO Registration": "rto-registration",
            "Vehicle Insurance": "vehicle-insurance",
            "Vehicle Finance": "vehicle-finance",
            "Vehicle Smart Card": "vehicle-smart-card",
            "Vehicle RSA": "vehicle-rsa",
            "Vehicle Extended Warranty": "vehicle-extended-warranty",
            "Vehicle Misc Sales": "vehicle-misc-sales"
        };

        const route = routeMap[frm.doc.vehicle_doc];
        if (route && frm.doc.doc_id) {
            // Redirect to the document's view page
            frappe.set_route("Form", route, frm.doc.doc_id);
        } else {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Cannot open document. Invalid Vehicle Doc or Doc ID.")
            });
        }
    },

    update2: function(frm) {
        if (!frm.doc.vehicle_doc || !frm.doc.doc_id || !frm.doc.doc_status2) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Please ensure Vehicle Doc, Doc ID, and Status are set before updating.")
            });
            return;
        }

        // Map vehicle_doc options to their corresponding doctypes
        const doctypeMap = {
            "RTO Registration": "RTO Registration",
            "Vehicle Insurance": "Vehicle Insurance",
            "Vehicle Finance": "Vehicle Finance",
            "Vehicle Smart Card": "Vehicle Smart Card",
            "Vehicle RSA": "Vehicle RSA",
            "Vehicle Extended Warranty": "Vehicle Extended Warranty",
            "Vehicle Misc Sales": "Vehicle Misc Sales"
        };

        const selectedDoctype = doctypeMap[frm.doc.vehicle_doc];
        if (!selectedDoctype) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Invalid Vehicle Doc selected.")
            });
            return;
        }

        // Update the status field of the document
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: selectedDoctype,
                name: frm.doc.doc_id,
                fieldname: "status",
                value: frm.doc.doc_status2
            },
            callback: function(r) {
                if (r.message) {
                    frappe.msgprint({
                        title: __("Success"),
                        indicator: "green",
                        message: __("Updated")
                    });
                    // Clear all fields
                    frm.set_value("vehicle_doc", "");
                    frm.set_value("doc_id", "");
                    frm.set_value("doc_customer2", "");
                    frm.set_value("doc_status2", "");
                    // Reset field states
                    frm.set_df_property("doc_id", "hidden", 1);
                    frm.set_df_property("open_doc", "hidden", 1);
                    frm.set_df_property("doc_status2", "fieldtype", "Data");
                    frm.set_df_property("doc_status2", "read_only", 1);
                    frm.set_df_property("doc_status2", "options", "");
                    // Refresh fields
                    frm.refresh_field("doc_id");
                    frm.refresh_field("doc_status2");
                    frm.refresh_field("open_doc");
                    // Reload the form to reflect the cleared state
                    frm.reload_doc();
                } else {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Failed to update the status for {0}: {1}", [selectedDoctype, frm.doc.doc_id])
                    });
                }
            },
            error: function(err) {
                console.error("Error updating document:", err);
                frappe.msgprint({
                    title: __("Error"),
                    indicator: "red",
                    message: __("Failed to update the status: {0}", [err.message])
                });
            }
        });
    },

    after_save: function(frm) {
        // Hide doc_id and open_doc, clear fields after saving
        frm.set_df_property("doc_id", "hidden", 1);
        frm.set_df_property("open_doc", "hidden", 1);
        frm.set_value("vehicle_doc", "");
        frm.set_value("doc_id", "");
        frm.set_value("doc_customer2", "");
        frm.set_value("doc_status2", "");
        // Reset doc_status2 to Data field
        frm.set_df_property("doc_status2", "fieldtype", "Data");
        frm.set_df_property("doc_status2", "read_only", 1);
        frm.set_df_property("doc_status2", "options", "");
        frm.refresh_field("doc_status2");
        frm.refresh_field("open_doc");
        // Reload the form to reflect the cleared state
        frm.reload_doc();
    }
});