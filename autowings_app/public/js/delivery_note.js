// frappe.ui.form.on('Delivery Note', {
//     refresh: function(frm) {
//         if (frm.doc.sales_invoice) {
//             frappe.call({
//                 method: 'autowings_app.autowings_app.api.get_serial_no_details',
//                 args: { sales_invoice: frm.doc.sales_invoice },
//                 callback: function(r) {
//                     if (r.message) {
//                         frm.set_value('chassis_number', r.message.chassis_number);
//                         frm.set_value('engine_number', r.message.engine_number);
//                         frm.set_value('vehicle_color', r.message.vehicle_color);
//                     }
//                 }
//             });
//         }
//     }
// });

// // update
// frappe.ui.form.on("Delivery Note", {
//     refresh: function(frm) {
//         if (frm.doc.docstatus === 1) {
//             frm.add_custom_button("Update Vehicle Sales Master", function() {
//                 frappe.call({
//                     method: "autowings_app.custom_scripts.delivery_note.update_vehicle_sales_master_from_delivery_note",
//                     args: { delivery_note: frm.doc.name },
//                     callback: function(response) {
//                         if (response.message) {
//                             // frappe.msgprint("Vehicle Sales Masters Updated Successfully.");
//                             frm.reload_doc();
//                         }
//                     }
//                 });
//             }, "Actions");
//         }
//     }
// });



// // ---------------------
frappe.ui.form.on('Delivery Note', {
    refresh: function(frm) {
        // Fetch serial number details from Sales Invoice
        if (frm.doc.sales_invoice) {
            frappe.call({
                method: 'autowings_app.autowings_app.api.get_serial_no_details',
                args: { sales_invoice: frm.doc.sales_invoice },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value('chassis_number', r.message.chassis_number);
                        frm.set_value('engine_number', r.message.engine_number);
                        frm.set_value('vehicle_color', r.message.vehicle_color);
                    }
                }
            });
        }

        // Add button to update Vehicle Sales Master if submitted
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button("Update Vehicle Sales Master", function() {
                frappe.call({
                    method: "autowings_app.custom_scripts.delivery_note.update_vehicle_sales_master_from_delivery_note",
                    args: { delivery_note: frm.doc.name },
                    callback: function(response) {
                        if (response.message) {
                            let msg = frm.doc.is_return ? 
                                "Vehicle Sales Masters Updated (Return Processed)." : 
                                "Vehicle Sales Masters Updated Successfully.";
                            frappe.msgprint(msg);
                            frm.reload_doc();
                        }
                    }
                });
            }, "Actions");
        }
    }
});


// custom button modal


// frappe.ui.form.on("Delivery Note", {
//     refresh: function(frm) {
//         // Only show the modal for new Delivery Notes or when custom_delivery_note_type is not set
//         if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
//             // If custom_delivery_note_type is already set (e.g., on existing docs), apply field visibility rules
//             toggle_delivery_note_fields(frm);
//             return;
//         }

//         enforce_delivery_note_type_selection(frm);
//     },

//     custom_delivery_note_type: function(frm) {
//         // Handle field visibility and mandatory settings when custom_delivery_note_type changes
//         toggle_delivery_note_fields(frm);
//     },

//     custom_job_card_id: function(frm) {
//         // When custom_job_card_id is selected, fetch the customer from the AW Job Card
//         if (frm.doc.custom_job_card_id && frm.doc.custom_delivery_note_type === "Job Card") {
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "AW Job Card",
//                     filters: { name: frm.doc.custom_job_card_id },
//                     fieldname: ["customer"]
//                 },
//                 callback: function(response) {
//                     if (response.message) {
//                         const customer = response.message.customer;
//                         if (customer) {
//                             // Set the customer value
//                             frm.set_value("customer", customer);
//                             // Unhide the customer field and make it read-only
//                             frm.set_df_property("customer", "hidden", 0);
//                             frm.set_df_property("customer", "read_only", 1);
//                             frm.refresh_field("customer");
//                         } else {
//                             frappe.msgprint({
//                                 title: __("Warning"),
//                                 indicator: "orange",
//                                 message: __("Customer not found in AW Job Card: {0}", [frm.doc.custom_job_card_id])
//                             });
//                             frm.set_value("customer", "");
//                             // Keep customer field hidden if no customer is found
//                             frm.set_df_property("customer", "hidden", 1);
//                             frm.set_df_property("customer", "read_only", 0);
//                             frm.refresh_field("customer");
//                         }
//                     } else {
//                         frappe.msgprint({
//                             title: __("Error"),
//                             indicator: "red",
//                             message: __("Failed to fetch details for AW Job Card: {0}", [frm.doc.custom_job_card_id])
//                         });
//                         frm.set_value("customer", "");
//                         // Keep customer field hidden on error
//                         frm.set_df_property("customer", "hidden", 1);
//                         frm.set_df_property("customer", "read_only", 0);
//                         frm.refresh_field("customer");
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __("Error"),
//                         indicator: "red",
//                         message: __("Error fetching AW Job Card details: {0}", [err.message])
//                     });
//                     frm.set_value("customer", "");
//                     // Keep customer field hidden on error
//                     frm.set_df_property("customer", "hidden", 1);
//                     frm.set_df_property("customer", "read_only", 0);
//                     frm.refresh_field("customer");
//                 }
//             });
//         } else {
//             // Clear customer if custom_job_card_id is cleared, but respect visibility based on delivery note type
//             frm.set_value("customer", "");
//             // Only hide customer if delivery note type is Job Card and no custom_job_card_id is selected
//             if (frm.doc.custom_delivery_note_type === "Job Card") {
//                 frm.set_df_property("customer", "hidden", 1);
//                 frm.set_df_property("customer", "read_only", 0);
//             } else {
//                 // Ensure customer is visible for Normal or unset delivery note type
//                 frm.set_df_property("customer", "hidden", 0);
//                 frm.set_df_property("customer", "read_only", 0);
//             }
//             frm.refresh_field("customer");
//         }
//     }
// });

// function enforce_delivery_note_type_selection(frm) {
//     if (window.deliveryNoteTypeDialogActive) return; // Prevent multiple popups
//     window.deliveryNoteTypeDialogActive = true;

//     // Define the delivery note types
//     const deliveryNoteTypes = [
//         { name: "Normal", label: "Normal" },
//         { name: "Job Card", label: "Job Card" }
//     ];

//     // Create the modal overlay
//     let wrapper = document.createElement("div");
//     wrapper.id = "delivery-note-type-overlay";
//     wrapper.style.opacity = "0";
//     wrapper.style.transition = "opacity 0.3s ease-in-out";
//     wrapper.innerHTML = `
//         <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//             position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
//             <div id="delivery-note-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                 text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
//                 <h4 style="margin-bottom: 20px;">Select Delivery Note Type</h4>
//                 <div id="delivery-note-type-buttons" style="display: flex; justify-content: center; gap: 40px; 
//                     padding-top: 10px; padding-bottom: 10px;">
//                 </div>
//             </div>
//         </div>
//     `;

//     document.body.appendChild(wrapper);

//     // Fade in the modal
//     setTimeout(() => {
//         wrapper.style.opacity = "1";
//     }, 10);

//     // Get the button container
//     let buttonContainer = document.getElementById("delivery-note-type-buttons");

//     // Dynamically create buttons for each delivery note type
//     deliveryNoteTypes.forEach(function(type) {
//         let button = document.createElement("button");
//         button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
//         button.className = "custom-button";
//         button.innerText = type.label;
//         button.style = `
//             background: ${type.name === "Normal" ? "#000" : "#6c757d"}; 
//             color: white; 
//             padding: 8px 20px; 
//             font-size: 18px; 
//             border: none; 
//             border-radius: 10px; 
//             cursor: pointer;
//         `;

//         // Add click event listener for each button
//         button.addEventListener("click", function() {
//             frm.set_value("custom_delivery_note_type", type.name);
//             toggle_delivery_note_fields(frm);
//             fadeOutAndCloseDeliveryNoteModal();
//         });

//         buttonContainer.appendChild(button);
//     });
// }

// function toggle_delivery_note_fields(frm) {
//     if (frm.doc.custom_delivery_note_type === "Normal") {
//         // For Normal: Hide custom_job_card_id
//         frm.set_df_property("custom_job_card_id", "hidden", 1);
//         frm.set_df_property("custom_job_card_id", "reqd", 0);
//         // Show customer field, make it editable
//         frm.set_df_property("customer", "hidden", 0);
//         frm.set_df_property("customer", "read_only", 0);
//         // Clear custom_job_card_id
//         frm.set_value("custom_job_card_id", "");
//         frm.refresh_field("custom_job_card_id");
//         frm.refresh_field("customer");
//     } else if (frm.doc.custom_delivery_note_type === "Job Card") {
//         // For Job Card: Show custom_job_card_id and make it mandatory
//         frm.set_df_property("custom_job_card_id", "hidden", 0);
//         frm.set_df_property("custom_job_card_id", "reqd", 1);
//         // Initially hide customer field until custom_job_card_id is selected
//         if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
//             frm.set_df_property("customer", "hidden", 1);
//             frm.set_df_property("customer", "read_only", 0);
//             frm.set_value("customer", "");
//         }
//         // Customer field visibility will be handled by custom_job_card_id handler
//     } else {
//         // Default state: Hide custom_job_card_id and show customer
//         frm.set_df_property("custom_job_card_id", "hidden", 1);
//         frm.set_df_property("custom_job_card_id", "reqd", 0);
//         frm.set_df_property("customer", "hidden", 0);
//         frm.set_df_property("customer", "read_only", 0);
//         frm.set_value("custom_job_card_id", "");
//         frm.set_value("customer", "");
//     }

//     // Refresh fields to apply changes
//     frm.refresh_field("custom_job_card_id");
//     frm.refresh_field("customer");
// }

// function fadeOutAndCloseDeliveryNoteModal() {
//     let wrapper = document.getElementById("delivery-note-type-overlay");
//     if (wrapper) {
//         wrapper.style.opacity = "0";
//         setTimeout(() => {
//             wrapper.remove();
//             window.deliveryNoteTypeDialogActive = false;
//         }, 300); // Match the transition duration (0.3s)
//     } else {
//         window.deliveryNoteTypeDialogActive = false;
//     }
// }

frappe.ui.form.on("Delivery Note", {
    refresh: function(frm) {
        // Only show the modal for new Delivery Notes or when custom_delivery_note_type is not set
        if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
            // If custom_delivery_note_type is already set (e.g., on existing docs), apply field visibility rules
            toggle_delivery_note_fields(frm);

            // If custom_delivery_note_type is set, set the naming series based on the type
            if (frm.doc.custom_delivery_note_type) {
                set_naming_series(frm);
            }
            return;
        }

        enforce_delivery_note_type_selection(frm);
    },

    custom_delivery_note_type: function(frm) {
        // Handle field visibility and mandatory settings when custom_delivery_note_type changes
        toggle_delivery_note_fields(frm);
        // Set the naming series based on the selected type
        set_naming_series(frm);
    },

    custom_job_card_id: function(frm) {
        // When custom_job_card_id is selected, fetch the customer from the AW Job Card
        if (frm.doc.custom_job_card_id && (frm.doc.custom_delivery_note_type === "Job Card" || frm.doc.custom_delivery_note_type === "Job Card Return")) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "AW Job Card",
                    filters: { name: frm.doc.custom_job_card_id },
                    fieldname: ["customer"]
                },
                callback: function(response) {
                    if (response.message) {
                        const customer = response.message.customer;
                        if (customer) {
                            // Set the customer value
                            frm.set_value("customer", customer);
                            // Unhide the customer field and make it read-only
                            frm.set_df_property("customer", "hidden", 0);
                            frm.set_df_property("customer", "read_only", 1);
                            frm.refresh_field("customer");
                        } else {
                            frappe.msgprint({
                                title: __("Warning"),
                                indicator: "orange",
                                message: __("Customer not found in AW Job Card: {0}", [frm.doc.custom_job_card_id])
                            });
                            frm.set_value("customer", "");
                            // Keep customer field hidden if no customer is found
                            frm.set_df_property("customer", "hidden", 1);
                            frm.set_df_property("customer", "read_only", 0);
                            frm.refresh_field("customer");
                        }
                    } else {
                        frappe.msgprint({
                            title: __("Error"),
                            indicator: "red",
                            message: __("Failed to fetch details for AW Job Card: {0}", [frm.doc.custom_job_card_id])
                        });
                        frm.set_value("customer", "");
                        // Keep customer field hidden on error
                        frm.set_df_property("customer", "hidden", 1);
                        frm.set_df_property("customer", "read_only", 0);
                        frm.refresh_field("customer");
                    }
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Error fetching AW Job Card details: {0}", [err.message])
                    });
                    frm.set_value("customer", "");
                    // Keep customer field hidden on error
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("customer", "read_only", 0);
                    frm.refresh_field("customer");
                }
            });
        } else {
            // Clear customer if custom_job_card_id is cleared, but respect visibility based on delivery note type
            frm.set_value("customer", "");
            // Only hide customer if delivery note type is Job Card/Job Card Return and no custom_job_card_id is selected
            if (frm.doc.custom_delivery_note_type === "Job Card" || frm.doc.custom_delivery_note_type === "Job Card Return") {
                frm.set_df_property("customer", "hidden", 1);
                frm.set_df_property("customer", "read_only", 0);
            } else {
                // Ensure customer is visible for Normal or unset delivery note type
                frm.set_df_property("customer", "hidden", 0);
                frm.set_df_property("customer", "read_only", 0);
            }
            frm.refresh_field("customer");
        }
    }
});

function enforce_delivery_note_type_selection(frm) {
    if (window.deliveryNoteTypeDialogActive) return; // Prevent multiple popups
    window.deliveryNoteTypeDialogActive = true;

    // Fetch enabled delivery note types from Autowings Naming Series
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                // Use the enabled delivery note types
                const deliveryNoteTypes = r.message;

                // Create the modal overlay
                let wrapper = document.createElement("div");
                wrapper.id = "delivery-note-type-overlay";
                wrapper.style.opacity = "0";
                wrapper.style.transition = "opacity 0.3s ease-in-out";
                wrapper.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
                        position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                        <div id="delivery-note-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                            text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                            <h4 style="margin-bottom: 20px;">Select Delivery Note Type</h4>
                            <div id="delivery-note-type-buttons" style="display: flex; justify-content: center; gap: 40px; 
                                padding-top: 10px; padding-bottom: 10px;">
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(wrapper);

                // Fade in the modal
                setTimeout(() => {
                    wrapper.style.opacity = "1";
                }, 10);

                // Get the button container
                let buttonContainer = document.getElementById("delivery-note-type-buttons");

                // Dynamically create buttons for each enabled delivery note type
                deliveryNoteTypes.forEach(function(type, index) {
                    let button = document.createElement("button");
                    button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
                    button.className = "custom-button";
                    button.innerText = type.label;
                    // Assign colors dynamically: Normal (black), Job Card (gray), Job Card Return (red), others cycle through colors
                    const colors = ["#000", "#6c757d", "#dc3545", "#28a745", "#17a2b8", "#ffc107"];
                    button.style = `
                        background: ${type.name === "Normal" ? "#000" : type.name === "Job Card" ? "#6c757d" : type.name === "Job Card Return" ? "#dc3545" : colors[index % colors.length]}; 
                        color: white; 
                        padding: 8px 20px; 
                        font-size: 18px; 
                        border: none; 
                        border-radius: 10px; 
                        cursor: pointer;
                    `;

                    // Add click event listener for each button
                    button.addEventListener("click", function() {
                        frm.set_value("custom_delivery_note_type", type.name);
                        // Set the naming series based on the selected type
                        frm.set_value("naming_series", type.naming_series);
                        toggle_delivery_note_fields(frm);
                        fadeOutAndCloseDeliveryNoteModal();
                    });

                    buttonContainer.appendChild(button);
                });
            } else {
                frappe.msgprint(__('No enabled Delivery Note types found in Autowings Naming Series.'));
                window.deliveryNoteTypeDialogActive = false;
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error fetching Delivery Note types: {0}', [err.message]));
            window.deliveryNoteTypeDialogActive = false;
        }
    });
}

function set_naming_series(frm) {
    // Fetch enabled delivery note types to get the naming series for the selected type
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                const selectedType = deliveryNoteTypes.find(type => type.name === frm.doc.custom_delivery_note_type);
                if (selectedType) {
                    frm.set_value("naming_series", selectedType.naming_series);
                    frm.refresh_field("naming_series");
                } else {
                    frappe.msgprint(__('Naming series not found for Delivery Note type: {0}', [frm.doc.custom_delivery_note_type]));
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error fetching naming series: {0}', [err.message]));
        }
    });
}

function toggle_delivery_note_fields(frm) {
    if (frm.doc.custom_delivery_note_type === "Normal") {
        // For Normal: Hide custom_job_card_id, is_return, and return_against
        frm.set_df_property("custom_job_card_id", "hidden", 1);
        frm.set_df_property("custom_job_card_id", "reqd", 0);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        // Show customer field, make it editable
        frm.set_df_property("customer", "hidden", 0);
        frm.set_df_property("customer", "read_only", 0);
        // Clear fields
        frm.set_value("custom_job_card_id", "");
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
        frm.refresh_field("custom_job_card_id");
        frm.refresh_field("is_return");
        frm.refresh_field("return_against");
        frm.refresh_field("customer");
    } else if (frm.doc.custom_delivery_note_type === "Job Card") {
        // For Job Card: Show custom_job_card_id and make it mandatory
        frm.set_df_property("custom_job_card_id", "hidden", 0);
        frm.set_df_property("custom_job_card_id", "reqd", 1);
        // Hide is_return and return_against
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        // Initially hide customer field until custom_job_card_id is selected
        if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
            frm.set_df_property("customer", "hidden", 1);
            frm.set_df_property("customer", "read_only", 0);
            frm.set_value("customer", "");
        }
        // Clear is_return and return_against
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
        frm.refresh_field("is_return");
        frm.refresh_field("return_against");
    } else if (frm.doc.custom_delivery_note_type === "Job Card Return") {
        // For Job Card Return: Show custom_job_card_id and make it mandatory
        frm.set_df_property("custom_job_card_id", "hidden", 0);
        frm.set_df_property("custom_job_card_id", "reqd", 1);
        // Show is_return, make it editable, and set to 1
        frm.set_df_property("is_return", "hidden", 0);
        frm.set_df_property("is_return", "read_only", 0);
        frm.set_value("is_return", 1);
        // Show return_against, make it mandatory and editable
        frm.set_df_property("return_against", "hidden", 0);
        frm.set_df_property("return_against", "reqd", 1);
        frm.set_df_property("return_against", "read_only", 0);
        // Initially hide customer field until custom_job_card_id is selected
        if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
            frm.set_df_property("customer", "hidden", 1);
            frm.set_df_property("customer", "read_only", 0);
            frm.set_value("customer", "");
        }
        frm.refresh_field("is_return");
        frm.refresh_field("return_against");
    } else {
        // Default state: Hide custom_job_card_id, is_return, and return_against; show customer
        frm.set_df_property("custom_job_card_id", "hidden", 1);
        frm.set_df_property("custom_job_card_id", "reqd", 0);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        frm.set_df_property("customer", "hidden", 0);
        frm.set_df_property("customer", "read_only", 0);
        frm.set_value("custom_job_card_id", "");
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
        frm.set_value("customer", "");
    }

    // Refresh fields to apply changes
    frm.refresh_field("custom_job_card_id");
    frm.refresh_field("is_return");
    frm.refresh_field("return_against");
    frm.refresh_field("customer");
}

function fadeOutAndCloseDeliveryNoteModal() {
    let wrapper = document.getElementById("delivery-note-type-overlay");
    if (wrapper) {
        wrapper.style.opacity = "0";
        setTimeout(() => {
            wrapper.remove();
            window.deliveryNoteTypeDialogActive = false;
        }, 300); // Match the transition duration (0.3s)
    } else {
        window.deliveryNoteTypeDialogActive = false;
    }
}

// frappe.ui.form.on("Delivery Note", {
//     refresh: function(frm) {
//         // Only show the modal for new Delivery Notes or when custom_delivery_note_type is not set
//         if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
//             // If custom_delivery_note_type is already set (e.g., on existing docs), apply field visibility rules
//             toggle_delivery_note_fields(frm);
//             return;
//         }

//         enforce_delivery_note_type_selection(frm);
//     },

//     custom_delivery_note_type: function(frm) {
//         // Handle field visibility and mandatory settings when custom_delivery_note_type changes
//         toggle_delivery_note_fields(frm);
//     },

//     custom_job_card_id: function(frm) {
//         // When custom_job_card_id is selected, fetch the customer from the AW Job Card
//         if (frm.doc.custom_job_card_id && (frm.doc.custom_delivery_note_type === "Job Card" || frm.doc.custom_delivery_note_type === "Job Card Return")) {
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "AW Job Card",
//                     filters: { name: frm.doc.custom_job_card_id },
//                     fieldname: ["customer"]
//                 },
//                 callback: function(response) {
//                     if (response.message) {
//                         const customer = response.message.customer;
//                         if (customer) {
//                             // Set the customer value
//                             frm.set_value("customer", customer);
//                             // Unhide the customer field and make it read-only
//                             frm.set_df_property("customer", "hidden", 0);
//                             frm.set_df_property("customer", "read_only", 1);
//                             frm.refresh_field("customer");
//                         } else {
//                             frappe.msgprint({
//                                 title: __("Warning"),
//                                 indicator: "orange",
//                                 message: __("Customer not found in AW Job Card: {0}", [frm.doc.custom_job_card_id])
//                             });
//                             frm.set_value("customer", "");
//                             // Keep customer field hidden if no customer is found
//                             frm.set_df_property("customer", "hidden", 1);
//                             frm.set_df_property("customer", "read_only", 0);
//                             frm.refresh_field("customer");
//                         }
//                     } else {
//                         frappe.msgprint({
//                             title: __("Error"),
//                             indicator: "red",
//                             message: __("Failed to fetch details for AW Job Card: {0}", [frm.doc.custom_job_card_id])
//                         });
//                         frm.set_value("customer", "");
//                         // Keep customer field hidden on error
//                         frm.set_df_property("customer", "hidden", 1);
//                         frm.set_df_property("customer", "read_only", 0);
//                         frm.refresh_field("customer");
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __("Error"),
//                         indicator: "red",
//                         message: __("Error fetching AW Job Card details: {0}", [err.message])
//                     });
//                     frm.set_value("customer", "");
//                     // Keep customer field hidden on error
//                     frm.set_df_property("customer", "hidden", 1);
//                     frm.set_df_property("customer", "read_only", 0);
//                     frm.refresh_field("customer");
//                 }
//             });
//         } else {
//             // Clear customer if custom_job_card_id is cleared, but respect visibility based on delivery note type
//             frm.set_value("customer", "");
//             // Only hide customer if delivery note type is Job Card/Job Card Return and no custom_job_card_id is selected
//             if (frm.doc.custom_delivery_note_type === "Job Card" || frm.doc.custom_delivery_note_type === "Job Card Return") {
//                 frm.set_df_property("customer", "hidden", 1);
//                 frm.set_df_property("customer", "read_only", 0);
//             } else {
//                 // Ensure customer is visible for Normal or unset delivery note type
//                 frm.set_df_property("customer", "hidden", 0);
//                 frm.set_df_property("customer", "read_only", 0);
//             }
//             frm.refresh_field("customer");
//         }
//     }
// });

// function enforce_delivery_note_type_selection(frm) {
//     if (window.deliveryNoteTypeDialogActive) return; // Prevent multiple popups
//     window.deliveryNoteTypeDialogActive = true;

//     // Define the delivery note types
//     const deliveryNoteTypes = [
//         { name: "Normal", label: "Normal" },
//         { name: "Job Card", label: "Job Card" },
//         { name: "Job Card Return", label: "Job Card Return" }
//     ];

//     // Create the modal overlay
//     let wrapper = document.createElement("div");
//     wrapper.id = "delivery-note-type-overlay";
//     wrapper.style.opacity = "0";
//     wrapper.style.transition = "opacity 0.3s ease-in-out";
//     wrapper.innerHTML = `
//         <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//             position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
//             <div id="delivery-note-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                 text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
//                 <h4 style="margin-bottom: 20px;">Select Delivery Note Type</h4>
//                 <div id="delivery-note-type-buttons" style="display: flex; justify-content: center; gap: 40px; 
//                     padding-top: 10px; padding-bottom: 10px;">
//                 </div>
//             </div>
//         </div>
//     `;

//     document.body.appendChild(wrapper);

//     // Fade in the modal
//     setTimeout(() => {
//         wrapper.style.opacity = "1";
//     }, 10);

//     // Get the button container
//     let buttonContainer = document.getElementById("delivery-note-type-buttons");

//     // Dynamically create buttons for each delivery note type
//     deliveryNoteTypes.forEach(function(type) {
//         let button = document.createElement("button");
//         button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
//         button.className = "custom-button";
//         button.innerText = type.label;
//         button.style = `
//             background: ${type.name === "Normal" ? "#000" : type.name === "Job Card" ? "#6c757d" : "#dc3545"}; 
//             color: white; 
//             padding: 8px 20px; 
//             font-size: 18px; 
//             border: none; 
//             border-radius: 10px; 
//             cursor: pointer;
//         `;

//         // Add click event listener for each button
//         button.addEventListener("click", function() {
//             frm.set_value("custom_delivery_note_type", type.name);
//             toggle_delivery_note_fields(frm);
//             fadeOutAndCloseDeliveryNoteModal();
//         });

//         buttonContainer.appendChild(button);
//     });
// }

// function toggle_delivery_note_fields(frm) {
//     if (frm.doc.custom_delivery_note_type === "Normal") {
//         // For Normal: Hide custom_job_card_id, is_return, and return_against
//         frm.set_df_property("custom_job_card_id", "hidden", 1);
//         frm.set_df_property("custom_job_card_id", "reqd", 0);
//         frm.set_df_property("is_return", "hidden", 1);
//         frm.set_df_property("is_return", "read_only", 1);
//         frm.set_df_property("return_against", "hidden", 1);
//         frm.set_df_property("return_against", "reqd", 0);
//         frm.set_df_property("return_against", "read_only", 0);
//         // Show customer field, make it editable
//         frm.set_df_property("customer", "hidden", 0);
//         frm.set_df_property("customer", "read_only", 0);
//         // Clear fields
//         frm.set_value("custom_job_card_id", "");
//         frm.set_value("is_return", 0);
//         frm.set_value("return_against", "");
//         frm.refresh_field("custom_job_card_id");
//         frm.refresh_field("is_return");
//         frm.refresh_field("return_against");
//         frm.refresh_field("customer");
//     } else if (frm.doc.custom_delivery_note_type === "Job Card") {
//         // For Job Card: Show custom_job_card_id and make it mandatory
//         frm.set_df_property("custom_job_card_id", "hidden", 0);
//         frm.set_df_property("custom_job_card_id", "reqd", 1);
//         // Hide is_return and return_against
//         frm.set_df_property("is_return", "hidden", 1);
//         frm.set_df_property("is_return", "read_only", 1);
//         frm.set_df_property("return_against", "hidden", 1);
//         frm.set_df_property("return_against", "reqd", 0);
//         frm.set_df_property("return_against", "read_only", 0);
//         // Initially hide customer field until custom_job_card_id is selected
//         if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
//             frm.set_df_property("customer", "hidden", 1);
//             frm.set_df_property("customer", "read_only", 0);
//             frm.set_value("customer", "");
//         }
//         // Clear is_return and return_against
//         frm.set_value("is_return", 0);
//         frm.set_value("return_against", "");
//         frm.refresh_field("is_return");
//         frm.refresh_field("return_against");
//     } else if (frm.doc.custom_delivery_note_type === "Job Card Return") {
//         // For Job Card Return: Show custom_job_card_id and make it mandatory
//         frm.set_df_property("custom_job_card_id", "hidden", 0);
//         frm.set_df_property("custom_job_card_id", "reqd", 1);
//         // Show is_return, make it editable, and set to 1
//         frm.set_df_property("is_return", "hidden", 0);
//         frm.set_df_property("is_return", "read_only", 0);
//         frm.set_value("is_return", 1);
//         // Show return_against, make it mandatory and editable
//         frm.set_df_property("return_against", "hidden", 0);
//         frm.set_df_property("return_against", "reqd", 1);
//         frm.set_df_property("return_against", "read_only", 0);
//         // Initially hide customer field until custom_job_card_id is selected
//         if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
//             frm.set_df_property("customer", "hidden", 1);
//             frm.set_df_property("customer", "read_only", 0);
//             frm.set_value("customer", "");
//         }
//         frm.refresh_field("is_return");
//         frm.refresh_field("return_against");
//     } else {
//         // Default state: Hide custom_job_card_id, is_return, and return_against; show customer
//         frm.set_df_property("custom_job_card_id", "hidden", 1);
//         frm.set_df_property("custom_job_card_id", "reqd", 0);
//         frm.set_df_property("is_return", "hidden", 1);
//         frm.set_df_property("is_return", "read_only", 1);
//         frm.set_df_property("return_against", "hidden", 1);
//         frm.set_df_property("return_against", "reqd", 0);
//         frm.set_df_property("return_against", "read_only", 0);
//         frm.set_df_property("customer", "hidden", 0);
//         frm.set_df_property("customer", "read_only", 0);
//         frm.set_value("custom_job_card_id", "");
//         frm.set_value("is_return", 0);
//         frm.set_value("return_against", "");
//         frm.set_value("customer", "");
//     }

//     // Refresh fields to apply changes
//     frm.refresh_field("custom_job_card_id");
//     frm.refresh_field("is_return");
//     frm.refresh_field("return_against");
//     frm.refresh_field("customer");
// }

// function fadeOutAndCloseDeliveryNoteModal() {
//     let wrapper = document.getElementById("delivery-note-type-overlay");
//     if (wrapper) {
//         wrapper.style.opacity = "0";
//         setTimeout(() => {
//             wrapper.remove();
//             window.deliveryNoteTypeDialogActive = false;
//         }, 300); // Match the transition duration (0.3s)
//     } else {
//         window.deliveryNoteTypeDialogActive = false;
//     }
// }