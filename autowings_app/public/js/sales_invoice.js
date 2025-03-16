// frappe.ui.form.on("Sales Invoice", {
//     refresh: function(frm) {
//         if (frm.doc.docstatus === 1) {
//             frm.add_custom_button("Create Vehicle Sales Master", function() {
//                 create_vehicle_sales_master(frm);
//             }, "Autowings");
//         }
//     }
// });

// function create_vehicle_sales_master(frm) {
//     frappe.call({
//         method: "autowings_app.custom_scripts.sales_invoice.create_vehicle_sales_master",
//         args: {
//             sales_invoice: frm.doc.name
//         },
//         callback: function(response) {
//             if (response.message) {
//                 frappe.msgprint("Vehicle Sales Masters Created Successfully.");
//                 frm.reload_doc();
//             }
//         }
//     });
// }


// // for automated
// frappe.ui.form.on('Sales Invoice', {
//     refresh: function(frm) {
//         // Ensure manual row addition is allowed for custom_vehicle_details
//         frm.fields_dict['custom_vin'].grid.wrapper.find('.grid-add-row').show();
//     },
    
//     update_stock: function(frm) {
//         if (frm.doc.update_stock) {
//             sync_vehicle_entries(frm);
//         }
//     }
// });

// frappe.ui.form.on('Sales Invoice Item', {
//     item_code: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         // If qty is not set, default to 1 when selecting the item for the first time
//         if (!row.qty || row.qty <= 0) {
//             frappe.model.set_value(cdt, cdn, 'qty', 1);
//         }

//         // Sync vehicle details if update_stock is enabled
//         if (frm.doc.update_stock) {
//             sync_vehicle_entries(frm);
//         }
//     },
    
//     qty: function(frm, cdt, cdn) {
//         if (frm.doc.update_stock) {
//             sync_vehicle_entries(frm);
//         }
//     }
// });

// // Function to sync `custom_vehicle_details` when an item is added
// function sync_vehicle_entries(frm) {
//     let vehicle_table = frm.doc.custom_vin || [];
//     let items_table = frm.doc.items || [];

//     // Track existing vehicle records per item
//     let vehicle_counts = {};

//     // Loop through items and calculate required qty per item
//     items_table.forEach(item_row => {
//         let item_code = item_row.item_code;
//         let required_qty = item_row.qty || 1;

//         if (!vehicle_counts[item_code]) {
//             vehicle_counts[item_code] = 0;
//         }

//         vehicle_counts[item_code] += required_qty;
//     });

//     // Clear existing `custom_vehicle_details` table before inserting new entries
//     frm.clear_table("custom_vin");

//     // Add rows for each item according to its required quantity
//     Object.keys(vehicle_counts).forEach(item_code => {
//         for (let i = 0; i < vehicle_counts[item_code]; i++) {
//             let new_row = frm.add_child("custom_vin");
//             new_row.item = item_code;
//             new_row.chassis_number = "";
//             new_row.engine_number = "";
//             new_row.vehicle_color = "";
//             new_row.manufacturing_date = "";
//         }
//     });

//     frm.refresh_field("custom_vin");
// }




// // for rto registration

// // frappe.ui.form.on("Sales Invoice", {
// //     refresh: function(frm) {
// //         if (frm.doc.docstatus === 0) {
// //             frm.fields_dict["custom_rto_registration"].df.onchange = function() {
// //                 if (frm.doc.custom_rto_registration) {
// //                     open_rto_registration_modal(frm);
// //                 } else {
// //                     remove_rto_registration_item(frm);
// //                 }
// //             };
// //         }
// //     }
// // });

// // function open_rto_registration_modal(frm) {
// //     frappe.call({
// //         method: "frappe.client.get_list",
// //         args: {
// //             doctype: "Item",
// //             filters: { "item_group": "Services" },
// //             fields: ["name", "item_name"]
// //         },
// //         callback: function(response) {
// //             let service_items = response.message || [];
// //             if (service_items.length === 0) {
// //                 frappe.msgprint("No service items found in 'Services' item group.");
// //                 return;
// //             }

// //             let item_options = service_items.map(item => ({
// //                 label: `${item.item_name} (${item.name})`,
// //                 value: item.name
// //             }));

// //             frappe.prompt([
// //                 {
// //                     label: "RTO Registration Item",
// //                     fieldname: "rto_item",
// //                     fieldtype: "Select",
// //                     options: item_options.map(i => i.value),
// //                     reqd: 1
// //                 },
// //                 {
// //                     label: "Registration Charge",
// //                     fieldname: "registration_charge",
// //                     fieldtype: "Currency",
// //                     reqd: 1
// //                 },
// //                 {
// //                     label: "RTO Office",
// //                     fieldname: "rto_office",
// //                     fieldtype: "Link",
// //                     options: "RTO Office",
// //                     reqd: 1
// //                 }
// //             ], function(values) {
// //                 add_rto_registration_item(frm, values);
// //             }, "RTO Registration Details", "Add");
// //         }
// //     });
// // }

// // function add_rto_registration_item(frm, values) {
// //     frappe.call({
// //         method: "frappe.client.get",
// //         args: {
// //             doctype: "Item",
// //             name: values.rto_item
// //         },
// //         callback: function(response) {
// //             let item_data = response.message;
// //             if (!item_data) {
// //                 frappe.msgprint("Item details could not be fetched.");
// //                 return;
// //             }

// //             // Append item with required fields
// //             frm.add_child("items", {
// //                 item_code: values.rto_item,
// //                 item_name: item_data.item_name,
// //                 description: item_data.description,
// //                 rate: values.registration_charge,
// //                 amount: values.registration_charge,
// //                 qty: 1,  // Default to 1 since it's a service charge
// //                 uom: item_data.stock_uom || "Nos",  // Default UOM
// //                 income_account: item_data.income_account || "Sales - AD", // Default Income Account
// //                 cost_center: item_data.cost_center || frm.doc.cost_center
// //             });

// //             frm.refresh_field("items");

// //             // Save RTO details in custom fields
// //             frm.set_value("custom_rto_office", values.rto_office);
// //         }
// //     });
// // }

// // function remove_rto_registration_item(frm) {
// //     frm.set_value("custom_rto_office", "");
// //     frm.doc.items = frm.doc.items.filter(item => item.item_group !== "Services");
// //     frm.refresh_field("items");
// // }


// frappe.ui.form.on("Sales Invoice", {
//     // RTO Registration Checkbox Logic
//     custom_rto_registration: function(frm) {
//         if (frm.doc.custom_rto_registration) {
//             let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
//             if (!has_vehicle) {
//                 frappe.throw("Please add a Vehicle Item before enabling RTO Registration.");
//                 frm.set_value("custom_rto_registration", 0);
//                 return;
//             }
//             add_or_update_service_item(frm, frm.doc.custom_rto_charge_item);
//         } else {
//             remove_service_item(frm, "custom_rto_charge_item");
//             frm.set_value("custom_rto_charge_item", "");  // Set to null when unchecked
//         }
//     },

//     // RTO Charge Item Selection Logic
//     custom_rto_charge_item: function(frm) {
//         if (frm.doc.custom_rto_registration) {
//             add_or_update_service_item(frm, frm.doc.custom_rto_charge_item);
//         }
//     },

//     // Insurance Checkbox Logic
//     custom_insurance: function(frm) {
//         if (frm.doc.custom_insurance) {
//             let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
//             if (!has_vehicle) {
//                 frappe.throw("Please add a Vehicle Item before enabling Insurance.");
//                 frm.set_value("custom_insurance", 0);
//                 return;
//             }
//             add_or_update_service_item(frm, frm.doc.custom_insurance_charge_item);
//         } else {
//             remove_service_item(frm, "custom_insurance_charge_item");
//             frm.set_value("custom_insurance_charge_item", "");  // Set to null when unchecked
//         }
//     },

//     // Insurance Charge Item Selection Logic
//     custom_insurance_charge_item: function(frm) {
//         if (frm.doc.custom_insurance) {
//             add_or_update_service_item(frm, frm.doc.custom_insurance_charge_item);
//         }
//     },

//     // Finance Checkbox Logic
//     custom_is_finance: function(frm) {
//         if (frm.doc.custom_is_finance) {
//             let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
//             if (!has_vehicle) {
//                 frappe.throw("Please add a Vehicle Item before enabling Finance.");
//                 frm.set_value("custom_is_finance", 0);
//                 return;
//             }
//         } else {
//             frm.set_value("custom_finance_provider", ""); // Set finance provider to null
//             frm.set_value("custom_loan_amount", ""); // Set loan amount to null
//         }
//     }
// });

// /**
//  * Helper function to add or update service charge items dynamically
//  */
// function add_or_update_service_item(frm, item_code) {
//     if (!item_code) return;

//     frappe.call({
//         method: "frappe.client.get",
//         args: {
//             doctype: "Item",
//             name: item_code
//         },
//         callback: function(r) {
//             if (r.message) {
//                 let item = r.message;
//                 let existing_row = frm.doc.items.find(i => i.item_code === item_code);

//                 if (existing_row) {
//                     existing_row.qty = 1;
//                     existing_row.rate = item.standard_rate || 0;
//                     existing_row.amount = existing_row.rate * existing_row.qty;
//                     existing_row.uom = item.stock_uom;
//                     existing_row.income_account = "Sales - A";  // Hardcoded
//                 } else {
//                     let row = frm.add_child("items");
//                     row.item_code = item_code;
//                     row.item_name = item.item_name;
//                     row.qty = 1;
//                     row.rate = item.standard_rate || 0;
//                     row.amount = row.rate * row.qty;
//                     row.uom = item.stock_uom;
//                     row.income_account = "Sales - A";  // Hardcoded
//                 }

//                 frm.refresh_field("items");
//             }
//         }
//     });
// }

// /**
//  * Helper function to remove service charge items when checkbox is unchecked
//  */
// function remove_service_item(frm, charge_field) {
//     let item_code = frm.doc[charge_field];
//     if (!item_code) return;

//     let updated_items = frm.doc.items.filter(item => item.item_code !== item_code);
//     frm.doc.items = updated_items;
//     frm.refresh_field("items");
// }


// for insurance policy
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


// set default vehicle

frappe.ui.form.on("Sales Invoice", {
    onload: function(frm) {
        check_and_show_sale_type_modal(frm);
    },

    refresh: function(frm) {
        check_and_show_sale_type_modal(frm);
    },

    custom_sale_type: function(frm) {
        // Make the custom_sale_type field read-only after selection
        frm.set_df_property("custom_sale_type", "read_only", 1);

        // Toggle specific vehicle-related sections visibility
        toggle_vehicle_fields(frm);
    },

    validate: function(frm) {
        // Prevent submission if custom_sale_type is still not set
        if (!frm.doc.custom_sale_type) {
            enforce_sale_type_selection(frm);
            frappe.throw(__("Please select a Sale Type (Spare or Vehicle) before saving."));
        }
    }
});

// **Check & Show Modal If custom_sale_type is Not Set**
function check_and_show_sale_type_modal(frm) {
    if (frm.is_new() && !frm.doc.custom_sale_type) {
        enforce_sale_type_selection(frm);
    }
}

// **Enforce Sale Type Selection Modal**
function enforce_sale_type_selection(frm) {
    if (window.saleTypeDialogActive) return; // Prevent multiple popups
    window.saleTypeDialogActive = true;

    let dialog = new frappe.ui.Dialog({
        title: "Select Sale Type",
        size: "small",
        fields: [{ fieldname: "button_container", fieldtype: "HTML" }],
        close_on_escape: false // Prevents closing with ESC
    });

    let wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                <h2 style="margin-bottom: 20px;">What do you want to sell?</h2>
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <button id="sell_spare" class="custom-button"
                        style="background: #6c757d; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer;">
                        Spare
                    </button>
                    <button id="sell_vehicle" class="custom-button"
                        style="background: #000; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer;">
                        Vehicle
                    </button>
                </div>
            </div>
        </div>
    `;

    dialog.fields_dict.button_container.$wrapper.append(wrapper);
    
    // Prevent closing modal without selection
    dialog.$wrapper.find(".modal-dialog").css("pointer-events", "none");

    wrapper.querySelector("#sell_spare").addEventListener("click", function() {
        frm.set_value("custom_sale_type", "Spare");
        frm.set_df_property("custom_sale_type", "read_only", 1);
        toggle_vehicle_fields(frm);
        dialog.hide();
        window.saleTypeDialogActive = false; // Reset flag after selection
    });

    wrapper.querySelector("#sell_vehicle").addEventListener("click", function() {
        frm.set_value("custom_sale_type", "Vehicle");
        frm.set_df_property("custom_sale_type", "read_only", 1);
        toggle_vehicle_fields(frm);
        dialog.hide();
        window.saleTypeDialogActive = false; // Reset flag after selection
    });

    dialog.show();

    // **Ensure modal keeps appearing until selection is made**
    let interval = setInterval(() => {
        if (!frm.doc.custom_sale_type) {
            if (!dialog.$wrapper.is(":visible")) {
                dialog.show();
            }
        } else {
            clearInterval(interval);
        }
    }, 500);
}

// **Toggle Vehicle Info Fields Based on Selection**
function toggle_vehicle_fields(frm) {
    let is_vehicle = frm.doc.custom_sale_type === "Vehicle";

    // Fields to hide when "Spare" is selected
    let vehicle_fields = [
        "custom_chassis_engine_details",
        "custom_rto_details",
        "custom_insurance_details",
        "custom_financer_details",
        "custom_misc_details"
    ];

    vehicle_fields.forEach(field => {
        frm.toggle_display(field, is_vehicle);
    });
}

// new code
frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        // Hide vehicle info section for Spare part sales
        frm.toggle_display("custom_vehicle_info", frm.doc.custom_sale_type === "Vehicle");
    },

    custom_sale_type: function(frm) {
        // Ensure custom_sale_type is mandatory
        if (!frm.doc.custom_sale_type) {
            frappe.throw(__("Please select Sale Type (Vehicle or Spare)."));
        }

        // Show VIN table only for Vehicle sales
        frm.toggle_display("custom_vin", frm.doc.custom_sale_type === "Vehicle");

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
        // Ensure VIN table is populated before submission if it's a vehicle sale
        if (frm.doc.custom_sale_type === "Vehicle" && frm.doc.update_stock) {
            if (!frm.doc.custom_vin.length) {
                frappe.throw(__("Chassis Number details are required in VIN table."));
            }
        }
    }
});

// Detect when an item is added to the items table and populate VIN table
frappe.ui.form.on("Sales Invoice Item", {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Ensure VIN table is updated only for Vehicle sales
        if (frm.doc.custom_sale_type === "Vehicle") {
            // Check if the item already exists in VIN table to prevent duplicates
            let exists = frm.doc.custom_vin.some(vin => vin.item === row.item_code);
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
        let exists = frm.doc.custom_vin.some(vin => vin.item === item.item_code);
        if (!exists) {
            let row = frm.add_child("custom_vin");
            row.item = item.item_code;  // Set item field in VIN table
        }
    });
    frm.refresh_field("custom_vin");
}
