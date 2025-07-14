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



// ---------------------// Custom script for Delivery Note to handle custom delivery note types

// frappe.ui.form.on("Delivery Note", {
//     refresh: function(frm) {
//         // Only show the modal for new Delivery Notes or when custom_delivery_note_type is not set
//         if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
//             // If custom_delivery_note_type is already set (e.g., on existing docs), apply field visibility rules
//             toggle_delivery_note_fields(frm);

//             // If custom_delivery_note_type is set, set the naming series based on the type
//             if (frm.doc.custom_delivery_note_type) {
//                 set_naming_series(frm);
//             }
//             return;
//         }

//         enforce_delivery_note_type_selection(frm);
//     },

//     custom_delivery_note_type: function(frm) {
//         // Handle field visibility and mandatory settings when custom_delivery_note_type changes
//         toggle_delivery_note_fields(frm);
//         // Set the naming series based on the selected type
//         set_naming_series(frm);
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

//     // Fetch enabled delivery note types from Autowings Naming Series
//     frappe.call({
//         method: "autowings_app.api.get_enabled_delivery_note_types",
//         callback: function(r) {
//             if (r.message && r.message.length > 0) {
//                 // Use the enabled delivery note types
//                 const deliveryNoteTypes = r.message;

//                 // Create the modal overlay
//                 let wrapper = document.createElement("div");
//                 wrapper.id = "delivery-note-type-overlay";
//                 wrapper.style.opacity = "0";
//                 wrapper.style.transition = "opacity 0.3s ease-in-out";
//                 wrapper.innerHTML = `
//                     <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//                         position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
//                         <div id="delivery-note-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                             text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
//                             <h4 style="margin-bottom: 20px;">Select Delivery Note Type</h4>
//                             <div id="delivery-note-type-buttons" style="display: flex; justify-content: center; gap: 40px; 
//                                 padding-top: 10px; padding-bottom: 10px;">
//                             </div>
//                         </div>
//                     </div>
//                 `;

//                 document.body.appendChild(wrapper);

//                 // Fade in the modal
//                 setTimeout(() => {
//                     wrapper.style.opacity = "1";
//                 }, 10);

//                 // Get the button container
//                 let buttonContainer = document.getElementById("delivery-note-type-buttons");

//                 // Dynamically create buttons for each enabled delivery note type
//                 deliveryNoteTypes.forEach(function(type, index) {
//                     let button = document.createElement("button");
//                     button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
//                     button.className = "custom-button";
//                     button.innerText = type.label;
//                     // Assign colors dynamically: Normal (black), Job Card (gray), Job Card Return (red), others cycle through colors
//                     const colors = ["#000", "#6c757d", "#dc3545", "#28a745", "#17a2b8", "#ffc107"];
//                     button.style = `
//                         background: ${type.name === "Normal" ? "#000" : type.name === "Job Card" ? "#6c757d" : type.name === "Job Card Return" ? "#dc3545" : colors[index % colors.length]}; 
//                         color: white; 
//                         padding: 8px 20px; 
//                         font-size: 18px; 
//                         border: none; 
//                         border-radius: 10px; 
//                         cursor: pointer;
//                     `;

//                     // Add click event listener for each button
//                     button.addEventListener("click", function() {
//                         frm.set_value("custom_delivery_note_type", type.name);
//                         // Set the naming series based on the selected type
//                         frm.set_value("naming_series", type.naming_series);
//                         toggle_delivery_note_fields(frm);
//                         fadeOutAndCloseDeliveryNoteModal();
//                     });

//                     buttonContainer.appendChild(button);
//                 });
//             } else {
//                 frappe.msgprint(__('No enabled Delivery Note types found in Autowings Naming Series.'));
//                 window.deliveryNoteTypeDialogActive = false;
//             }
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error fetching Delivery Note types: {0}', [err.message]));
//             window.deliveryNoteTypeDialogActive = false;
//         }
//     });
// }

// function set_naming_series(frm) {
//     // Fetch enabled delivery note types to get the naming series for the selected type
//     frappe.call({
//         method: "autowings_app.api.get_enabled_delivery_note_types",
//         callback: function(r) {
//             if (r.message && r.message.length > 0) {
//                 const deliveryNoteTypes = r.message;
//                 const selectedType = deliveryNoteTypes.find(type => type.name === frm.doc.custom_delivery_note_type);
//                 if (selectedType) {
//                     frm.set_value("naming_series", selectedType.naming_series);
//                     frm.refresh_field("naming_series");
//                 } else {
//                     frappe.msgprint(__('Naming series not found for Delivery Note type: {0}', [frm.doc.custom_delivery_note_type]));
//                 }
//             }
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error fetching naming series: {0}', [err.message]));
//         }
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


frappe.ui.form.on("Delivery Note", {
    refresh: function(frm) {
        if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
            if (frm.doc.custom_delivery_note_type && frm.doc.custom_delivery_note_type !== "Job Card Return") {
                toggle_delivery_note_fields(frm);
            }
            if (frm.doc.custom_delivery_note_type && frm.doc.custom_delivery_note_type !== "Job Card Return") {
                set_naming_series_and_warehouse(frm);
            }
            return;
        }
        enforce_delivery_note_type_selection(frm);
    },

    custom_delivery_note_type: function(frm) {
        if (frm.doc.custom_delivery_note_type && frm.doc.custom_delivery_note_type !== "Job Card Return") {
            toggle_delivery_note_fields(frm);
            set_naming_series_and_warehouse(frm);
        }
        if (frm.doc.custom_delivery_note_type === "Job Card Return" && !frm.doc.__islocal) {
            show_return_delivery_note_modal(frm);
        }
    },

    custom_job_card_id: function(frm) {
        if (frm.doc.custom_job_card_id && frm.doc.custom_delivery_note_type === "Job Card") {
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
                            frm.set_value("customer", customer);
                            frm.set_df_property("customer", "hidden", 0);
                            frm.set_df_property("customer", "read_only", 1);
                            frm.refresh_field("customer");
                        } else {
                            frappe.msgprint({ title: __("Warning"), indicator: "orange", message: __("Customer not found in AW Job Card: {0}", [frm.doc.custom_job_card_id]) });
                            frm.set_value("customer", "");
                            frm.set_df_property("customer", "hidden", 1);
                            frm.set_df_property("customer", "read_only", 0);
                            frm.refresh_field("customer");
                        }
                    } else {
                        frappe.msgprint({ title: __("Error"), indicator: "red", message: __("Failed to fetch details for AW Job Card: {0}", [frm.doc.custom_job_card_id]) });
                        frm.set_value("customer", "");
                        frm.set_df_property("customer", "hidden", 1);
                        frm.set_df_property("customer", "read_only", 0);
                        frm.refresh_field("customer");
                    }
                },
                error: function(err) {
                    frappe.msgprint({ title: __("Error"), indicator: "red", message: __("Error fetching AW Job Card details: {0}", [err.message]) });
                    frm.set_value("customer", "");
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("customer", "read_only", 0);
                    frm.refresh_field("customer");
                }
            });
        } else {
            frm.set_value("customer", "");
            if (frm.doc.custom_delivery_note_type === "Job Card") {
                frm.set_df_property("customer", "hidden", 1);
                frm.set_df_property("customer", "read_only", 0);
            } else {
                frm.set_df_property("customer", "hidden", 0);
                frm.set_df_property("customer", "read_only", 0);
            }
            frm.refresh_field("customer");
        }
    },

    onload: function(frm) {
        if (frm.doc.custom_delivery_note_type !== "Job Card Return") {
            frm.set_query("return_against", function() {
                if (frm.doc.custom_delivery_note_type === "Job Card" && frm.doc.custom_job_card_id) {
                    return {
                        filters: {
                            custom_job_card_id: frm.doc.custom_job_card_id,
                            docstatus: 1,
                            is_return: 0
                        }
                    };
                }
                return {};
            });
        }
        if (frm.doc.custom_delivery_note_type === "Normal") {
            frm.set_df_property("custom_vin", "hidden", 0);
        } else if (frm.doc.custom_delivery_note_type !== "Job Card Return") {
            frm.set_df_property("custom_vin", "hidden", 1);
            frm.set_df_property("custom_vin", "reqd", 0);
        }
        frm.refresh_field("custom_vin");
    },

    return_against: function(frm) {
        if (frm.doc.custom_delivery_note_type !== "Job Card Return" && frm.doc.custom_job_card_id && frm.doc.return_against) {
            show_item_selection_modal(frm);
        }
    },

    validate: function(frm) {
        if (frm.doc.items && frm.doc.custom_delivery_note_type !== "Job Card Return") {
            frm.doc.items = frm.doc.items.filter(item => item.item_code && item.qty);
            frm.refresh_field("items");
        }
    }
});

function enforce_delivery_note_type_selection(frm) {
    if (window.deliveryNoteTypeDialogActive) return;
    window.deliveryNoteTypeDialogActive = true;

    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
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
                setTimeout(() => { wrapper.style.opacity = "1"; }, 10);
                let buttonContainer = document.getElementById("delivery-note-type-buttons");
                deliveryNoteTypes.forEach(function(type, index) {
                    let button = document.createElement("button");
                    button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
                    button.className = "custom-button";
                    button.innerText = type.label;
                    const colors = ["#000", "#6c757d", "#dc3545", "#28a745", "#17a2b8", "#ffc107"];
                    button.style = `
                        background: ${colors[index % colors.length]}; 
                        color: white; 
                        padding: 8px 20px; 
                        font-size: 18px; 
                        border: none; 
                        border-radius: 10px; 
                        cursor: pointer;
                    `;
                    button.addEventListener("click", function() {
                        frm.set_value("custom_delivery_note_type", type.name);
                        frm.set_value("custom_delivery_note_label", type.label);
                        if (type.name !== "Job Card Return") {
                            frm.set_value("naming_series", type.naming_series);
                            frm.set_value("set_warehouse", type.warehouse || "");
                        }
                        toggle_delivery_note_fields(frm);
                        frm.set_df_property("naming_series", "read_only", 0);
                        frm.set_df_property("set_warehouse", "read_only", 0);
                        frm.refresh_field("naming_series");
                        frm.refresh_field("set_warehouse");
                        fadeOutAndCloseDeliveryNoteModal();
                        if (type.name === "Job Card Return") {
                            show_return_delivery_note_modal(frm);
                        }
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

function set_naming_series_and_warehouse(frm) {
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                const selectedLabel = frm.doc.custom_delivery_note_label;
                let selectedType = deliveryNoteTypes.find(type => type.label === selectedLabel);
                if (!selectedType) {
                    selectedType = deliveryNoteTypes.find(type => type.name === frm.doc.custom_delivery_note_type);
                }
                if (selectedType && frm.doc.custom_delivery_note_type !== "Job Card Return") {
                    frm.set_value("naming_series", selectedType.naming_series);
                    frm.set_value("set_warehouse", selectedType.warehouse || "");
                    frm.set_df_property("set_warehouse", "read_only", 0);
                    frm.refresh_field("set_warehouse", selectedType.warehouse || "");
                    frm.refresh_field("naming_series");
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error fetching naming series or warehouse: {0}', [err.message]));
        }
    });
}

function toggle_delivery_note_fields(frm) {
    if (frm.doc.custom_delivery_note_type === "Normal") {
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
        frm.refresh_field("custom_job_card_id");
        frm.refresh_field("is_return");
        frm.refresh_field("return_against");
        frm.refresh_field("customer");
    } else if (frm.doc.custom_delivery_note_type === "Job Card") {
        frm.set_df_property("custom_job_card_id", "hidden", 0);
        frm.set_df_property("custom_job_card_id", "reqd", 1);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
            frm.set_df_property("customer", "hidden", 1);
            frm.set_df_property("customer", "read_only", 0);
            frm.set_value("customer", "");
        }
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
        frm.refresh_field("is_return");
        frm.refresh_field("return_against");
    } else if (frm.doc.custom_delivery_note_type === "Job Card Return") {
        let formWrapper = frm.get_field("custom_job_card_id").$wrapper.closest(".form-layout");
        formWrapper.css({
            "filter": "blur(5px)",
            "pointer-events": "none",
            "opacity": "0.2"
        });
    } else {
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
    frm.refresh_field("custom_job_card_id");
    frm.refresh_field("is_return");
    frm.refresh_field("return_against");
    frm.refresh_field("customer");
}

function show_return_delivery_note_modal(frm) {
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                const selectedLabel = frm.doc.custom_delivery_note_label || frm.doc.custom_delivery_note_type;
                const selectedType = deliveryNoteTypes.find(type => type.label === selectedLabel || type.name === frm.doc.custom_delivery_note_type);
                if (selectedType) {
                    let d = new frappe.ui.Dialog({
                        title: __("Return Delivery Note Details"),
                        fields: [
                            {
                                fieldtype: "Link",
                                fieldname: "job_card_id",
                                label: __("Job Card ID"),
                                options: "AW Job Card",
                                reqd: 1,
                                onchange: function() {
                                    if (d.get_value("job_card_id")) {
                                        frappe.call({
                                            method: "frappe.client.get",
                                            args: {
                                                doctype: "AW Job Card",
                                                name: d.get_value("job_card_id")
                                            },
                                            callback: function(r) {
                                                if (r.message) {
                                                    d.set_value("customer", r.message.customer);
                                                    d.set_value("customer_name", r.message.customer_name);
                                                    const items = r.message.items || [];
                                                    const return_items = items.map(item => ({
                                                        item_code: item.item_code,
                                                        item_name: item.item_name,
                                                        delivery_note_id: item.delivery_note_id || "",
                                                        required_qty: item.required_qty || 0,
                                                        return_qty: 0
                                                    }));
                                                    // Store original items for filtering
                                                    d.original_return_items = return_items; 
                                                    d.set_value("return_items", return_items);
                                                    if (d.fields_dict.return_items) {
                                                        d.fields_dict.return_items.df.data = return_items;
                                                        d.fields_dict.return_items.refresh();
                                                        // Apply current filters if any
                                                        applyTableFilters(d); 
                                                    }
                                                } else {
                                                    d.set_value("customer", "");
                                                    d.set_value("customer_name", "");
                                                    d.set_value("return_items", []);
                                                    d.original_return_items = []; 
                                                    if (d.fields_dict.return_items) {
                                                        d.fields_dict.return_items.df.data = [];
                                                        d.fields_dict.return_items.refresh();
                                                    }     
                                                }
                                            },
                                            error: function(err) {
                                                frappe.msgprint(__('Error fetching AW Job Card details: {0}', [err.message]));
                                                d.set_value("customer", "");
                                                d.set_value("customer_name", "");
                                                d.set_value("return_items", []);
                                                d.original_return_items = []; 
                                                if (d.fields_dict.return_items) {
                                                    d.fields_dict.return_items.df.data = [];
                                                    d.fields_dict.return_items.refresh();
                                                }
                                            }
                                        });
                                    } else {
                                        d.set_value("customer", "");
                                        d.set_value("customer_name", "");
                                        d.set_value("return_items", []);
                                        d.original_return_items = []; 
                                        if (d.fields_dict.return_items) {
                                            d.fields_dict.return_items.df.data = [];
                                            d.fields_dict.return_items.refresh();
                                        }
                                    }
                                }
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "customer",
                                label: __("Customer"),
                                read_only: 1
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "customer_name",
                                label: __("Customer Name"),
                                read_only: 1
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "naming_series",
                                label: __("Naming Series"),
                                default: selectedType.naming_series,
                                read_only: 1
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "warehouse",
                                label: __("Warehouse"),
                                default: selectedType.warehouse || "",
                                read_only: 1
                        
                            },
                            // add two field item and return qty input field
                            
                            {
                                fieldtype: "Link",
                                fieldname: "item",
                                label: __("Item"),
                                options: "Item",
                            },
                            {
                                fieldtype: "Float",
                                fieldname: "return_qty",
                                label: __("Return Qty"),
                                reqd: 1,
                                default: 0,
                            },

                            // add button to update return items table return qty for the selected item

                            // {
                            //     fieldtype: "Button",
                            //     fieldname: "update_return_items",
                            //     label: __("Update Return Items"),
                            //     click: function() {
                            //         const item_code = d.get_value("item");
                            //         const return_qty = d.get_value("return_qty");
                            //         if (!item_code || !return_qty) {
                            //             frappe.msgprint(__("Please select an item and enter a return quantity."));
                            //             return;
                            //         }
                            //         const return_items = d.get_value("return_items") || [];
                            //         let item_found = false;
                            //         return_items.forEach(item => {
                            //             if (item.item_code === item_code) {
                            //                 item.return_qty = flt(return_qty);
                            //                 item_found = true;
                            //             }
                            //         });
                            //         if (!item_found) {
                            //             return_items.push({
                            //                 item_code: item_code,
                            //                 return_qty: flt(return_qty)
                            //             });
                            //         }
                            //         d.set_value("return_items", return_items);
                            //         applyTableFilters(d); // Refresh the table with updated items
                            //     }
                            // },
                            {
    fieldtype: "Button",
    fieldname: "update_return_items",
    label: __("Update Return Items"),
    click: function() {
        const item_code_to_update = d.get_value("item");
        let return_qty_input = flt(d.get_value("return_qty")); // The total quantity the user wants to return for this item

        if (!item_code_to_update || isNaN(return_qty_input) || return_qty_input <= 0) {
            frappe.msgprint(__("Please select an item and enter a positive return quantity."));
            return;
        }

        let current_table_items = d.get_value("return_items") || [];
        // Ensure we're working with the filtered items if filters are active,
        // but perform the update on the original items for consistency across the whole list.
        // It's safer to update `original_return_items` then re-apply filters.

        // Get all instances of the item from the original list
        const items_to_modify = (d.original_return_items || []).filter(item => item.item_code === item_code_to_update);

        if (items_to_modify.length === 0) {
            frappe.msgprint(__("Selected item not found in the list."));
            return;
        }

        // Calculate total available quantity for the selected item across all its rows
        const total_available_qty = items_to_modify.reduce((sum, item) => sum + flt(item.required_qty), 0);

        if (return_qty_input > total_available_qty) {
            frappe.msgprint(__("Return quantity ({0}) cannot exceed total available quantity ({1}) for item {2}.", [return_qty_input, total_available_qty, item_code_to_update]));
            // Optional: Set input to max available or clear it
            d.set_value("return_qty", total_available_qty);
            return;
        }

        let remaining_qty_to_distribute = return_qty_input;

        // Reset return_qty for all instances of this item first,
        // to ensure clean distribution.
        items_to_modify.forEach(item => {
            item.return_qty = 0;
        });

        // Distribute the return_qty across rows
        for (let i = 0; i < items_to_modify.length; i++) {
            let item = items_to_modify[i];
            const available_for_this_row = flt(item.required_qty);

            if (remaining_qty_to_distribute <= 0) {
                break; // All quantity distributed
            }

            if (remaining_qty_to_distribute >= available_for_this_row) {
                item.return_qty = available_for_this_row;
                remaining_qty_to_distribute -= available_for_this_row;
            } else {
                item.return_qty = remaining_qty_to_distribute;
                remaining_qty_to_distribute = 0;
            }
        }

        // Now, update the actual return_items data in the dialog
        // This is crucial because `items_to_modify` are references to objects within `d.original_return_items`
        // so changes are already reflected there. We just need to refresh the display.
        d.set_value("return_items", d.original_return_items); // Set to original, then re-apply filters
        applyTableFilters(d); // Re-apply filters to show the updated (and potentially filtered) list
    }
},
                            
                            {
                                fieldtype: "HTML", // Use HTML field to insert filter inputs
                                fieldname: "item_filter_controls",
                                label: "", // No label needed for this field
                                options: `
                                    <div class="row" style="margin-bottom: 10px;">
                                        <div class="col-sm-3">
                                            <input type="text" class="form-control item-filter" data-fieldname="item_code" placeholder="${__('Filter Item Code')}">
                                        </div>
                                        <div class="col-sm-3">
                                            <input type="text" class="form-control item-filter" data-fieldname="item_name" placeholder="${__('Filter Item Name')}">
                                        </div>
                                        <div class="col-sm-3">
                                            <input type="text" class="form-control item-filter" data-fieldname="delivery_note_id" placeholder="${__('Filter Delivery Note ID')}">
                                        </div>
                                        <div class="col-sm-3">
                                            </div>
                                    </div>
                                `
                            },
                            {
                                fieldtype: "Table",
                                fieldname: "return_items",
                                label: __("Return Items"),
                                cannot_add_rows: true,
                                cannot_delete_rows: true,
                                


                                fields: [
                                    {
                                        fieldtype: "Data",
                                        fieldname: "item_code",
                                        label: __("Item Code"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Data",
                                        fieldname: "item_name",
                                        label: __("Item Name"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Data",
                                        fieldname: "delivery_note_id",
                                        label: __("Delivery Note ID"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Float",
                                        fieldname: "required_qty",
                                        label: __("Available Qty"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Float",
                                        fieldname: "return_qty",
                                        label: __("Return Qty"),
                                        reqd: 1,
                                        in_list_view: 1,
                                        onchange: function() {
                                            const items = d.get_value("return_items") || [];
                                            items.forEach(item => {
                                                if (item.return_qty < 0) {
                                                    frappe.msgprint(__("Return quantity cannot be negative for item {0}", [item.item_code]));
                                                    item.return_qty = 0;
                                                    d.fields_dict.return_items.refresh();
                                                }
                                            });
                                        }
                                    }
                                ],
                                in_place_edit: true,
                                data: [],
                                get_data: function() {
                                    return d.get_value("return_items") || [];
                                }
                            }
                        ],
                        primary_action_label: __("Next"),
                        primary_action: function() {
                            const return_items = (d.get_value("return_items") || [])
                                .filter(item => item.return_qty > 0);
                            if (return_items.length > 0) {
                                show_delivery_note_selection_modal(frm, d, return_items, selectedType);
                            } else {
                                frappe.msgprint(__("No items selected for return."));
                            }
                        }
                    });
                    
                    // Store filters globally for this dialog instance
                    d.current_filters = {}; 

                    d.show();

                    // Attach event listeners after the dialog is shown and elements are in DOM
                    d.$wrapper.find('.item-filter').on('input', function() {
                        const fieldname = $(this).data('fieldname');
                        const value = $(this).val().toLowerCase();
                        d.current_filters[fieldname] = value; 
                        applyTableFilters(d);
                    });

                    d.$wrapper.css({
                        "position": "fixed",
                        "top": "0",
                        "left": "0",
                        "width": "100%",
                        "height": "100vh",
                        "z-index": "1060",
                        "background": "rgba(0, 0, 0, 0.8)",
                        "display": "flex",
                        "justify-content": "center",
                        "align-items": "center"
                    });
                    d.$body.css({
                        "height": "90%",
                        "max-height": "800px",
                        "display": "flex",
                        "flex-direction": "column",
                        "justify-content": "flex-start",
                        "align-items": "stretch",
                        "overflow-y": "auto",
                        "padding": "20px"
                    });
                    d.$wrapper.find(".modal-dialog").css({
                        "width": "80%",
                        "max-width": "1200px",
                        "margin": "0 auto"
                    });
                    d.$wrapper.find(".modal-content").css({
                        "width": "100%",
                        "height": "100%",
                        "overflow-y": "auto"
                    });
                    d.get_close_btn().hide();
                } else {
                    frappe.msgprint(__('No configuration found for Delivery Note type: {0}', [frm.doc.custom_delivery_note_type]));
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error fetching Delivery Note type details: {0}', [err.message]));
        }
    });
}

// Function to apply filters
function applyTableFilters(dialog_instance) {
    let filtered_items = dialog_instance.original_return_items || [];
    const filters = dialog_instance.current_filters || {};

    for (const fieldname in filters) {
        const filter_value = filters[fieldname];
        if (filter_value) {
            filtered_items = filtered_items.filter(item => 
                String(item[fieldname]).toLowerCase().includes(filter_value)
            );
        }
    }

    dialog_instance.set_value("return_items", filtered_items);
    if (dialog_instance.fields_dict.return_items) {
        dialog_instance.fields_dict.return_items.df.data = filtered_items;
        dialog_instance.fields_dict.return_items.refresh();
    }
}

// function show_return_delivery_note_modal(frm) {
//     frappe.call({
//         method: "autowings_app.api.get_enabled_delivery_note_types",
//         callback: function(r) {
//             if (r.message && r.message.length > 0) {
//                 const deliveryNoteTypes = r.message;
//                 const selectedLabel = frm.doc.custom_delivery_note_label || frm.doc.custom_delivery_note_type;
//                 const selectedType = deliveryNoteTypes.find(type => type.label === selectedLabel || type.name === frm.doc.custom_delivery_note_type);
//                 if (selectedType) {
//                     let d = new frappe.ui.Dialog({
//                         title: __("Return Delivery Note Details"),
//                         fields: [
//                             {
//                                 fieldtype: "Link",
//                                 fieldname: "job_card_id",
//                                 label: __("Job Card ID"),
//                                 options: "AW Job Card",
//                                 reqd: 1,
//                                 onchange: function() {
//                                     if (d.get_value("job_card_id")) {
//                                         frappe.call({
//                                             method: "frappe.client.get",
//                                             args: {
//                                                 doctype: "AW Job Card",
//                                                 name: d.get_value("job_card_id")
//                                             },
//                                             callback: function(r) {
//                                                 // if (r.message) {
//                                                 //     d.set_value("customer", r.message.customer);
//                                                 //     d.set_value("customer_name", r.message.customer_name);
//                                                 //     const items = r.message.items || [];
//                                                 //     const unique_items = [...new Set(items.map(item => item.item_code))].map(item_code => {
//                                                 //         const item = items.find(i => i.item_code === item_code);
//                                                 //         return {
//                                                 //             item_code: item_code,
//                                                 //             item_name: item.item_name,
//                                                 //             delivery_note_id: item.delivery_note_id || "",
//                                                 //             return_qty: 0
//                                                 //         };
//                                                 //     });
//                                                 //     d.set_value("return_items", unique_items);
//                                                 //     if (d.fields_dict.return_items) {
//                                                 //         d.fields_dict.return_items.df.data = unique_items;
//                                                 //         d.fields_dict.return_items.refresh();
//                                                 //     }
//                                                 // }
//                                                 // not need unique items, all item print in table
//                                                 if (r.message) {
//                                                     d.set_value("customer", r.message.customer);
//                                                     d.set_value("customer_name", r.message.customer_name);
//                                                     const items = r.message.items || [];
//                                                     const return_items = items.map(item => ({
//                                                         item_code: item.item_code,
//                                                         item_name: item.item_name,
//                                                         delivery_note_id: item.delivery_note_id || "",
//                                                         required_qty: item.required_qty || 0,
//                                                         return_qty: 0
//                                                     }));
//                                                     d.set_value("return_items", return_items);
//                                                     if (d.fields_dict.return_items) {
//                                                         d.fields_dict.return_items.df.data = return_items;
//                                                         d.fields_dict.return_items.refresh();
//                                                     }
//                                                 } else {
//                                                     d.set_value("customer", "");
//                                                     d.set_value("customer_name", "");
//                                                     d.set_value("return_items", []);
//                                                     if (d.fields_dict.return_items) {
//                                                         d.fields_dict.return_items.df.data = [];
//                                                         d.fields_dict.return_items.refresh();
//                                                     }     
//                                         }
//                                             },
//                                             error: function(err) {
//                                                 frappe.msgprint(__('Error fetching AW Job Card details: {0}', [err.message]));
//                                                 d.set_value("customer", "");
//                                                 d.set_value("customer_name", "");
//                                                 d.set_value("return_items", []);
//                                                 if (d.fields_dict.return_items) {
//                                                     d.fields_dict.return_items.df.data = [];
//                                                     d.fields_dict.return_items.refresh();
//                                                 }
//                                             }
//                                         });
//                                     } else {
//                                         d.set_value("customer", "");
//                                         d.set_value("customer_name", "");
//                                         d.set_value("return_items", []);
//                                         if (d.fields_dict.return_items) {
//                                             d.fields_dict.return_items.df.data = [];
//                                             d.fields_dict.return_items.refresh();
//                                         }
//                                     }
//                                 }
//                             },
//                             {
//                                 fieldtype: "Data",
//                                 fieldname: "customer",
//                                 label: __("Customer"),
//                                 read_only: 1
//                             },
//                             {
//                                 fieldtype: "Data",
//                                 fieldname: "customer_name",
//                                 label: __("Customer Name"),
//                                 read_only: 1
//                             },
//                             {
//                                 fieldtype: "Data",
//                                 fieldname: "naming_series",
//                                 label: __("Naming Series"),
//                                 default: selectedType.naming_series,
//                                 read_only: 1
//                             },
//                             {
//                                 fieldtype: "Data",
//                                 fieldname: "warehouse",
//                                 label: __("Warehouse"),
//                                 default: selectedType.warehouse || "",
//                                 read_only: 1
                        
//                             },
//                             {
//                                 fieldtype: "Table",
//                                 fieldname: "return_items",
//                                 label: __("Return Items"),
//                                 cannot_add_rows: true,
//                                 cannot_delete_rows: true,
//                                 fields: [
//                                     {
//                                         fieldtype: "Data",
//                                         fieldname: "item_code",
//                                         label: __("Item Code"),
//                                         read_only: 1,
//                                         in_list_view: 1
//                                     },
//                                     {
//                                         fieldtype: "Data",
//                                         fieldname: "item_name",
//                                         label: __("Item Name"),
//                                         read_only: 1,
//                                         in_list_view: 1
//                                     },
//                                     // add delivery note ID field
//                                     {
//                                         fieldtype: "Data",
//                                         fieldname: "delivery_note_id",
//                                         label: __("Delivery Note ID"),
//                                         read_only: 1,
//                                         in_list_view: 1
//                                     },

//                                     {
//                                         fieldtype: "Float",
//                                         fieldname: "required_qty",
//                                         label: __("Available Qty"),
//                                         read_only: 1,
//                                         in_list_view: 1
//                                     },

//                                     {
//                                         fieldtype: "Float",
//                                         fieldname: "return_qty",
//                                         label: __("Return Qty"),
//                                         reqd: 1,
//                                         in_list_view: 1,
//                                         onchange: function() {
//                                             const items = d.get_value("return_items") || [];
//                                             items.forEach(item => {
//                                                 if (item.return_qty < 0) {
//                                                     frappe.msgprint(__("Return quantity cannot be negative for item {0}", [item.item_code]));
//                                                     item.return_qty = 0;
//                                                     d.fields_dict.return_items.refresh();
//                                                 }
//                                             });
//                                         }
//                                     }
//                                 ],
//                                 in_place_edit: true,
//                                 data: [],
//                                 get_data: function() {
//                                     return d.get_value("return_items") || [];
//                                 }
//                             }
//                         ],
//                         primary_action_label: __("Next"),
//                         primary_action: function() {
//                             const return_items = (d.get_value("return_items") || [])
//                                 .filter(item => item.return_qty > 0);
//                             if (return_items.length > 0) {
//                                 show_delivery_note_selection_modal(frm, d, return_items, selectedType);
//                             } else {
//                                 frappe.msgprint(__("No items selected for return."));
//                             }
//                         }
//                     });
//                     d.show();
//                     d.$wrapper.css({
//                         "position": "fixed",
//                         "top": "0",
//                         "left": "0",
//                         "width": "100%",
//                         "height": "100vh",
//                         "z-index": "1060",
//                         "background": "rgba(0, 0, 0, 0.8)",
//                         "display": "flex",
//                         "justify-content": "center",
//                         "align-items": "center"
//                     });
//                     d.$body.css({
//                         "height": "90%",
//                         "max-height": "800px",
//                         "display": "flex",
//                         "flex-direction": "column",
//                         "justify-content": "flex-start",
//                         "align-items": "stretch",
//                         "overflow-y": "auto",
//                         "padding": "20px"
//                     });
//                     d.$wrapper.find(".modal-dialog").css({
//                         "width": "80%",
//                         "max-width": "1200px",
//                         "margin": "0 auto"
//                     });
//                     d.$wrapper.find(".modal-content").css({
//                         "width": "100%",
//                         "height": "100%",
//                         "overflow-y": "auto"
//                     });
//                     d.get_close_btn().hide();
//                 } else {
//                     frappe.msgprint(__('No configuration found for Delivery Note type: {0}', [frm.doc.custom_delivery_note_type]));
//                 }
//             }
//         },
//         error: function(err) {
//             frappe.msgprint(__('Error fetching Delivery Note type details: {0}', [err.message]));
//         }
//     });
// }

function show_delivery_note_selection_modal(frm, first_dialog, return_items, selectedType) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "AW Job Card",
            name: first_dialog.get_value("job_card_id")
        },
        callback: function(r) {
            if (r.message) {
                const job_card_items = r.message.items || [];
                const delivery_notes = {};

                // Group items by item_code and delivery_note_id
                job_card_items.forEach(item => {
                    if (item.delivery_note_id && item.delivered_qty > 0 && !item.return_delivery_note_id) {
                        if (!delivery_notes[item.item_code]) {
                            delivery_notes[item.item_code] = {};
                        }
                        if (!delivery_notes[item.item_code][item.delivery_note_id]) {
                            delivery_notes[item.item_code][item.delivery_note_id] = {
                                item_name: item.item_name,
                                available_qty: 0
                            };
                        }
                        delivery_notes[item.item_code][item.delivery_note_id].available_qty += item.delivered_qty - (item.return_qty || 0);
                    }
                });

                let d = new frappe.ui.Dialog({
                    title: __("Select Delivery Notes for Return"),
                    fields: [
                        {
                            fieldtype: "Table",
                            fieldname: "delivery_note_items",
                            label: __("Delivery Note Items"),
                            cannot_add_rows: true,
                            cannot_delete_rows: true,
                            fields: [
                                {
                                    fieldtype: "Check",
                                    fieldname: "selected",
                                    label: __("Select"),
                                    in_list_view: 1
                                },
                                {
                                    fieldtype: "Data",
                                    fieldname: "delivery_note_id",
                                    label: __("Delivery Note"),
                                    read_only: 1,
                                    in_list_view: 1
                                },
                                {
                                    fieldtype: "Data",
                                    fieldname: "item_code",
                                    label: __("Item Code"),
                                    read_only: 1,
                                    in_list_view: 1
                                },
                                {
                                    fieldtype: "Data",
                                    fieldname: "item_name",
                                    label: __("Item Name"),
                                    read_only: 1,
                                    in_list_view: 1
                                },
                                {
                                    fieldtype: "Float",
                                    fieldname: "return_qty",
                                    label: __("Return Qty"),
                                    // read_only: 1,
                                    in_list_view: 1
                                },
                                {
                                    fieldtype: "Float",
                                    fieldname: "available_qty",
                                    label: __("Available Qty"),
                                    read_only: 1,
                                    in_list_view: 1
                                }
                            ],
                            data: return_items.flatMap(return_item => {
                                const dn_entries = delivery_notes[return_item.item_code] || {};
                                return Object.entries(dn_entries).map(([dn_id, details]) => ({
                                    delivery_note_id: dn_id,
                                    item_code: return_item.item_code,
                                    item_name: details.item_name,
                                    return_qty: Math.min(return_item.return_qty, details.available_qty),
                                    available_qty: details.available_qty
                                }));
                            }).filter(item => item.return_qty > 0),
                            get_data: function() {
                                return d.get_value("delivery_note_items") || [];
                            }
                        }
                    ],
                    primary_action_label: __("Create Return Delivery Notes"),
                    primary_action: function() {
                        const selected_items = d.get_value("delivery_note_items").filter(item => item.selected);
                        if (selected_items.length > 0) {
                            const return_by_dn = {};
                            selected_items.forEach(item => {
                                if (!return_by_dn[item.delivery_note_id]) {
                                    return_by_dn[item.delivery_note_id] = [];
                                }
                                return_by_dn[item.delivery_note_id].push({
                                    item_code: item.item_code,
                                    item_name: item.item_name,
                                    qty: -item.return_qty,
                                    warehouse: selectedType.warehouse
                                });
                            });

                            Object.entries(return_by_dn).forEach(([dn_id, items]) => {
                                const new_dn = {
                                    doctype: "Delivery Note",
                                    is_return: 1,
                                    return_against: dn_id,
                                    custom_delivery_note_type: "Job Card Return",
                                    custom_job_card_id: first_dialog.get_value("job_card_id"),
                                    customer: first_dialog.get_value("customer"),
                                    naming_series: selectedType.naming_series,
                                    set_warehouse: selectedType.warehouse,
                                    docstatus: 0, // Draft mode
                                    items: items
                                };
                                frappe.call({
                                    method: "frappe.client.insert",
                                    args: { doc: new_dn },
                                    callback: function(r) {
                                        if (r.message) {
                                            frappe.msgprint(__("Created draft return Delivery Note {0}", [r.message.name]));
                                        }
                                    }
                                });
                            });
                            // Redirect to draft delivery notes
                            window.location.href = "/app/delivery-note?status=Draft";
                        } else {
                            frappe.msgprint(__("No delivery notes selected for return."));
                        }
                        d.hide();
                        first_dialog.hide();
                        let formWrapper = frm.get_field("custom_job_card_id").$wrapper.closest(".form-layout");
                        formWrapper.css({
                            "filter": "none",
                            "pointer-events": "auto",
                            "opacity": "1"
                        });
                    }
                });
                d.show();
                d.$wrapper.css({
                    "position": "fixed",
                    "top": "0",
                    "left": "0",
                    "width": "100%",
                    "height": "100vh",
                    "z-index": "1060",
                    "background": "rgba(0, 0, 0, 0.8)",
                    "display": "flex",
                    "justify-content": "center",
                    "align-items": "center"
                });
                d.$body.css({
                    "height": "90%",
                    "max-height": "800px",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "flex-start",
                    "align-items": "stretch",
                    "overflow-y": "auto",
                    "padding": "20px"
                });
                d.$wrapper.find(".modal-dialog").css({
                    "width": "80%",
                    "max-width": "1200px",
                    "margin": "0 auto"
                });
                d.$wrapper.find(".modal-content").css({
                    "width": "100%",
                    "height": "100%",
                    "overflow-y": "auto"
                });
                d.get_close_btn().hide();
            }
        }
    });
}

function fadeOutAndCloseDeliveryNoteModal() {
    let wrapper = document.getElementById("delivery-note-type-overlay");
    if (wrapper) {
        wrapper.style.opacity = "0";
        setTimeout(() => {
            wrapper.remove();
            window.deliveryNoteTypeDialogActive = false;
        }, 300);
    } else {
        window.deliveryNoteTypeDialogActive = false;
    }
}

function show_item_selection_modal(frm) {
    if (frm.doc.custom_delivery_note_type !== "Job Card Return" && frm.doc.custom_job_card_id && frm.doc.return_against) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "AW Job Card",
                name: frm.doc.custom_job_card_id
            },
            callback: function(r) {
                if (r.message) {
                    let job_card_items = r.message.items
                        .filter(item => item.delivery_note_id && item.required_qty > 0)
                        .map(item => ({
                            item_code: item.item_code,
                            item_name: item.item_name,
                            required_qty: item.required_qty
                        }));
                    if (!job_card_items.length) {
                        frappe.msgprint(__("No items with required quantity > 0 found for Delivery Note {0} in Job Card {1}", [frm.doc.return_against, frm.doc.custom_job_card_id]));
                        return;
                    }
                    frappe.msgprint(__("Items are available for return from Delivery Note {0}, but no further action is configured.", [frm.doc.return_against]));
                }
            }
        });
    }
}

function get_selected_items(items) {
    let selected_items = [];
    return selected_items;
}