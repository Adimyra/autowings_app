frappe.ui.form.on('Delivery Note', {
    refresh: function(frm) {
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
    }
});

// update
frappe.ui.form.on("Delivery Note", {
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button("Update Vehicle Sales Master", function() {
                frappe.call({
                    method: "autowings_app.custom_scripts.delivery_note.update_vehicle_sales_master_from_delivery_note",
                    args: { delivery_note: frm.doc.name },
                    callback: function(response) {
                        if (response.message) {
                            frappe.msgprint("Vehicle Sales Masters Updated Successfully.");
                            frm.reload_doc();
                        }
                    }
                });
            }, "Actions");
        }
    }
});
