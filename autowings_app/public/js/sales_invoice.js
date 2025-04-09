// for insurance policy
frappe.ui.form.on("Sales Invoice", {
    custom_insurance_provider: function(frm) {
        if (frm.doc.custom_insurance_provider) {
            frappe.call({
                method: "autowings_app.events.get_insurance_policies",
                args: { provider: frm.doc.custom_insurance_provider },
                callback: function(response) {
                    let policies = response.message || [];
                    let options = policies.map(policy => ({
                        label: policy.policy_name,
                        value: policy.name
                    }));

                    frm.set_df_property("custom_insurance_policy", "options", options);
                    frm.refresh_field("custom_insurance_policy");
                }
            });
        } else {
            frm.set_df_property("custom_insurance_policy", "options", []);
            frm.set_value("custom_insurance_policy", "");
        }
    }
});

// sales invoice naming series
frappe.ui.form.on('Sales Invoice', {
    onload: function(frm) {
        frappe.call({
            method: "autowings_app.api.get_user_naming_series",
            args: {
                user: frappe.session.user
            },
            callback: function(r) {
                if (r.message) {
                    frm.set_value("naming_series", r.message);
                }
            }
        });
    }
});

frappe.ui.form.on("Sales Invoice", {
    onload: function(frm) {
        check_and_show_sale_type_modal(frm);
    },

    refresh: function(frm) {
        check_and_show_sale_type_modal(frm);
        // Hide vehicle-related fields for Spare or Other sales
        toggle_vehicle_fields(frm);
    },

    custom_sale_type: function(frm) {
        // Make the custom_sale_type field read-only after selection
        frm.set_df_property("custom_sale_type", "read_only", 1);

        // Toggle vehicle-related sections visibility and set update_stock
        toggle_vehicle_fields(frm);

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
            frappe.throw(__("Please select a Sale Type (Spare, Other, or Vehicle) before saving."));
        }

        // Additional validation for Vehicle sales
        if (frm.doc.custom_sale_type === "Vehicle" && frm.doc.update_stock) {
            if (!frm.doc.custom_vin || !frm.doc.custom_vin.length) {
                frappe.throw(__("Chassis Number details are required in VIN table for Vehicle sales with update_stock enabled."));
            }
        }
    }
});

// **Check & Show Modal If `custom_sale_type` is Not Set**
function check_and_show_sale_type_modal(frm) {
    if (frm.is_new() && !frm.doc.custom_sale_type) {
        enforce_sale_type_selection(frm);
    }
}

// **Enforce Sale Type Selection Modal**
function enforce_sale_type_selection(frm) {
    if (window.saleTypeDialogActive) return; // Prevent multiple popups
    window.saleTypeDialogActive = true;

    let wrapper = document.createElement("div");
    wrapper.id = "sale-type-overlay";
    wrapper.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
            position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
            
            <div id="sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                
                <h4 style="margin-bottom: 20px;">What do you want to sell?</h4>
                <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px;">
                    <button id="sell_spare" class="custom-button"
                        style="background: #6c757d; color: white; padding: 8px 20px; font-size: 18px; 
                        border: none; border-radius: 10px; cursor: pointer;">
                        Spare
                    </button>
                    <button id="sell_other" class="custom-button"
                        style="background: #6c757d; color: white; padding: 8px 20px; font-size: 18px; 
                        border: none; border-radius: 10px; cursor: pointer;">
                        Other
                    </button>
                    <button id="sell_vehicle" class="custom-button"
                        style="background: #000; color: white; padding: 8px 20px; font-size: 18px; 
                        border: none; border-radius: 10px; cursor: pointer;">
                        Vehicle
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    document.getElementById("sell_spare").addEventListener("click", function() {
        frm.set_value("custom_sale_type", "Spare");
        toggle_vehicle_fields(frm);
        fadeOutAndCloseSaleModal();
    });

    document.getElementById("sell_other").addEventListener("click", function() {
        frm.set_value("custom_sale_type", "Other");
        toggle_vehicle_fields(frm);
        fadeOutAndCloseSaleModal();
    });

    document.getElementById("sell_vehicle").addEventListener("click", function() {
        frm.set_value("custom_sale_type", "Vehicle");
        toggle_vehicle_fields(frm);
        fadeOutAndCloseSaleModal();
    });
}

// **Smooth Fade-out Effect Before Closing Modal**
function fadeOutAndCloseSaleModal() {
    let overlay = document.getElementById("sale-type-overlay");
    if (overlay) overlay.remove();
    window.saleTypeDialogActive = false; // Reset flag after selection
}

// **Hide Vehicle-Specific Fields When "Spare" or "Other" is Selected**
function toggle_vehicle_fields(frm) {
    let is_vehicle = frm.doc.custom_sale_type === "Vehicle";
    let vehicle_fields = [
        "custom_vin",
        "custom_rto_office",
        "custom_registration_charge",
        "custom_insurance_provider",
        "custom_insurance_policy",
        "custom_insurance_amount",
        "custom_finance_provider",
        "custom_finance_amount",
        "custom_chassis_engine_details",
        "custom_rto_details",
        "custom_insurance_details",
        "custom_financer_details",
        "custom_misc_details"
    ];

    vehicle_fields.forEach(field => {
        frm.toggle_display(field, is_vehicle);
        if (!is_vehicle) {
            frm.set_value(field, ""); // Clear fields when not Vehicle
        }
    });

    frm.set_value("update_stock", is_vehicle ? 1 : 0); // Set update_stock based on sale type
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

// autowings_app/public/js/sales_invoice.js

// // for insurance policy
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
//                         value: policy.name
//                     }));

//                     frm.set_df_property("custom_insurance_policy", "options", options);
//                     frm.refresh_field("custom_insurance_policy");
//                 }
//             });
//         } else {
//             frm.set_df_property("custom_insurance_policy", "options", []);
//             frm.set_value("custom_insurance_policy", "");
//         }
//     }
// });

// // sales invoice naming series
// frappe.ui.form.on('Sales Invoice', {
//     onload: function(frm) {
//         frappe.call({
//             method: "autowings_app.api.get_user_naming_series",
//             args: {
//                 user: frappe.session.user
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     frm.set_value("naming_series", r.message);
//                 }
//             }
//         });
//     }
// });

// frappe.ui.form.on("Sales Invoice", {
//     onload: function(frm) {
//         check_and_show_sale_type_modal(frm);
//     },

//     refresh: function(frm) {
//         check_and_show_sale_type_modal(frm);
//     },

//     custom_sale_type: function(frm) {
//         // Make the custom_sale_type field read-only after selection
//         frm.set_df_property("custom_sale_type", "read_only", 1);

//         // Toggle vehicle-related sections visibility
//         toggle_vehicle_fields(frm);
//     },

//     custom_finance_provider: function(frm) {
//         // Debug the value of custom_finance_provider
//         console.log("custom_finance_provider value:", frm.doc.custom_finance_provider);
//         // Optional: Validate against Suppliers (server-side validation is preferred, but this is a quick check)
//         if (frm.doc.custom_finance_provider) {
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "Supplier",
//                     filters: { name: frm.doc.custom_finance_provider },
//                     fieldname: "name"
//                 },
//                 callback: function(r) {
//                     if (!r.message) {
//                         frappe.msgprint({
//                             title: __("Warning"),
//                             message: __(`Supplier ${frm.doc.custom_finance_provider} not found. Please create it or correct the value.`),
//                             indicator: "red"
//                         });
//                     }
//                 }
//             });
//         }
//     },

//     validate: function(frm) {
//         // Prevent submission if `custom_sale_type` is not set
//         if (!frm.doc.custom_sale_type) {
//             enforce_sale_type_selection(frm);
//             frappe.throw(__("Please select a Sale Type (Spare or Vehicle) before saving."));
//         }

//         // Debug and validate custom_finance_provider before submission
//         console.log("custom_finance_provider before submit:", frm.doc.custom_finance_provider);
//         if (frm.doc.custom_finance_provider && frm.doc.custom_finance_amount) {
//             frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "Supplier",
//                     filters: { name: frm.doc.custom_finance_provider },
//                     fieldname: "name"
//                 },
//                 async: false, // Ensure this completes before submission
//                 callback: function(r) {
//                     if (!r.message) {
//                         frappe.throw(__(`Supplier ${frm.doc.custom_finance_provider} not found. Please create it under Selling > Supplier.`));
//                     }
//                 }
//             });
//         }
//     }
// });

// // **Check & Show Modal If `custom_sale_type` is Not Set**
// function check_and_show_sale_type_modal(frm) {
//     if (frm.is_new() && !frm.doc.custom_sale_type) {
//         enforce_sale_type_selection(frm);
//     }
// }

// // **Enforce Sale Type Selection Modal**
// function enforce_sale_type_selection(frm) {
//     if (window.saleTypeDialogActive) return; // Prevent multiple popups
//     window.saleTypeDialogActive = true;

//     let wrapper = document.createElement("div");
//     wrapper.id = "sale-type-overlay";
//     wrapper.innerHTML = `
//         <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
//             position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
            
//             <div id="sale-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
//                 text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                
//                <h4 style="margin-bottom: 20px;">What do you want to sell?</h4>
//                 <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px;">
//                     <button id="sell_spare" class="custom-button"
//                         style="background: #6c757d; color: white; padding: 8px 20px; font-size: 18px; 
//                         border: none; border-radius: 10px; cursor: pointer;">
//                         Spare
//                     </button>
//                     <button id="sell_vehicle" class="custom-button"
//                         style="background: #000; color: white; padding: 8px 20px; font-size: 18px; 
//                         border: none; border-radius: 10px; cursor: pointer;">
//                         Vehicle
//                     </button>
//                 </div>

//             </div>
//         </div>
//     `;

//     document.body.appendChild(wrapper);

//     document.getElementById("sell_spare").addEventListener("click", function() {
//         frm.set_value("custom_sale_type", "Spare");
//         toggle_vehicle_fields(frm);
//         fadeOutAndCloseSaleModal();
//     });

//     document.getElementById("sell_vehicle").addEventListener("click", function() {
//         frm.set_value("custom_sale_type", "Vehicle");
//         toggle_vehicle_fields(frm);
//         fadeOutAndCloseSaleModal();
//     });
// }

// // **Smooth Fade-out Effect Before Closing Modal**
// function fadeOutAndCloseSaleModal() {
//     document.getElementById("sale-type-overlay").remove();
//     window.saleTypeDialogActive = false; // Reset flag after selection
// }

// // **Hide Vehicle-Specific Fields When "Spare" is Selected**
// function toggle_vehicle_fields(frm) {
//     let is_vehicle = frm.doc.custom_sale_type === "Vehicle";

//     let vehicle_fields = [
//         "custom_chassis_engine_details",
//         "custom_rto_details",
//         "custom_insurance_details",
//         "custom_financer_details",
//         "custom_misc_details"
//     ];

//     vehicle_fields.forEach(field => {
//         frm.toggle_display(field, is_vehicle);
//     });
// }

// // new code
// frappe.ui.form.on("Sales Invoice", {
//     refresh: function(frm) {
//         // Hide vehicle info section for Spare part sales
//         frm.toggle_display("custom_vehicle_info", frm.doc.custom_sale_type === "Vehicle");
//     },

//     custom_sale_type: function(frm) {
//         // Ensure custom_sale_type is mandatory
//         if (!frm.doc.custom_sale_type) {
//             frappe.throw(__("Please select Sale Type (Vehicle or Spare)."));
//         }

//         // Show VIN table only for Vehicle sales
//         frm.toggle_display("custom_vin", frm.doc.custom_sale_type === "Vehicle");

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
//         // Ensure VIN table is populated before submission if it's a vehicle sale
//         if (frm.doc.custom_sale_type === "Vehicle" && frm.doc.update_stock) {
//             if (!frm.doc.custom_vin.length) {
//                 frappe.throw(__("Chassis Number details are required in VIN table."));
//             }
//         }
//     }
// });

// // Detect when an item is added to the items table and populate VIN table
// frappe.ui.form.on("Sales Invoice Item", {
//     item_code: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         // Ensure VIN table is updated only for Vehicle sales
//         if (frm.doc.custom_sale_type === "Vehicle") {
//             // Check if the item already exists in VIN table to prevent duplicates
//             let exists = frm.doc.custom_vin.some(vin => vin.item === row.item_code);
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
//         let exists = frm.doc.custom_vin.some(vin => vin.item === item.item_code);
//         if (!exists) {
//             let row = frm.add_child("custom_vin");
//             row.item = item.item_code;  // Set item field in VIN table
//         }
//     });
//     frm.refresh_field("custom_vin");
// }