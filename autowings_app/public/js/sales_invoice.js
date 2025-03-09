frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button('Create Insurance', function() {
                frappe.call({
                    method: 'autowings_app.autowings_app.doctype.vehicle_insurance.vehicle_insurance.create_vehicle_insurance',
                    args: { sales_invoice: frm.doc.name },
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint(__('Vehicle Insurance Created: ' + r.message));
                        }
                    }
                });
            }, 'Create');

            frm.add_custom_button('Create RTO Registration', function() {
                frappe.call({
                    method: 'autowings_app.autowings_app.doctype.rto_registration.rto_registration.create_rto_registration',
                    args: { sales_invoice: frm.doc.name },
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint(__('RTO Registration Created: ' + r.message));
                        }
                    }
                });
            }, 'Create');
        }
    }
});

frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button('Create Vehicle Sale', function() {
                frappe.call({
                    method: 'autowings_app.autowings_app.doctype.vehicle_sale.vehicle_sale.create_vehicle_sale',
                    args: {
                        sales_invoice: frm.doc.name
                    },
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint(__('Vehicle Sale Created: ' + r.message));
                        }
                    }
                });
            }, 'Create');
        }
    }
});


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
