frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button("Create Vehicle Sales Master", function() {
                create_vehicle_sales_master(frm);
            }, "Autowings");
        }
    }
});

function create_vehicle_sales_master(frm) {
    frappe.call({
        method: "autowings_app.custom_scripts.sales_invoice.create_vehicle_sales_master",
        args: {
            sales_invoice: frm.doc.name
        },
        callback: function(response) {
            if (response.message) {
                frappe.msgprint("Vehicle Sales Masters Created Successfully.");
                frm.reload_doc();
            }
        }
    });
}


// for automated
frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        // Ensure manual row addition is allowed for custom_vehicle_details
        frm.fields_dict['custom_vin'].grid.wrapper.find('.grid-add-row').show();
    },
    
    update_stock: function(frm) {
        if (frm.doc.update_stock) {
            sync_vehicle_entries(frm);
        }
    }
});

frappe.ui.form.on('Sales Invoice Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // If qty is not set, default to 1 when selecting the item for the first time
        if (!row.qty || row.qty <= 0) {
            frappe.model.set_value(cdt, cdn, 'qty', 1);
        }

        // Sync vehicle details if update_stock is enabled
        if (frm.doc.update_stock) {
            sync_vehicle_entries(frm);
        }
    },
    
    qty: function(frm, cdt, cdn) {
        if (frm.doc.update_stock) {
            sync_vehicle_entries(frm);
        }
    }
});

// Function to sync `custom_vehicle_details` when an item is added
function sync_vehicle_entries(frm) {
    let vehicle_table = frm.doc.custom_vin || [];
    let items_table = frm.doc.items || [];

    // Track existing vehicle records per item
    let vehicle_counts = {};

    // Loop through items and calculate required qty per item
    items_table.forEach(item_row => {
        let item_code = item_row.item_code;
        let required_qty = item_row.qty || 1;

        if (!vehicle_counts[item_code]) {
            vehicle_counts[item_code] = 0;
        }

        vehicle_counts[item_code] += required_qty;
    });

    // Clear existing `custom_vehicle_details` table before inserting new entries
    frm.clear_table("custom_vin");

    // Add rows for each item according to its required quantity
    Object.keys(vehicle_counts).forEach(item_code => {
        for (let i = 0; i < vehicle_counts[item_code]; i++) {
            let new_row = frm.add_child("custom_vin");
            new_row.item = item_code;
            new_row.chassis_number = "";
            new_row.engine_number = "";
            new_row.vehicle_color = "";
            new_row.manufacturing_date = "";
        }
    });

    frm.refresh_field("custom_vin");
}




// for rto registration

// frappe.ui.form.on("Sales Invoice", {
//     refresh: function(frm) {
//         if (frm.doc.docstatus === 0) {
//             frm.fields_dict["custom_rto_registration"].df.onchange = function() {
//                 if (frm.doc.custom_rto_registration) {
//                     open_rto_registration_modal(frm);
//                 } else {
//                     remove_rto_registration_item(frm);
//                 }
//             };
//         }
//     }
// });

// function open_rto_registration_modal(frm) {
//     frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//             doctype: "Item",
//             filters: { "item_group": "Services" },
//             fields: ["name", "item_name"]
//         },
//         callback: function(response) {
//             let service_items = response.message || [];
//             if (service_items.length === 0) {
//                 frappe.msgprint("No service items found in 'Services' item group.");
//                 return;
//             }

//             let item_options = service_items.map(item => ({
//                 label: `${item.item_name} (${item.name})`,
//                 value: item.name
//             }));

//             frappe.prompt([
//                 {
//                     label: "RTO Registration Item",
//                     fieldname: "rto_item",
//                     fieldtype: "Select",
//                     options: item_options.map(i => i.value),
//                     reqd: 1
//                 },
//                 {
//                     label: "Registration Charge",
//                     fieldname: "registration_charge",
//                     fieldtype: "Currency",
//                     reqd: 1
//                 },
//                 {
//                     label: "RTO Office",
//                     fieldname: "rto_office",
//                     fieldtype: "Link",
//                     options: "RTO Office",
//                     reqd: 1
//                 }
//             ], function(values) {
//                 add_rto_registration_item(frm, values);
//             }, "RTO Registration Details", "Add");
//         }
//     });
// }

// function add_rto_registration_item(frm, values) {
//     frappe.call({
//         method: "frappe.client.get",
//         args: {
//             doctype: "Item",
//             name: values.rto_item
//         },
//         callback: function(response) {
//             let item_data = response.message;
//             if (!item_data) {
//                 frappe.msgprint("Item details could not be fetched.");
//                 return;
//             }

//             // Append item with required fields
//             frm.add_child("items", {
//                 item_code: values.rto_item,
//                 item_name: item_data.item_name,
//                 description: item_data.description,
//                 rate: values.registration_charge,
//                 amount: values.registration_charge,
//                 qty: 1,  // Default to 1 since it's a service charge
//                 uom: item_data.stock_uom || "Nos",  // Default UOM
//                 income_account: item_data.income_account || "Sales - AD", // Default Income Account
//                 cost_center: item_data.cost_center || frm.doc.cost_center
//             });

//             frm.refresh_field("items");

//             // Save RTO details in custom fields
//             frm.set_value("custom_rto_office", values.rto_office);
//         }
//     });
// }

// function remove_rto_registration_item(frm) {
//     frm.set_value("custom_rto_office", "");
//     frm.doc.items = frm.doc.items.filter(item => item.item_group !== "Services");
//     frm.refresh_field("items");
// }


frappe.ui.form.on("Sales Invoice", {
    // RTO Registration Checkbox Logic
    custom_rto_registration: function(frm) {
        if (frm.doc.custom_rto_registration) {
            let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
            if (!has_vehicle) {
                frappe.throw("Please add a Vehicle Item before enabling RTO Registration.");
                frm.set_value("custom_rto_registration", 0);
                return;
            }
            add_or_update_service_item(frm, frm.doc.custom_rto_charge_item);
        } else {
            remove_service_item(frm, "custom_rto_charge_item");
            frm.set_value("custom_rto_charge_item", "");  // Set to null when unchecked
        }
    },

    // RTO Charge Item Selection Logic
    custom_rto_charge_item: function(frm) {
        if (frm.doc.custom_rto_registration) {
            add_or_update_service_item(frm, frm.doc.custom_rto_charge_item);
        }
    },

    // Insurance Checkbox Logic
    custom_insurance: function(frm) {
        if (frm.doc.custom_insurance) {
            let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
            if (!has_vehicle) {
                frappe.throw("Please add a Vehicle Item before enabling Insurance.");
                frm.set_value("custom_insurance", 0);
                return;
            }
            add_or_update_service_item(frm, frm.doc.custom_insurance_charge_item);
        } else {
            remove_service_item(frm, "custom_insurance_charge_item");
            frm.set_value("custom_insurance_charge_item", "");  // Set to null when unchecked
        }
    },

    // Insurance Charge Item Selection Logic
    custom_insurance_charge_item: function(frm) {
        if (frm.doc.custom_insurance) {
            add_or_update_service_item(frm, frm.doc.custom_insurance_charge_item);
        }
    },

    // Finance Checkbox Logic
    custom_is_finance: function(frm) {
        if (frm.doc.custom_is_finance) {
            let has_vehicle = frm.doc.items.some(item => item.custom_is_vehicle == 1);
            if (!has_vehicle) {
                frappe.throw("Please add a Vehicle Item before enabling Finance.");
                frm.set_value("custom_is_finance", 0);
                return;
            }
        } else {
            frm.set_value("custom_finance_provider", ""); // Set finance provider to null
            frm.set_value("custom_loan_amount", ""); // Set loan amount to null
        }
    }
});

/**
 * Helper function to add or update service charge items dynamically
 */
function add_or_update_service_item(frm, item_code) {
    if (!item_code) return;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Item",
            name: item_code
        },
        callback: function(r) {
            if (r.message) {
                let item = r.message;
                let existing_row = frm.doc.items.find(i => i.item_code === item_code);

                if (existing_row) {
                    existing_row.qty = 1;
                    existing_row.rate = item.standard_rate || 0;
                    existing_row.amount = existing_row.rate * existing_row.qty;
                    existing_row.uom = item.stock_uom;
                    existing_row.income_account = "Sales - A";  // Hardcoded
                } else {
                    let row = frm.add_child("items");
                    row.item_code = item_code;
                    row.item_name = item.item_name;
                    row.qty = 1;
                    row.rate = item.standard_rate || 0;
                    row.amount = row.rate * row.qty;
                    row.uom = item.stock_uom;
                    row.income_account = "Sales - A";  // Hardcoded
                }

                frm.refresh_field("items");
            }
        }
    });
}

/**
 * Helper function to remove service charge items when checkbox is unchecked
 */
function remove_service_item(frm, charge_field) {
    let item_code = frm.doc[charge_field];
    if (!item_code) return;

    let updated_items = frm.doc.items.filter(item => item.item_code !== item_code);
    frm.doc.items = updated_items;
    frm.refresh_field("items");
}


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
frappe.ui.form.on('Sales Invoice', {
    onload: function(frm) {
        // Show modal only when creating a new Sales Invoice
        if (frm.is_new()) {
            let wrapper = document.createElement("div");
            wrapper.innerHTML = `
                <div style="display: flex; justify-content: center; gap: 20px; padding: 20px;">
                    <button id="sell_spare" class="custom-button" style="background: #007bff; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer;">Sell Spare</button>
                    <button id="sell_vehicle" class="custom-button" style="background: #28a745; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer;">Sell Vehicle</button>
                </div>
            `;

            let dialog = new frappe.ui.Dialog({
                title: 'What do you want to sell?',
                fields: [
                    {
                        fieldname: "button_container",
                        fieldtype: "HTML"
                    }
                ],
                size: "small"
            });

            dialog.fields_dict.button_container.$wrapper.append(wrapper);
            
            // Event listeners for buttons
            wrapper.querySelector("#sell_spare").addEventListener("click", function() {
                dialog.hide();
                frm.set_value('custom_sale_type', 'Spare');
                update_items_custom_is_vehicle(frm);
            });

            wrapper.querySelector("#sell_vehicle").addEventListener("click", function() {
                dialog.hide();
                frm.set_value('custom_sale_type', 'Vehicle');
                update_items_custom_is_vehicle(frm);
            });

            dialog.show();
        }
    },

    // Trigger when the custom_sale_type field is changed manually
    custom_sale_type: function(frm) {
        update_items_custom_is_vehicle(frm);
    }
});

// Function to update the custom_is_vehicle field in the items table
function update_items_custom_is_vehicle(frm) {
    let is_vehicle = frm.doc.custom_sale_type === 'Vehicle' ? 1 : 0;

    frm.doc.items.forEach(item => {
        frappe.model.set_value(item.doctype, item.name, 'custom_is_vehicle', is_vehicle);
    });

    frm.refresh_field('items'); // Refresh the table to apply changes
}
