

// frappe.ui.form.on("Sales Invoice", {
//     custom_insurance_provider: function(frm) {
//         if (frm.doc.custom_insurance_provider) {
//             frappe.call({
//                 method: "autowings_app.custom_scripts.sales_invoice.get_insurance_policies",
//                 args: { provider: frm.doc.custom_insurance_provider },
//                 callback: function(response) {
//                     let policies = response.message || [];
//                     let options = policies.map(policy => ({
//                         label: policy.policy_name,
//                         value: policy.policy_name // Use policy_name as the value
//                     }));

//                     frm.set_df_property("custom_insurance_policy", "options", options);
//                     frm.refresh_field("custom_insurance_policy");
//                     if (options.length === 0) {
//                         frm.set_value("custom_insurance_policy", "");
//                     }
//                 }
//             });
//         } else {
//             frm.set_df_property("custom_insurance_policy", "options", []);
//             frm.set_value("custom_insurance_policy", "");
//         }
//     }
// });



// frappe.ui.form.on("Sales Invoice", {
//     onload: function(frm) {
//         // Handle modal logic on form load
//         handle_modal_logic(frm);
//     },

//     refresh: function(frm) {
//         // Handle modal logic on refresh
//         handle_modal_logic(frm);
//         // Hide vehicle-related fields for Spare, Other, or Service sales
//         toggle_vehicle_fields(frm);
//         // Show custom_sub_sales_type field only if custom_sale_type is set
//         frm.toggle_display("custom_sub_sales_type", !!frm.doc.custom_sale_type);
//     },

//     custom_sale_type: function(frm) {
//         // Make the custom_sale_type field read-only after selection
//         frm.set_df_property("custom_sale_type", "read_only", 1);

//         // Clear custom_sub_sales_type and naming_series when sale type changes
//         frm.set_value("custom_sub_sales_type", "");
//         frm.set_value("naming_series", "");

//         // Toggle vehicle-related sections visibility and set update_stock
//         toggle_vehicle_fields(frm);

//         // Show Sub Sales Type modal since custom_sale_type is now set
//         if (frm.doc.custom_sale_type) {
//             show_sub_sales_type_modal(frm);
//         }

//         // Show custom_sub_sales_type field now that custom_sale_type is set
//         frm.toggle_display("custom_sub_sales_type", true);

//         // Validate item constraints for Vehicle sales
//         if (frm.doc.custom_sale_type === "Vehicle") {
//             if (frm.doc.items.length > 1) {
//                 frappe.throw(__("Only one item is allowed in the Items table for Vehicle sales."));
//             }
//             if (frm.doc.items.length === 1 && frm.doc.items[0].qty > 1) {
//                 frappe.throw(__("Quantity must be 1 for a Vehicle sale."));
//             }
//             // Autofill custom_vin table with item details
//             populate_vin_table(frm);
//         }
//     },

//     validate: function(frm) {
//         // Prevent submission if `custom_sale_type` is not set
//         if (!frm.doc.custom_sale_type) {
//             enforce_sale_type_selection(frm);
//             frappe.throw(__("Please select a Sale Type (Spare, Other, Vehicle, or Service) before saving."));
//         }

//         // Prevent submission if `custom_sub_sales_type` is not set
//         if (!frm.doc.custom_sub_sales_type) {
//             frappe.throw(__("Please select a Sub Sales Type."));
//         }

//         // Additional validation for Vehicle sales
//         if (frm.doc.custom_sale_type === "Vehicle" && frm.doc.update_stock) {
//             if (!frm.doc.custom_vin || !frm.doc.custom_vin.length) {
//                 frappe.throw(__("Chassis Number details are required in VIN table for Vehicle sales with update_stock enabled."));
//             }
//         }
//     }
// });

// // **Handle Modal Logic for Sale Type and Sub Sales Type**
// function handle_modal_logic(frm) {
//     if (!frm.is_new()) return; // Only handle modals for new documents

//     // If custom_sale_type is not set, show the Sale Type modal
//     if (!frm.doc.custom_sale_type) {
//         enforce_sale_type_selection(frm);
//     }
//     // If custom_sale_type is set but custom_sub_sales_type is not, show the Sub Sales Type modal
//     else if (frm.doc.custom_sale_type && !frm.doc.custom_sub_sales_type) {
//         // Ensure custom_sale_type is read-only since it's already set (e.g., via URL)
//         frm.set_df_property("custom_sale_type", "read_only", 1);
//         // Toggle vehicle-related sections visibility and set update_stock
//         toggle_vehicle_fields(frm);
//         // Show custom_sub_sales_type field
//         frm.toggle_display("custom_sub_sales_type", true);
//         // Show the Sub Sales Type modal
//         show_sub_sales_type_modal(frm);
//     }
// }
// // **Enforce Sale Type Selection Modal**
// function enforce_sale_type_selection(frm) {
//     if (window.saleTypeDialogActive) return; // Prevent multiple popups
//     window.saleTypeDialogActive = true;

//     // Fetch enabled sales types
//     frappe.call({
//         method: "autowings_app.api.get_enabled_sales_types",
//         callback: function(response) {
//             let sales_types = response.message || [];

//             // If no sales types, show error and return
//             if (sales_types.length === 0) {
//                 frappe.msgprint({
//                     title: __("Configuration Error"),
//                     message: __("No enabled Sales Types found. Please configure in Autowings Naming Series."),
//                     indicator: "red"
//                 });
//                 window.saleTypeDialogActive = false;
//                 return;
//             }

//             // Create modal with dynamic buttons
//             let wrapper = document.createElement("div");
//             wrapper.id = "sale-type-overlay";

//             // Generate buttons HTML for each sales type
//             let buttons_html = sales_types.map((sales_type, index) => `
//                 <button id="sell_${index}" class="custom-button"
//                     style="background: ${index % 2 === 0 ? '#000' : '#6c757d'}; color: white; padding: 8px 20px; font-size: 18px; 
//                     border: none; border-radius: 10px; cursor: pointer;">
//                     ${sales_type}
//                 </button>
//             `).join('');

//             wrapper.innerHTML = `
//                 <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//                     position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                    
//                     <div id="sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                         text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                        
//                         <h4 style="margin-bottom: 20px;">What do you want to sell?</h4>
//                         <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap;">
//                             ${buttons_html}
//                         </div>
//                     </div>
//                 </div>
//             `;

//             document.body.appendChild(wrapper);

//             // Add event listeners for each button
//             sales_types.forEach((sales_type, index) => {
//                 document.getElementById(`sell_${index}`).addEventListener("click", function() {
//                     frm.set_value("custom_sale_type", sales_type);
//                     toggle_vehicle_fields(frm);
//                     fadeOutAndCloseSaleModal();
//                 });
//             });
//         }
//     });
// }


// // **Smooth Fade-out Effect Before Closing Sale Modal**
// function fadeOutAndCloseSaleModal() {
//     let overlay = document.getElementById("sale-type-overlay");
//     if (overlay) overlay.remove();
//     window.saleTypeDialogActive = false; // Reset flag after selection
// }

// // **Show Sub Sales Type Modal for Any Sales Type**
// function show_sub_sales_type_modal(frm) {
//     if (window.subSaleTypeDialogActive) return; // Prevent multiple popups
//     window.subSaleTypeDialogActive = true;

//     // Fetch Sub Sales Types for the current custom_sale_type
//     frappe.call({
//         method: "autowings_app.api.get_sub_sales_types",
//         args: { sales_type: frm.doc.custom_sale_type },
//         callback: function(response) {
//             let sub_sales_types = response.message || [];

//             // If no sub sales types, prevent proceeding and reset
//             if (sub_sales_types.length === 0) {
//                 frappe.msgprint({
//                     title: __("Configuration Error"),
//                     message: __("No Sub Sales Types found for Sale Type: " + frm.doc.custom_sale_type + ". Please configure in Autowings Naming Series."),
//                     indicator: "red"
//                 });
//                 frm.set_value("custom_sub_sales_type", "");
//                 frm.set_value("naming_series", "");
//                 frm.set_value("custom_sale_type", ""); // Reset custom_sale_type to force re-selection
//                 window.subSaleTypeDialogActive = false;
//                 handle_modal_logic(frm); // Re-run modal logic to show Sale Type modal
//                 return;
//             }

//             // If only one sub sales type, auto-select it
//             if (sub_sales_types.length === 1) {
//                 frm.set_value("custom_sub_sales_type", sub_sales_types[0].sub_sales_type);
//                 frm.set_value("naming_series", sub_sales_types[0].sales_naming_series);
//                 window.subSaleTypeDialogActive = false;
//                 return;
//             }

//             // Create modal for multiple sub sales types
//             let wrapper = document.createElement("div");
//             wrapper.id = "sub-sale-type-overlay";
//             let buttons_html = sub_sales_types.map((entry, index) => `
//                 <button id="sub_sale_type_${index}" class="custom-button"
//                     style="background: ${index % 2 === 0 ? '#000' : '#6c757d'}; color: white; padding: 8px 20px; font-size: 18px; 
//                     border: none; border-radius: 10px; cursor: pointer;">
//                     ${entry.sub_sales_type}
//                 </button>
//             `).join('');

//             wrapper.innerHTML = `
//                 <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//                     position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                    
//                     <div id="sub-sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                         text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                        
//                         <h4 style="margin-bottom: 20px;">Select Sub Sales Type</h4>
//                         <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap;">
//                             ${buttons_html}
//                         </div>
//                     </div>
//                 </div>
//             `;

//             document.body.appendChild(wrapper);

//             // Add event listeners for each button
//             sub_sales_types.forEach((entry, index) => {
//                 document.getElementById(`sub_sale_type_${index}`).addEventListener("click", function() {
//                     frm.set_value("custom_sub_sales_type", entry.sub_sales_type);
//                     frm.set_value("naming_series", entry.sales_naming_series);
//                     fadeOutAndCloseSubSaleModal();
//                 });
//             });
//         }
//     });
// }

// // **Smooth Fade-out Effect Before Closing Sub Sale Modal**
// function fadeOutAndCloseSubSaleModal() {
//     let overlay = document.getElementById("sub-sale-type-overlay");
//     if (overlay) overlay.remove();
//     window.subSaleTypeDialogActive = false; // Reset flag after selection
// }

// // **Hide Vehicle-Specific Fields When "Spare", "Other", or "Service" is Selected**
// // function toggle_vehicle_fields(frm) {
// //     let is_vehicle = frm.doc.custom_sale_type === "Vehicle";
// //     let vehicle_fields = [
// //         "custom_vin",
// //         "custom_rto_office",
// //         "custom_registration_charge",
// //         "custom_insurance_provider",
// //         "custom_insurance_policy",
// //         "custom_insurance_amount",
// //         "custom_finance_provider",
// //         "custom_finance_amount",
// //         "custom_chassis_engine_details",
// //         "custom_rto_details",
// //         "custom_insurance_details",
// //         "custom_financer_details",
// //         "custom_misc_details",
// //         "custom_miscellaneous"
// //     ];

// //     vehicle_fields.forEach(field => {
// //         frm.toggle_display(field, is_vehicle);
// //         if (!is_vehicle) {
// //             frm.set_value(field, ""); // Clear fields when not Vehicle
// //         }
// //     });

// //     frm.set_value("update_stock", is_vehicle ? 1 : 0); // Set update_stock based on sale type
// // }

// // Detect when an item is added to the items table and populate VIN table
// frappe.ui.form.on("Sales Invoice Item", {
//     item_code: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         // Ensure VIN table is updated only for Vehicle sales
//         if (frm.doc.custom_sale_type === "Vehicle") {
//             // Check if the item already exists in VIN table to prevent duplicates
//             let exists = frm.doc.custom_vin && frm.doc.custom_vin.some(vin => vin.item === row.item_code);
//             if (!exists) {
//                 let vin_row = frm.add_child("custom_vin");
//                 vin_row.item = row.item_code; // Set item in VIN table
//                 frm.refresh_field("custom_vin");
//             }
//         }
//     }
// });

// // Function to autofill custom_vin table based on item selection
// function populate_vin_table(frm) {
//     frm.clear_table("custom_vin");
//     frm.doc.items.forEach(item => {
//         let exists = frm.doc.custom_vin && frm.doc.custom_vin.some(vin => vin.item === item.item_code);
//         if (!exists) {
//             let row = frm.add_child("custom_vin");
//             row.item = item.item_code;  // Set item field in VIN table
//         }
//     });
//     frm.refresh_field("custom_vin");
// }

frappe.ui.form.on("Sales Invoice", {
    custom_insurance_provider: function(frm) {
        if (frm.doc.custom_insurance_provider) {
            frappe.call({
                method: "autowings_app.custom_scripts.sales_invoice.get_insurance_policies",
                args: { provider: frm.doc.custom_insurance_provider },
                callback: function(response) {
                    let policies = response.message || [];
                    let options = policies.map(policy => ({
                        label: policy.policy_name,
                        value: policy.policy_name
                    }));

                    // Set options for the policy field
                    frm.set_df_property("custom_insurance_policy", "options", options);
                    // Make the policy field mandatory
                    frm.set_df_property("custom_insurance_policy", "reqd", true);
                    frm.refresh_field("custom_insurance_policy");

                    if (options.length === 0) {
                        frm.set_value("custom_insurance_policy", "");
                    }
                }
            });
        } else {
            // Clear options and make the field non-mandatory when no provider is selected
            frm.set_df_property("custom_insurance_policy", "options", []);
            frm.set_df_property("custom_insurance_policy", "reqd", false);
            frm.set_value("custom_insurance_policy", "");
            frm.refresh_field("custom_insurance_policy");
        }
    }
});

frappe.ui.form.on("Sales Invoice", {
    onload: function(frm) {
        // Handle modal logic on form load
        handle_modal_logic(frm);
    },

    refresh: function(frm) {
        // Handle modal logic on refresh
        handle_modal_logic(frm);
        // Show custom_sub_sales_type field only if custom_sale_type is set
        frm.toggle_display("custom_sub_sales_type", !!frm.doc.custom_sale_type);
    },

    custom_sale_type: function(frm) {
        // Make the custom_sale_type field read-only after selection
        frm.set_df_property("custom_sale_type", "read_only", 1);

        // Clear custom_sub_sales_type and naming_series when sale type changes
        frm.set_value("custom_sub_sales_type", "");
        frm.set_value("naming_series", "");

        // Show Sub Sales Type modal since custom_sale_type is now set
        if (frm.doc.custom_sale_type) {
            show_sub_sales_type_modal(frm);
        }

        // Show custom_sub_sales_type field now that custom_sale_type is set
        frm.toggle_display("custom_sub_sales_type", true);

        // Validate item constraints for Vehicle sales
        if (frm.doc.custom_sale_type === "Vehicle") {
            if (frm.doc.items.length > 1) {
                frappe.throw(__("Only one item is allowed in the Items table for Vehicle sales."));
            }
            if (frm.doc.items.length === 1 && frm.doc.items[0].qty > 1) {
                frappe.throw(__("Quantity must be 1 for a Vehicle sale."));
            }
            // Autofill custom_vin table with item details
            populate_vin_table(frm);
        }
    },

    validate: function(frm) {
        // Prevent submission if `custom_sale_type` is not set
        if (!frm.doc.custom_sale_type) {
            enforce_sale_type_selection(frm);
            frappe.throw(__("Please select a Sale Type (Spare, Other, Vehicle, or Service) before saving."));
        }

        // Prevent submission if `custom_sub_sales_type` is not set
        if (!frm.doc.custom_sub_sales_type) {
            frappe.throw(__("Please select a Sub Sales Type."));
        }

        // Additional validation for Vehicle sales
        if (frm.doc.custom_sale_type === "Vehicle" && frm.doc.update_stock) {
            if (!frm.doc.custom_vin || !frm.doc.custom_vin.length) {
                frappe.throw(__("Chassis Number details are required in VIN table for Vehicle sales with update_stock enabled."));
            }
        }
    }
});

// **Handle Modal Logic for Sale Type and Sub Sales Type**
function handle_modal_logic(frm) {
    if (!frm.is_new()) return; // Only handle modals for new documents

    // If custom_sale_type is not set, show the Sale Type modal
    if (!frm.doc.custom_sale_type) {
        enforce_sale_type_selection(frm);
    }
    // If custom_sale_type is set but custom_sub_sales_type is not, show the Sub Sales Type modal
    else if (frm.doc.custom_sale_type && !frm.doc.custom_sub_sales_type) {
        // Ensure custom_sale_type is read-only since it's already set (e.g., via URL)
        frm.set_df_property("custom_sale_type", "read_only", 1);
        // Show custom_sub_sales_type field
        frm.toggle_display("custom_sub_sales_type", true);
        // Show the Sub Sales Type modal
        show_sub_sales_type_modal(frm);
    }
}

// **Enforce Sale Type Selection Modal**
function enforce_sale_type_selection(frm) {
    if (window.saleTypeDialogActive) return; // Prevent multiple popups
    window.saleTypeDialogActive = true;

    // Fetch enabled sales types
    frappe.call({
        method: "autowings_app.api.get_enabled_sales_types",
        callback: function(response) {
            let sales_types = response.message || [];

            // If no sales types, show error and return
            if (sales_types.length === 0) {
                frappe.msgprint({
                    title: __("Configuration Error"),
                    message: __("No enabled Sales Types found. Please configure in Autowings Naming Series."),
                    indicator: "red"
                });
                window.saleTypeDialogActive = false;
                return;
            }

            // Create modal with dynamic buttons
            let wrapper = document.createElement("div");
            wrapper.id = "sale-type-overlay";

            // Generate buttons HTML for each sales type
            let buttons_html = sales_types.map((sales_type, index) => `
                <button id="sell_${index}" class="custom-button"
                    style="background: ${index % 2 === 0 ? '#000' : '#6c757d'}; color: white; padding: 8px 20px; font-size: 18px; 
                    border: none; border-radius: 10px; cursor: pointer;">
                    ${sales_type}
                </button>
            `).join('');

            wrapper.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
                    position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                    
                    <div id="sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                        text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                        
                        <h4 style="margin-bottom: 20px;">What do you want to sell?</h4>
                        <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap;">
                            ${buttons_html}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(wrapper);

            // Add event listeners for each button
            sales_types.forEach((sales_type, index) => {
                document.getElementById(`sell_${index}`).addEventListener("click", function() {
                    frm.set_value("custom_sale_type", sales_type);
                    fadeOutAndCloseSaleModal();
                });
            });
        }
    });
}

// **Smooth Fade-out Effect Before Closing Sale Modal**
function fadeOutAndCloseSaleModal() {
    let overlay = document.getElementById("sale-type-overlay");
    if (overlay) overlay.remove();
    window.saleTypeDialogActive = false; // Reset flag after selection
}

// **Show Sub Sales Type Modal for Any Sales Type**
function show_sub_sales_type_modal(frm) {
    if (window.subSaleTypeDialogActive) return; // Prevent multiple popups
    window.subSaleTypeDialogActive = true;

    // Fetch Sub Sales Types for the current custom_sale_type
    frappe.call({
        method: "autowings_app.api.get_sub_sales_types",
        args: { sales_type: frm.doc.custom_sale_type },
        callback: function(response) {
            let sub_sales_types = response.message || [];

            // If no sub sales types, prevent proceeding and reset
            if (sub_sales_types.length === 0) {
                frappe.msgprint({
                    title: __("Configuration Error"),
                    message: __("No Sub Sales Types found for Sale Type: " + frm.doc.custom_sale_type + ". Please configure in Autowings Naming Series."),
                    indicator: "red"
                });
                frm.set_value("custom_sub_sales_type", "");
                frm.set_value("naming_series", "");
                frm.set_value("custom_sale_type", ""); // Reset custom_sale_type to force re-selection
                window.subSaleTypeDialogActive = false;
                handle_modal_logic(frm); // Re-run modal logic to show Sale Type modal
                return;
            }

            // If only one sub sales type, auto-select it
            if (sub_sales_types.length === 1) {
                frm.set_value("custom_sub_sales_type", sub_sales_types[0].sub_sales_type);
                frm.set_value("naming_series", sub_sales_types[0].sales_naming_series);
                window.subSaleTypeDialogActive = false;
                return;
            }

            // Create modal for multiple sub sales types
            let wrapper = document.createElement("div");
            wrapper.id = "sub-sale-type-overlay";
            let buttons_html = sub_sales_types.map((entry, index) => `
                <button id="sub_sale_type_${index}" class="custom-button"
                    style="background: ${index % 2 === 0 ? '#000' : '#6c757d'}; color: white; padding: 8px 20px; font-size: 18px; 
                    border: none; border-radius: 10px; cursor: pointer;">
                    ${entry.sub_sales_type}
                </button>
            `).join('');

            wrapper.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
                    position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                    
                    <div id="sub-sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                        text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                        
                        <h4 style="margin-bottom: 20px;">Select Sub Sales Type</h4>
                        <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap;">
                            ${buttons_html}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(wrapper);

            // Add event listeners for each button
            sub_sales_types.forEach((entry, index) => {
                document.getElementById(`sub_sale_type_${index}`).addEventListener("click", function() {
                    frm.set_value("custom_sub_sales_type", entry.sub_sales_type);
                    frm.set_value("naming_series", entry.sales_naming_series);
                    fadeOutAndCloseSubSaleModal();
                });
            });
        }
    });
}

// **Smooth Fade-out Effect Before Closing Sub Sale Modal**
function fadeOutAndCloseSubSaleModal() {
    let overlay = document.getElementById("sub-sale-type-overlay");
    if (overlay) overlay.remove();
    window.subSaleTypeDialogActive = false; // Reset flag after selection
}

// Detect when an item is added to the items table and populate VIN table
frappe.ui.form.on("Sales Invoice Item", {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Ensure VIN table is updated only for Vehicle sales
        if (frm.doc.custom_sale_type === "Vehicle") {
            // Check if the item already exists in VIN table to prevent duplicates
            let exists = frm.doc.custom_vin && frm.doc.custom_vin.some(vin => vin.item === row.item_code);
            if (!exists) {
                let vin_row = frm.add_child("custom_vin");
                vin_row.item = row.item_code; // Set item in VIN table
                frm.refresh_field("custom_vin");
            }
        }
    }
});

// Function to autofill custom_vin table based on item selection
function populate_vin_table(frm) {
    frm.clear_table("custom_vin");
    frm.doc.items.forEach(item => {
        let exists = frm.doc.custom_vin && frm.doc.custom_vin.some(vin => vin.item === item.item_code);
        if (!exists) {
            let row = frm.add_child("custom_vin");
            row.item = item.item_code;  // Set item field in VIN table
        }
    });
    frm.refresh_field("custom_vin");
}


// custom btn for sales invoice items update multiple

frappe.ui.form.on('Sales Invoice', {
    onload: function(frm) {
        // Function to toggle the custom button visibility
        function toggleUpdateItemsButton() {
            // Remove existing button if present
            frm.remove_custom_button(__('Update Items'));

            // Show button only if custom_sale_type is not "Vehicle" and docstatus is 0
            if (frm.doc.custom_sale_type !== 'Vehicle' && frm.doc.docstatus === 0) {
                frm.add_custom_button(__('Update Items'), function() {
                    // Check if document is not submitted (docstatus === 0)
                    if (frm.doc.docstatus !== 0) {
                        frappe.msgprint(__('This action is only available for unsubmitted documents.'));
                        return;
                    }

                    // Check if items exist
                    if (!frm.doc.items || frm.doc.items.length === 0) {
                        frappe.msgprint(__('No items found to update.'));
                        return;
                    }

                    // Iterate through items
                    frm.doc.items.forEach(function(item, index) {
                        if (item.item_code) {
                            frappe.call({
                                method: 'frappe.client.get',
                                args: {
                                    doctype: 'Item',
                                    name: item.item_code
                                },
                                callback: function(response) {
                                    if (response.message) {
                                        let item_doc = response.message;
                                        let row = frm.doc.items[index];
                                        
                                        // Update item details
                                        row.item_name = item_doc.item_name || row.item_code;
                                        row.uom = item_doc.stock_uom || 'Nos';
                                        row.stock_uom = item_doc.stock_uom || 'Nos';
                                        row.conversion_factor = 1;
                                        
                                        // Refresh the items table
                                        frm.refresh_field('items');
                                    } else {
                                        frappe.msgprint(__('Item {0} not found.', [item.item_code]));
                                    }
                                },
                                error: function(err) {
                                    frappe.msgprint(__('Error fetching details for item {0}.', [item.item_code]));
                                }
                            });
                        }
                    });
                    
                    frappe.msgprint(__('Item details updated successfully.'));
                }).addClass("btn btn-secondary").css({
                    "background-color": "#6c757d",
                    "color": "white",
                    "font-weight": "bold"
                });
            }
        }

        // Call toggle function on load
        toggleUpdateItemsButton();

        // Watch for changes in custom_sale_type field
        frm.fields_dict['custom_sale_type'].$input.on('change', function() {
            toggleUpdateItemsButton();
        });
    },
    custom_sale_type: function(frm) {
        // Trigger toggle function when custom_sale_type changes (alternative to $input.on('change'))
        frm.trigger('onload');
    }
});

// for checkbox rsa and extended warranty applied
frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        // Set both checkboxes as read-only by default
        frm.set_df_property("custom_road_side_assistance", "read_only", 1);
        frm.set_df_property("custom_is_extended_warranty", "read_only", 1);
        // Trigger the logic to check conditions on form load
        update_checkbox_state(frm, "custom_road_side_assistance", "custom_rsa_provider", "custom_rsa_amount");
        update_checkbox_state(frm, "custom_is_extended_warranty", "custom_extended_warranty_provider", "custom_extended_warranty_amount");
    },
    
    custom_rsa_provider: function(frm) {
        // Update road side assistance checkbox state when custom_rsa_provider changes
        update_checkbox_state(frm, "custom_road_side_assistance", "custom_rsa_provider", "custom_rsa_amount");
    },
    
    custom_rsa_amount: function(frm) {
        // Update road side assistance checkbox state when custom_rsa_amount changes
        update_checkbox_state(frm, "custom_road_side_assistance", "custom_rsa_provider", "custom_rsa_amount");
    },
    
    custom_extended_warranty_provider: function(frm) {
        // Update extended warranty checkbox state when custom_extended_warranty_provider changes
        update_checkbox_state(frm, "custom_is_extended_warranty", "custom_extended_warranty_provider", "custom_extended_warranty_amount");
    },
    
    custom_extended_warranty_amount: function(frm) {
        // Update extended warranty checkbox state when custom_extended_warranty_amount changes
        update_checkbox_state(frm, "custom_is_extended_warranty", "custom_extended_warranty_provider", "custom_extended_warranty_amount");
    }
});

// Function to update the state of a checkbox based on provider and amount fields
function update_checkbox_state(frm, checkbox_field, provider_field, amount_field) {
    // Check if provider has a value and amount is greater than 0
    const has_provider = frm.doc[provider_field] && frm.doc[provider_field] !== "";
    const has_valid_amount = frm.doc[amount_field] && frm.doc[amount_field] > 0;
    
    // Enable checkbox (not read-only) if both conditions are met, otherwise disable it
    frm.set_df_property(checkbox_field, "read_only", !(has_provider && has_valid_amount));
}