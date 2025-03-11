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
        frm.fields_dict['custom_vehicle_details'].grid.wrapper.find('.grid-add-row').show();
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
    let vehicle_table = frm.doc.custom_vehicle_details || [];
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
    frm.clear_table("custom_vehicle_details");

    // Add rows for each item according to its required quantity
    Object.keys(vehicle_counts).forEach(item_code => {
        for (let i = 0; i < vehicle_counts[item_code]; i++) {
            let new_row = frm.add_child("custom_vehicle_details");
            new_row.item = item_code;
            new_row.chassis_number = "";
            new_row.engine_number = "";
            new_row.vehicle_color = "";
            new_row.manufacturing_date = "";
        }
    });

    frm.refresh_field("custom_vehicle_details");
}




// for rto registration
frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        if (frm.doc.docstatus === 0) {
            frm.fields_dict["custom_rto_registration"].df.onchange = function() {
                if (frm.doc.custom_rto_registration) {
                    open_rto_registration_modal(frm);
                } else {
                    remove_rto_registration_item(frm);
                }
            };
        }
    }
});

function open_rto_registration_modal(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            filters: { "item_group": "Services" },
            fields: ["name", "item_name"]
        },
        callback: function(response) {
            let service_items = response.message || [];
            if (service_items.length === 0) {
                frappe.msgprint("No service items found in 'Services' item group.");
                return;
            }

            let item_options = service_items.map(item => ({
                label: `${item.item_name} (${item.name})`,
                value: item.name
            }));

            frappe.prompt([
                {
                    label: "RTO Registration Item",
                    fieldname: "rto_item",
                    fieldtype: "Select",
                    options: item_options.map(i => i.value),
                    reqd: 1
                },
                {
                    label: "Registration Charge",
                    fieldname: "registration_charge",
                    fieldtype: "Currency",
                    reqd: 1
                },
                {
                    label: "RTO Office",
                    fieldname: "rto_office",
                    fieldtype: "Link",
                    options: "RTO Office",
                    reqd: 1
                }
            ], function(values) {
                add_rto_registration_item(frm, values);
            }, "RTO Registration Details", "Add");
        }
    });
}

function add_rto_registration_item(frm, values) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Item",
            name: values.rto_item
        },
        callback: function(response) {
            let item_data = response.message;
            if (!item_data) {
                frappe.msgprint("Item details could not be fetched.");
                return;
            }

            // Append item with required fields
            frm.add_child("items", {
                item_code: values.rto_item,
                item_name: item_data.item_name,
                description: item_data.description,
                rate: values.registration_charge,
                amount: values.registration_charge,
                qty: 1,  // Default to 1 since it's a service charge
                uom: item_data.stock_uom || "Nos",  // Default UOM
                income_account: item_data.income_account || "Sales - AD", // Default Income Account
                cost_center: item_data.cost_center || frm.doc.cost_center
            });

            frm.refresh_field("items");

            // Save RTO details in custom fields
            frm.set_value("custom_rto_office", values.rto_office);
        }
    });
}

function remove_rto_registration_item(frm) {
    frm.set_value("custom_rto_office", "");
    frm.doc.items = frm.doc.items.filter(item => item.item_group !== "Services");
    frm.refresh_field("items");
}
