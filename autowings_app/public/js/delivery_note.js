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
                            // frappe.msgprint("Vehicle Sales Masters Updated Successfully.");
                            frm.reload_doc();
                        }
                    }
                });
            }, "Actions");
        }
    }
});



// ---------------------


frappe.ui.form.on('AW Job Card', {
    refresh: function(frm) {
        if (!frm.doc.__islocal && frm.doc.docstatus === 0) {
            frm.add_custom_button(__('Create Delivery Note'), function() {
                let d = new frappe.ui.Dialog({
                    title: 'Create Delivery Note',
                    fields: [
                        {
                            label: 'Posting Date',
                            fieldname: 'posting_date',
                            fieldtype: 'Date',
                            reqd: 1,
                            default: frappe.datetime.get_today()
                        },
                        {
                            label: 'Source Warehouse',
                            fieldname: 'source_warehouse',
                            fieldtype: 'Link',
                            options: 'Warehouse',
                            reqd: 1,
                            default: frm.doc.items[0]?.source_warehouse
                        },
                        {
                            label: 'Items',
                            fieldname: 'items',
                            fieldtype: 'Table',
                            reqd: 1,
                            cannot_add_rows: false,
                            in_place_edit: true,
                            data: [],
                            fields: [
                                {
                                    label: 'Item Code',
                                    fieldname: 'item_code',
                                    fieldtype: 'Link',
                                    options: 'Item',
                                    reqd: 1
                                },
                                {
                                    label: 'Required Qty',
                                    fieldname: 'required_qty',
                                    fieldtype: 'Float',
                                    reqd: 1
                                }
                            ]
                        }
                    ],
                    primary_action_label: 'Create',
                    primary_action(values) {
                        if (!values.items || values.items.length === 0) {
                            frappe.msgprint(__('Please add at least one item.'));
                            return;
                        }

                        let delivery_note = {
                            doctype: 'Delivery Note',
                            naming_series: 'DN-.YY.-',
                            customer: frm.doc.customer,
                            custom_job_card_id: frm.doc.name,
                            customer_name: frm.doc.customer,
                            posting_date: values.posting_date,
                            company: frm.doc.company,
                            set_warehouse: values.source_warehouse,
                            currency: 'INR',
                            selling_price_list: 'Standard Selling',
                            items: []
                        };

                        let total_qty = 0;
                        values.items.forEach(item => {
                            let rate = 222;
                            let amount = item.required_qty * rate;
                            total_qty += item.required_qty;

                            delivery_note.items.push({
                                item_code: item.item_code,
                                qty: item.required_qty,
                                stock_uom: 'Nos',
                                uom: 'Nos',
                                conversion_factor: 1,
                                warehouse: values.source_warehouse,
                                rate: rate,
                                amount: amount,
                                base_rate: rate,
                                base_amount: amount,
                                net_rate: rate,
                                net_amount: amount,
                                item_name: item.item_code,
                                description: item.item_code,
                                item_group: 'Products',
                                cost_center: 'Main - A',
                                expense_account: 'Cost of Goods Sold - A'
                            });
                        });

                        delivery_note.total_qty = total_qty;
                        delivery_note.base_total = total_qty * 222;
                        delivery_note.base_net_total = delivery_note.base_total;
                        delivery_note.total = delivery_note.base_total;
                        delivery_note.net_total = delivery_note.base_total;
                        delivery_note.base_grand_total = delivery_note.base_total;
                        delivery_note.grand_total = delivery_note.base_total;
                        delivery_note.base_rounded_total = delivery_note.base_total;
                        delivery_note.rounded_total = delivery_note.base_total;
                        delivery_note.base_in_words = frappe.utils.money_in_words(delivery_note.base_total, 'INR');
                        delivery_note.in_words = delivery_note.base_in_words;

                        frappe.call({
                            method: 'frappe.client.insert',
                            args: { doc: delivery_note },
                            callback: function(r) {
                                if (r.message) {
                                    let items_issued = values.items.map(item => ({
                                        item_code: item.item_code,
                                        source_warehouse: values.source_warehouse,
                                        required_qty: item.required_qty,
                                        delivery_note: r.message.name
                                    }));

                                    frappe.call({
                                        method: 'frappe.client.set_value',
                                        args: {
                                            doctype: 'AW Job Card',
                                            name: frm.doc.name,
                                            fieldname: 'items_issued',
                                            value: items_issued
                                        },
                                        callback: function() {
                                            frm.reload_doc();
                                            frappe.msgprint(__('Delivery Note {0} created and Items Issued updated.').format(r.message.name));
                                        }
                                    });
                                }
                            }
                        });

                        d.hide();
                    }
                });

                // Pre-fill items from AW Job Card
                frm.doc.items?.forEach(item => {
                    d.fields_dict.items.df.data.push({
                        item_code: item.item_code,
                        required_qty: item.required_qty
                    });
                });
                d.fields_dict.items.grid.refresh();
                d.show();
            });
        }
    }
});