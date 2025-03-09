frappe.ui.form.on('Purchase Receipt', {
    refresh: function(frm) {
        // Ensure Add Row Manually button is hidden for custom_vin
        frm.fields_dict['custom_vin'].grid.wrapper.find('.grid-add-row').show(); // Allow manual addition
    }
});

frappe.ui.form.on('Purchase Receipt Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // If qty is not set, default to 1 when selecting the item for the first time
        if (!row.qty || row.qty <= 0) {
            frappe.model.set_value(cdt, cdn, 'qty', 1);
        }

        // Ensure VIN is added when item is selected
        if (row.item_code) {
            add_vin_entry(frm, row.item_code, row.qty);
        }
    },
    
    qty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Ensure correct number of VIN rows match item quantity
        if (row.item_code && row.qty) {
            update_vin_entries(frm, row.item_code, row.qty);
        }
    }
});

// Function to add a VIN entry in `custom_vin` when an item is added
function add_vin_entry(frm, item_code, qty) {
    let existing_vin_rows = frm.doc.custom_vin.filter(row => row.item === item_code);

    if (existing_vin_rows.length < qty) {
        let diff = qty - existing_vin_rows.length;

        for (let i = 0; i < diff; i++) {
            let child = frm.add_child("custom_vin");
            child.item = item_code;  // Set item in custom_vin
        }
        frm.refresh_field("custom_vin");
    }
}

// Function to ensure `custom_vin` rows match item quantity
function update_vin_entries(frm, item_code, qty) {
    let existing_vin_rows = frm.doc.custom_vin.filter(row => row.item === item_code);
    
    if (existing_vin_rows.length > qty) {
        // Remove extra rows
        let extra = existing_vin_rows.length - qty;
        for (let i = 0; i < extra; i++) {
            let row_idx = frm.doc.custom_vin.findIndex(row => row.item === item_code);
            frm.doc.custom_vin.splice(row_idx, 1);
        }
        frm.refresh_field("custom_vin");
    } else if (existing_vin_rows.length < qty) {
        // Add missing rows
        let missing = qty - existing_vin_rows.length;
        for (let i = 0; i < missing; i++) {
            let child = frm.add_child("custom_vin");
            child.item = item_code;
        }
        frm.refresh_field("custom_vin");
    }
}
