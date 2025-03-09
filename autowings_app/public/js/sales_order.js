frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button('Create Vehicle Sale', function() {
                frappe.call({
                    method: 'autowings_app.autowings_app.doctype.vehicle_sale.vehicle_sale.create_vehicle_sale',
                    args: {
                        sales_order: frm.doc.name
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
