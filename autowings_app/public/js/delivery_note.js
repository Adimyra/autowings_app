

// // ---------------------
frappe.ui.form.on('Delivery Note', {
    refresh: function(frm) {
        // Fetch serial number details from Sales Invoice
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

        // Add button to update Vehicle Sales Master if submitted
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button("Update Vehicle Sales Master", function() {
                frappe.call({
                    method: "autowings_app.custom_scripts.delivery_note.update_vehicle_sales_master_from_delivery_note",
                    args: { delivery_note: frm.doc.name },
                    callback: function(response) {
                        if (response.message) {
                            let msg = frm.doc.is_return ? 
                                "Vehicle Sales Masters Updated (Return Processed)." : 
                                "Vehicle Sales Masters Updated Successfully.";
                            frappe.msgprint(msg);
                            frm.reload_doc();
                        }
                    }
                });
            }, "Actions");
        }
    }
});


// ---------------------------------------------------------------------------


frappe.ui.form.on("Delivery Note", {
    refresh: function(frm) {
        if (!frm.is_new() || frm.doc.custom_delivery_note_type) {
            if (frm.doc.custom_delivery_note_type && frm.doc.custom_delivery_note_type !== "Job Card Return") {
                toggle_delivery_note_fields(frm);
                set_naming_series_and_warehouse(frm);
            }
            return;
        }
        enforce_delivery_note_type_selection(frm);
    },

    custom_delivery_note_type: function(frm) {
        if (frm.doc.custom_delivery_note_type && frm.doc.custom_delivery_note_type !== "Job Card Return") {
            toggle_delivery_note_fields(frm);
            set_naming_series_and_warehouse(frm);
        }
        if (frm.doc.custom_delivery_note_type === "Job Card Return" && !frm.doc.__islocal) {
            show_return_delivery_note_modal(frm);
        }
    },

    custom_job_card_id: function(frm) {
        if (frm.doc.custom_job_card_id && frm.doc.custom_delivery_note_type === "Job Card") {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "AW Job Card",
                    filters: { name: frm.doc.custom_job_card_id },
                    fieldname: ["customer"]
                },
                callback: function(response) {
                    if (response.message && response.message.customer) {
                        frm.set_value("customer", response.message.customer);
                        frm.set_df_property("customer", "hidden", 0);
                        frm.set_df_property("customer", "read_only", 1);
                    } else {
                        frappe.msgprint({
                            title: __("Warning"),
                            indicator: "orange",
                            message: __("Customer not found in AW Job Card: {0}", [frm.doc.custom_job_card_id])
                        });
                        frm.set_value("customer", "");
                        frm.set_df_property("customer", "hidden", 1);
                        frm.set_df_property("customer", "read_only", 0);
                    }
                    frm.refresh_field("customer");
                },
                error: function(err) {
                    frappe.msgprint({
                        title: __("Error"),
                        indicator: "red",
                        message: __("Error fetching AW Job Card details: {0}", [err.message])
                    });
                    frm.set_value("customer", "");
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("customer", "read_only", 0);
                    frm.refresh_field("customer");
                }
            });
        } else {
            frm.set_value("customer", "");
            frm.set_df_property("customer", "hidden", frm.doc.custom_delivery_note_type === "Job Card" ? 1 : 0);
            frm.set_df_property("customer", "read_only", 0);
            frm.refresh_field("customer");
        }
    },

    onload: function(frm) {
        if (frm.doc.custom_delivery_note_type !== "Job Card Return") {
            frm.set_query("return_against", function() {
                if (frm.doc.custom_delivery_note_type === "Job Card" && frm.doc.custom_job_card_id) {
                    return {
                        filters: {
                            custom_job_card_id: frm.doc.custom_job_card_id,
                            docstatus: 1,
                            is_return: 0
                        }
                    };
                }
                return {};
            });
        }
        frm.set_df_property("custom_vin", "hidden", frm.doc.custom_delivery_note_type === "Normal" ? 0 : 1);
        frm.set_df_property("custom_vin", "reqd", frm.doc.custom_delivery_note_type === "Normal" ? 1 : 0);
        frm.refresh_field("custom_vin");
    },

    return_against: function(frm) {
        if (frm.doc.custom_delivery_note_type !== "Job Card Return" && frm.doc.custom_job_card_id && frm.doc.return_against) {
            show_item_selection_modal(frm);
        }
    },

    validate: function(frm) {
        if (frm.doc.items && frm.doc.custom_delivery_note_type !== "Job Card Return") {
            frm.doc.items = frm.doc.items.filter(item => item.item_code && item.qty);
            frm.refresh_field("items");
        }
    }
});

function enforce_delivery_note_type_selection(frm) {
    if (window.deliveryNoteTypeDialogActive) return;
    window.deliveryNoteTypeDialogActive = true;

    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                let wrapper = document.createElement("div");
                wrapper.id = "delivery-note-type-overlay";
                wrapper.style.cssText = "opacity: 0; transition: opacity 0.3s ease-in-out;";
                wrapper.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
                        position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
                        <div id="delivery-note-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                            text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                            <h4 style="margin-bottom: 20px;">Select Delivery Note Type</h4>
                            <div id="delivery-note-type-buttons" style="display: flex; justify-content: center; gap: 40px; 
                                padding-top: 10px; padding-bottom: 10px;">
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(wrapper);
                setTimeout(() => wrapper.style.opacity = "1", 10);
                let buttonContainer = document.getElementById("delivery-note-type-buttons");
                deliveryNoteTypes.forEach(function(type, index) {
                    let button = document.createElement("button");
                    button.id = `delivery_note_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
                    button.className = "custom-button";
                    button.innerText = type.label;
                    const colors = ["#000", "#6c757d", "#dc3545", "#28a745", "#17a2b8", "#ffc107"];
                    button.style.cssText = `
                        background: ${colors[index % colors.length]}; 
                        color: white; 
                        padding: 8px 20px; 
                        font-size: 18px; 
                        border: none; 
                        border-radius: 10px; 
                        cursor: pointer;
                    `;
                    button.addEventListener("click", function() {
                        frm.set_value("custom_delivery_note_type", type.name);
                        frm.set_value("custom_delivery_note_label", type.label);
                        if (type.name !== "Job Card Return") {
                            frm.set_value("naming_series", type.naming_series);
                            frm.set_value("set_warehouse", type.warehouse || "");
                            toggle_delivery_note_fields(frm);
                            frm.set_df_property("naming_series", "read_only", 0);
                            frm.set_df_property("set_warehouse", "read_only", 0);
                            frm.refresh_field("naming_series");
                            frm.refresh_field("set_warehouse");
                        }
                        fadeOutAndCloseDeliveryNoteModal();
                        if (type.name === "Job Card Return") {
                            show_return_delivery_note_modal(frm);
                        }
                    });
                    buttonContainer.appendChild(button);
                });
            } else {
                frappe.msgprint(__("No enabled Delivery Note types found in Autowings Naming Series."));
                window.deliveryNoteTypeDialogActive = false;
            }
        },
        error: function(err) {
            frappe.msgprint(__("Error fetching Delivery Note types: {0}", [err.message]));
            window.deliveryNoteTypeDialogActive = false;
        }
    });
}

function set_naming_series_and_warehouse(frm) {
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                const selectedType = deliveryNoteTypes.find(type => 
                    type.label === frm.doc.custom_delivery_note_label || type.name === frm.doc.custom_delivery_note_type
                );
                if (selectedType && frm.doc.custom_delivery_note_type !== "Job Card Return") {
                    frm.set_value("naming_series", selectedType.naming_series);
                    frm.set_value("set_warehouse", selectedType.warehouse || "");
                    frm.set_df_property("set_warehouse", "read_only", 0);
                    frm.refresh_field("set_warehouse");
                    frm.refresh_field("naming_series");
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__("Error fetching naming series or warehouse: {0}", [err.message]));
        }
    });
}

function toggle_delivery_note_fields(frm) {
    const type = frm.doc.custom_delivery_note_type;
    if (type === "Normal") {
        frm.set_df_property("custom_job_card_id", "hidden", 1);
        frm.set_df_property("custom_job_card_id", "reqd", 0);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        frm.set_df_property("customer", "hidden", 0);
        frm.set_df_property("customer", "read_only", 0);
        frm.set_value("custom_job_card_id", "");
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
    } else if (type === "Job Card") {
        frm.set_df_property("custom_job_card_id", "hidden", 0);
        frm.set_df_property("custom_job_card_id", "reqd", 1);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        if (!frm.doc.custom_job_card_id || !frm.doc.customer) {
            frm.set_df_property("customer", "hidden", 1);
            frm.set_df_property("customer", "read_only", 0);
            frm.set_value("customer", "");
        }
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
    } else if (type === "Job Card Return") {
        frm.get_field("custom_job_card_id").$wrapper.closest(".form-layout").css({
            "filter": "blur(5px)",
            "pointer-events": "none",
            "opacity": "0.2"
        });
    } else {
        frm.set_df_property("custom_job_card_id", "hidden", 1);
        frm.set_df_property("custom_job_card_id", "reqd", 0);
        frm.set_df_property("is_return", "hidden", 1);
        frm.set_df_property("is_return", "read_only", 1);
        frm.set_df_property("return_against", "hidden", 1);
        frm.set_df_property("return_against", "reqd", 0);
        frm.set_df_property("return_against", "read_only", 0);
        frm.set_df_property("customer", "hidden", 0);
        frm.set_df_property("customer", "read_only", 0);
        frm.set_value("custom_job_card_id", "");
        frm.set_value("is_return", 0);
        frm.set_value("return_against", "");
        frm.set_value("customer", "");
    }
    frm.refresh_field("custom_job_card_id");
    frm.refresh_field("is_return");
    frm.refresh_field("return_against");
    frm.refresh_field("customer");
}

function show_return_delivery_note_modal(frm) {
    frappe.call({
        method: "autowings_app.api.get_enabled_delivery_note_types",
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const deliveryNoteTypes = r.message;
                const selectedType = deliveryNoteTypes.find(type => 
                    type.label === frm.doc.custom_delivery_note_label || type.name === frm.doc.custom_delivery_note_type
                );
                if (selectedType) {
                    let d = new frappe.ui.Dialog({
                        title: __("Return Delivery Note Details"),
                        fields: [
                            {
                                fieldtype: "Link",
                                fieldname: "job_card_id",
                                label: __("Job Card ID"),
                                options: "AW Job Card",
                                reqd: 1,
                                onchange: function() {
                                    if (d.get_value("job_card_id")) {
                                        frappe.call({
                                            method: "frappe.client.get",
                                            args: {
                                                doctype: "AW Job Card",
                                                name: d.get_value("job_card_id")
                                            },
                                            callback: function(r) {
                                                if (r.message) {
                                                    d.set_value("customer", r.message.customer);
                                                    d.set_value("customer_name", r.message.customer_name);
                                                    // Only include items with required_qty > 0
                                                    const items = (r.message.items || []).filter(item => (item.required_qty || 0) > 0);
                                                    const return_items = items.map(item => ({
                                                        item_code: item.item_code,
                                                        item_name: item.item_name,
                                                        delivery_note_id: item.delivery_note_id || "",
                                                        required_qty: item.required_qty || 0,
                                                        return_qty: 0
                                                    }));
                                                    d.original_return_items = return_items;
                                                    d.set_value("return_items", return_items);
                                                    if (d.fields_dict.return_items) {
                                                        d.fields_dict.return_items.df.data = return_items;
                                                        d.fields_dict.return_items.refresh();
                                                        applyTableFilters(d);
                                                    }
                                                } else {
                                                    d.set_value("customer", "");
                                                    d.set_value("customer_name", "");
                                                    d.set_value("return_items", []);
                                                    d.original_return_items = [];
                                                    if (d.fields_dict.return_items) {
                                                        d.fields_dict.return_items.df.data = [];
                                                        d.fields_dict.return_items.refresh();
                                                    }
                                                }
                                            },
                                            error: function(err) {
                                                frappe.msgprint(__("Error fetching AW Job Card details: {0}", [err.message]));
                                                d.set_value("customer", "");
                                                d.set_value("customer_name", "");
                                                d.set_value("return_items", []);
                                                d.original_return_items = [];
                                                if (d.fields_dict.return_items) {
                                                    d.fields_dict.return_items.df.data = [];
                                                    d.fields_dict.return_items.refresh();
                                                }
                                            }
                                        });
                                    } else {
                                        d.set_value("customer", "");
                                        d.set_value("customer_name", "");
                                        d.set_value("return_items", []);
                                        d.original_return_items = [];
                                        if (d.fields_dict.return_items) {
                                            d.fields_dict.return_items.df.data = [];
                                            d.fields_dict.return_items.refresh();
                                        }
                                    }
                                }
                            },

                            // {
                            //     fieldtype: "Date",
                            //     fieldname: "return_date",
                            //     label: __("Return Date"),
                            //     default: frappe.datetime.get_today(),
                            //     reqd: 1,
                            //     onchange: function() {
                            //         const returnDate = d.get_value("return_date");
                            //         if (returnDate && !frappe.datetime.validate_date(returnDate)) {
                            //             frappe.msgprint(__("Please enter a valid return date."));
                            //             d.set_value("return_date", frappe.datetime.get_today());
                            //         }
                            //     }
                            // },
                

                            // add column break
                            {
                                fieldtype: "Column Break"
                            },
                
                            {
                                fieldtype: "Data",
                                fieldname: "customer",
                                label: __("Customer"),
                                depends_on: "eval:doc.job_card_id",
                                read_only: 1
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "customer_name",
                                label: __("Customer Name"),
                                depends_on: "eval:doc.job_card_id",
                                read_only: 1
                            },
                               {
                                fieldtype: "Column Break"
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "naming_series",
                                label: __("Naming Series"),
                                default: selectedType.naming_series,
                                read_only: 1
                            },
                            {
                                fieldtype: "Data",
                                fieldname: "warehouse",
                                label: __("Warehouse"),
                                default: selectedType.warehouse || "",
                                // read_only: 1
                            },
                            {
                                fieldtype: "Section Break",
                                label: "",
                                depends_on: "eval:doc.job_card_id"
                            },
                            {
                                fieldtype: "Column Break"
                            },
                            {
                                fieldtype: "Link",
                                fieldname: "item",
                                label: __("Item Search"),
                                depends_on: "eval:doc.job_card_id",
                                options: "Item",
                                get_query: function() {
                                    return {
                                        filters: {
                                            name: ["in", d.original_return_items.map(item => item.item_code)]
                                        }
                                    };
                                }
                            },
                            
                            {
                                fieldtype: "Column Break"
                            },
                            {
                                fieldtype: "Float",
                                fieldname: "return_qty",
                                label: __("Return Qty"),
                                // reqd: 1,
                                default: 0,
                                depends_on: "eval:doc.item"
                            },
                            
                            {
                                fieldtype: "Button",
                                fieldname: "update_return_items",
                                label: __("Update Return Items"),
                                depends_on: "eval:doc.item",
                                click: function() {
                                    const item_code = d.get_value("item");
                                    const return_qty_input = flt(d.get_value("return_qty"));
                                    if (!item_code || isNaN(return_qty_input) || return_qty_input <= 0) {
                                        frappe.msgprint(__("Please select an item and enter a positive return quantity."));
                                        return;
                                    }
                                    const items_to_modify = (d.original_return_items || []).filter(item => item.item_code === item_code);
                                    if (items_to_modify.length === 0) {
                                        frappe.msgprint(__("Selected item not found in the list."));
                                        return;
                                    }
                                    const total_available_qty = items_to_modify.reduce((sum, item) => sum + flt(item.required_qty), 0);
                                    if (return_qty_input > total_available_qty) {
                                        frappe.msgprint(__("Return quantity ({0}) cannot exceed total available quantity ({1}) for item {2}.", [return_qty_input, total_available_qty, item_code]));
                                        d.set_value("return_qty", total_available_qty);
                                        return;
                                    }
                                    let remaining_qty = return_qty_input;
                                    items_to_modify.forEach(item => item.return_qty = 0);
                                    for (let item of items_to_modify) {
                                        if (remaining_qty <= 0) break;
                                        const available = flt(item.required_qty);
                                        item.return_qty = Math.min(remaining_qty, available);
                                        remaining_qty -= item.return_qty;
                                    }
                                    d.set_value("return_items", d.original_return_items);
                                    applyTableFilters(d);
                                    // Clear item and return_qty fields after update
                                    d.set_value("item", null);
                                    d.set_value("return_qty", null);
                                }
                            },
                            
                            {
                                fieldtype: "Section Break",
                                label: __("Return Items"),
                                depends_on: "eval:doc.job_card_id"
                                // add top margin above this
                            },
                            // {
                            //     fieldtype: "HTML",
                            //     fieldname: "item_filter_controls",
                            //     depends_on: "eval:doc.job_card_id",
                            //     label: __("Filter Items"),
                            //     read_only: 1,
                            //     options: `
                            //         <div class="row" style="margin-bottom: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
                            //         
                            //             <div class="col-sm-3">
                            //                 <input type="text" class="form-control item-filter" data-fieldname="item_code" placeholder="${__('Filter Item Code')}">
                            //             </div>
                            //             <div class="col-sm-3">
                            //                 <input type="text" class="form-control item-filter" data-fieldname="item_name" placeholder="${__('Filter Item Name')}">
                            //             </div>
                            //             <div class="col-sm-3">
                            //                 <input type="text" class="form-control item-filter" data-fieldname="delivery_note_id" placeholder="${__('Filter Delivery Note ID')}">
                            //             </div>
                            //         </div>
                            //     `
                            // },
                            {
                                fieldtype: "Table",
                                fieldname: "return_items",
                                // label: __("Return Items"),
                                depends_on: "eval:doc.job_card_id",
                                cannot_add_rows: true,
                                cannot_delete_rows: true,
                                fields: [
                                    {
                                        fieldtype: "Data",
                                        fieldname: "item_code",
                                        label: __("Item Code"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Data",
                                        fieldname: "item_name",
                                        label: __("Item Name"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Data",
                                        fieldname: "delivery_note_id",
                                        label: __("Delivery Note ID"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Float",
                                        fieldname: "required_qty",
                                        label: __("Available Qty"),
                                        read_only: 1,
                                        in_list_view: 1
                                    },
                                    {
                                        fieldtype: "Float",
                                        fieldname: "return_qty",
                                        label: __("Return Qty"),
                                        reqd: 1,
                                        in_list_view: 1,
                                        onchange: function() {
                                            const items = d.get_value("return_items") || [];
                                            items.forEach(item => {
                                                if (item.return_qty < 0) {
                                                    frappe.msgprint(__("Return quantity cannot be negative for item {0}", [item.item_code]));
                                                    item.return_qty = 0;
                                                    d.fields_dict.return_items.refresh();
                                                }
                                            });
                                        }
                                    }
                                ],
                                in_place_edit: true,
                                data: [],
                                get_data: function() {
                                    return d.get_value("return_items") || [];
                                }
                            }
                        ],
                        primary_action_label: __("Next"),
                        primary_action: function() {
                            const return_items = (d.get_value("return_items") || []).filter(item => item.return_qty > 0);
                            if (return_items.length === 0) {
                                frappe.msgprint(__("No items selected for return."));
                                return;
                            }
                            const summary_dialog = new frappe.ui.Dialog({
                                title: __("Return Summary"),
                                fields: [
                                    {
                                        fieldtype: "Table",
                                        fieldname: "return_summary",
                                        label: __("Return Item Summary"),
                                        cannot_add_rows: true,
                                        cannot_delete_rows: true,
                                        in_place_edit: false,
                                        fields: [
                                            {
                                                fieldtype: "Data",
                                                fieldname: "item_code",
                                                label: __("Item Code"),
                                                read_only: 1,
                                                in_list_view: 1
                                            },
                                            {
                                                fieldtype: "Data",
                                                fieldname: "delivery_note_id",
                                                label: __("Delivery Note ID"),
                                                read_only: 1,
                                                in_list_view: 1
                                            },
                                            {
                                                fieldtype: "Float",
                                                fieldname: "return_qty",
                                                label: __("Return Qty"),
                                                read_only: 1,
                                                in_list_view: 1
                                            }
                                        ],
                                        data: return_items.map(item => ({
                                            item_code: item.item_code,
                                            delivery_note_id: item.delivery_note_id,
                                            return_qty: item.return_qty
                                        }))
                                    }
                                ],
                                primary_action_label: __("Confirm"),
                                primary_action: function() {
                                    const summary_items = summary_dialog.get_value("return_summary") || [];
                                    if (summary_items.length === 0) {
                                        frappe.msgprint(__("No return items found."));
                                        return;
                                    }
                                    // Group items by delivery_note_id
                                    const grouped_by_dn = {};
                                    summary_items.forEach(item => {
                                        if (!grouped_by_dn[item.delivery_note_id]) {
                                            grouped_by_dn[item.delivery_note_id] = [];
                                        }
                                        grouped_by_dn[item.delivery_note_id].push({
                                            item_code: item.item_code,
                                            item_name: item.item_name,
                                            qty: -1 * flt(item.return_qty),
                                            warehouse: selectedType.warehouse
                                        });
                                    });
                                    // Create a promise chain to ensure sequential creation
                                    let dn_ids = Object.keys(grouped_by_dn);
                                    let created_dn_names = [];
                                    function createNextDN(index) {
                                        if (index >= dn_ids.length) {
                                            // All done
                                            let msg = '';
                                            if (created_dn_names.length > 0) {
                                                msg = __('Created Return Delivery Notes:') + '<br>' + created_dn_names.map(name => `<a href="/app/delivery-note/${name}" target="_blank">${name}</a>`).join(', ');
                                            } else {
                                                msg = __('No Return Delivery Notes were created.');
                                            }
                                            frappe.msgprint({
                                                title: __('Return Delivery Note Creation'),
                                                message: msg,
                                                indicator: 'green'
                                            });
                                            summary_dialog.hide();
                                            d.hide();
                                            frm.get_field("custom_job_card_id").$wrapper.closest(".form-layout").css({
                                                "filter": "none",
                                                "pointer-events": "auto",
                                                "opacity": "1"
                                            });
                                            frm.reload_doc();
                                            window.deliveryNoteTypeDialogActive = false;
                                            fadeOutAndCloseDeliveryNoteModal();
                                            summary_dialog.$wrapper.remove();
                                            // Optionally, redirect after a short delay
                                            setTimeout(function() {
                                                window.location.href = "/app/delivery-note?is_return=1";
                                            }, 1500);
                                            return;
                                        }
                                        let dn_id = dn_ids[index];
                                        let items = grouped_by_dn[dn_id];
                                        const doc = {
                                            doctype: "Delivery Note",
                                            is_return: 1,
                                            return_against: dn_id,
                                            custom_delivery_note_type: "Job Card Return",
                                            custom_job_card_id: d.get_value("job_card_id"),
                                            customer: d.get_value("customer"),
                                            naming_series: selectedType.naming_series,
                                            set_warehouse: selectedType.warehouse,
                                            docstatus: 0, // Always draft, will submit in backend
                                            items: items
                                        };
                                        frappe.call({
                                            method: "autowings_app.api.create_and_submit_return_delivery_note",
                                            args: { doc_json: JSON.stringify(doc) },
                                            freeze: true,
                                            freeze_message: __('Creating and submitting Return Delivery Note...')
                                        }).then((r) => {
                                            if (r && r.message) {
                                                created_dn_names.push(r.message);
                                            }
                                            createNextDN(index + 1);
                                        }).catch(() => {
                                            // Continue with next even if error
                                            createNextDN(index + 1);
                                        });
                                    }
                                    createNextDN(0);
                                }
                            });
                            summary_dialog.show();
                            summary_dialog.$wrapper.css({
                                "position": "fixed",
                                "top": "0",
                                "left": "0",
                                "width": "100%",
                                "height": "100vh",
                                "z-index": "1060",
                                "background": "rgba(0, 0, 0, 0.8)",
                                "display": "flex",
                                "justify-content": "center",
                                "align-items": "center"
                            });
                            summary_dialog.$body.css({
                                "height": "90%",
                                "max-height": "800px",
                                "display": "flex",
                                "flex-direction": "column",
                                "justify-content": "flex-start",
                                "align-items": "stretch",
                                "overflow-y": "auto",
                                "padding": "20px"
                            });
                            summary_dialog.$wrapper.find(".modal-dialog").css({
                                "width": "80%",
                                "max-width": "1000px",
                                "margin": "0 auto"
                            });
                            summary_dialog.$wrapper.find(".modal-content").css({
                                "width": "100%",
                                "height": "100%",
                                "overflow-y": "auto"
                            });
                            summary_dialog.get_close_btn().hide();
                        }
                    });
                    // d.current_filters = {};
                    // d.show();
                    // // Ensure filter inputs exist before binding events
                    // setTimeout(function() {
                    //     d.$wrapper.find('.item-filter').off('input').on('input', function() {
                    //         const fieldname = $(this).data('fieldname');
                    //         d.current_filters[fieldname] = $(this).val().toLowerCase();
                    //         applyTableFilters(d);
                    //     });
                    // }, 300); // 300ms delay to ensure DOM is ready
                    d.show();
                    d.$wrapper.css({
                        "position": "fixed",
                        "top": "0",
                        "left": "0",
                        "width": "100%",
                        "height": "100vh",
                        "z-index": "1060",
                        "background": "rgba(0, 0, 0, 0.8)",
                        "display": "flex",
                        "justify-content": "center",
                        "align-items": "center"
                    });
                    d.$body.css({
                        "height": "90%",
                        "max-height": "800px",
                        "display": "flex",
                        "flex-direction": "column",
                        "justify-content": "flex-start",
                        "align-items": "stretch",
                        "overflow-y": "auto",
                        "padding": "20px"
                    });
                    d.$wrapper.find(".modal-dialog").css({
                        "width": "80%",
                        "max-width": "1200px",
                        "margin": "0 auto"
                    });
                    d.$wrapper.find(".modal-content").css({
                        "width": "100%",
                        "height": "100%",
                        "overflow-y": "auto"
                    });
                    d.get_close_btn().hide();
                } else {
                    frappe.msgprint(__("No configuration found for Delivery Note type: {0}", [frm.doc.custom_delivery_note_type]));
                }
            }
        },
        error: function(err) {
            frappe.msgprint(__("Error fetching Delivery Note type details: {0}", [err.message]));
        }
    });
}

function applyTableFilters(dialog_instance) {
    let filtered_items = dialog_instance.original_return_items || [];
    const filters = dialog_instance.current_filters || {};
    for (const fieldname in filters) {
        const filter_value = filters[fieldname];
        if (filter_value) {
            filtered_items = filtered_items.filter(item => 
                String(item[fieldname]).toLowerCase().includes(filter_value)
            );
        }
    }
    dialog_instance.set_value("return_items", filtered_items);
    if (dialog_instance.fields_dict.return_items) {
        dialog_instance.fields_dict.return_items.df.data = filtered_items;
        dialog_instance.fields_dict.return_items.refresh();
    }
}

function fadeOutAndCloseDeliveryNoteModal() {
    let wrapper = document.getElementById("delivery-note-type-overlay");
    if (wrapper) {
        wrapper.style.opacity = "0";
        setTimeout(() => {
            wrapper.remove();
            window.deliveryNoteTypeDialogActive = false;
        }, 300);
    } else {
        window.deliveryNoteTypeDialogActive = false;
    }
}

function show_item_selection_modal(frm) {
    if (frm.doc.custom_delivery_note_type !== "Job Card Return" && frm.doc.custom_job_card_id && frm.doc.return_against) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "AW Job Card",
                name: frm.doc.custom_job_card_id
            },
            callback: function(r) {
                if (r.message) {
                    let job_card_items = r.message.items
                        .filter(item => item.delivery_note_id && item.required_qty > 0)
                        .map(item => ({
                            item_code: item.item_code,
                            item_name: item.item_name,
                            required_qty: item.required_qty
                        }));
                    if (!job_card_items.length) {
                        frappe.msgprint(__("No items with required quantity > 0 found for Delivery Note {0} in Job Card {1}", [frm.doc.return_against, frm.doc.custom_job_card_id]));
                        return;
                    }
                    frappe.msgprint(__("Items are available for return from Delivery Note {0}, but no further action is configured.", [frm.doc.return_against]));
                }
            }
        });
    }
}


