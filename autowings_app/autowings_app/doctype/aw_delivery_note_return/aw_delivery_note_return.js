// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("AW Delivery Note Return", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('AW Delivery Note Return', {
    job_card_id: function(frm) {
        if (frm.doc.job_card_id) {
            // Fetch the AW Job Card document
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'AW Job Card',
                    name: frm.doc.job_card_id
                },
                callback: function(response) {
                    if (response.message) {
                        let job_card = response.message;
                        // Clear existing items in the table
                        frm.clear_table('items');
                        
                        // Iterate through the items in AW Job Card
                        $.each(job_card.items || [], function(i, item) {
                            let row = frm.add_child('items');
                            row.item_code = item.item_code;
                            row.item_name = item.item_name;
                            row.source_warehouse = item.source_warehouse;
                            row.uom = item.uom;
                            row.item_group = item.item_group;
                            row.delivery_note_id = item.delivery_note_id;
                            row.stock_uom = item.stock_uom;
                            row.description = item.description;
                            row.required_qty = item.required_qty;
                            row.delivered_qty = item.delivered_qty;
                            row.return_qty = item.return_qty;
                            row.return_against_delivery_note = item.return_against_delivery_note;
                            row.return_delivery_note_id = item.return_delivery_note_id;
                        });
                        
                        // Refresh the items table to reflect changes
                        frm.refresh_field('items');
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('AW Delivery Note Return', {
    item: function(frm) {
        if (frm.doc.item) {
            // Initialize variable to store the sum of required_qty
            let total_required_qty = 0;
            
            // Iterate through the items table
            $.each(frm.doc.items || [], function(i, row) {
                if (row.item_code === frm.doc.item) {
                    total_required_qty += flt(row.required_qty);
                }
            });
            
            // Set the summed value in available_qty field
            frm.set_value('available_qty', total_required_qty);
        } else {
            // If no item is selected, reset available_qty to 0
            frm.set_value('available_qty', 0);
        }
    }
});

// Client Script for AW Delivery Note Return
// DocType: AW Delivery Note Return

frappe.ui.form.on('AW Delivery Note Return', {
    // This function is triggered when the 'return_qty' field in the main document is changed.
    return_qty: function(frm) {
        let total_return_qty_entered = frm.doc.return_qty;
        let available_qty = frm.doc.available_qty;

        // --- Step 1: Validate the main document's return_qty against available_qty ---

        // Ensure return quantity is not negative
        if (total_return_qty_entered < 0) {
            frappe.msgprint(__('Return Quantity cannot be negative. Please enter a non-negative value.'));
            frm.set_value('return_qty', 0); // Reset to 0
            return; // Stop execution if invalid
        }

        // Check if the entered return quantity exceeds the available quantity
        if (total_return_qty_entered > available_qty) {
            frappe.msgprint(__('Return Quantity ({0}) cannot be greater than Available Quantity ({1}). Adjusting to available quantity.', [total_return_qty_entered, available_qty]));
            frm.set_value('return_qty', available_qty); // Reset to available_qty
            total_return_qty_entered = available_qty; // Use the corrected value for distribution
        }

        // Calculate the current total return quantity already set in the child table
        let current_total_in_child_table = 0;
        frm.doc.items.forEach(function(item) {
            // Ensure item.return_qty is treated as a number, defaulting to 0 if undefined/null
            current_total_in_child_table += (item.return_qty || 0);
        });

        // Determine the net difference between the desired total (from main field)
        // and the current total in the child table.
        let net_change_needed = total_return_qty_entered - current_total_in_child_table;

        // --- Step 2: Distribute or remove quantity from child table items based on net_change_needed ---

        if (net_change_needed > 0) {
            // If net_change_needed is positive, we need to add more quantity to child items.
            let quantity_to_add = net_change_needed;

            // Iterate through items to add quantity sequentially
            frm.doc.items.forEach(function(item) {
                if (quantity_to_add > 0) {
                    let delivered_qty_for_item = item.delivered_qty || 0;
                    let existing_return_qty_for_item = item.return_qty || 0;

                    // Calculate how much more quantity can be added to this specific item
                    // without exceeding its delivered quantity.
                    let capacity_to_add = delivered_qty_for_item - existing_return_qty_for_item;

                    if (capacity_to_add > 0) {
                        // Assign the minimum of the remaining quantity to add or the item's capacity
                        let qty_to_assign_to_this_item = Math.min(quantity_to_add, capacity_to_add);

                        // Update the 'return_qty' for the current child item by adding to its existing value
                        frappe.model.set_value(item.doctype, item.name, 'return_qty', existing_return_qty_for_item + qty_to_assign_to_this_item);

                        // Reduce the remaining quantity that still needs to be added
                        quantity_to_add -= qty_to_assign_to_this_item;
                    }
                }
            });

            // Optional warning if not all desired quantity could be assigned (e.g., due to insufficient delivered_qty across items)
            if (quantity_to_add > 0) {
                frappe.msgprint(__('Warning: Not all entered Return Quantity could be fully assigned to items. Some items might not have sufficient remaining delivered quantity.', 'orange'));
            }

        } else if (net_change_needed < 0) {
            // If net_change_needed is negative, we need to remove quantity from child items.
            let quantity_to_remove = Math.abs(net_change_needed); // Use absolute value for removal amount

            // Iterate in reverse order to remove quantity from later items first.
            // This often feels more natural for users when reducing a total.
            for (let i = frm.doc.items.length - 1; i >= 0; i--) {
                let item = frm.doc.items[i];
                if (quantity_to_remove > 0) {
                    let existing_return_qty_for_item = item.return_qty || 0;

                    // Calculate how much quantity can be removed from this item
                    let qty_to_remove_from_this_item = Math.min(quantity_to_remove, existing_return_qty_for_item);

                    // Update the 'return_qty' for the current child item by subtracting
                    frappe.model.set_value(item.doctype, item.name, 'return_qty', existing_return_qty_for_item - qty_to_remove_from_this_item);

                    // Reduce the remaining quantity that still needs to be removed
                    quantity_to_remove -= qty_to_remove_from_this_item;
                }
            }

            // Optional warning if not all excess quantity could be removed
            if (quantity_to_remove > 0) {
                frappe.msgprint(__('Warning: Could not remove all excess Return Quantity from items. Check child table values.', 'orange'));
            }
        }
        // If net_change_needed is 0, it means the sum in the child table already matches the main field, so no action is taken.

        // Refresh the 'items' child table to reflect the updated 'return_qty' values in the UI.
        frm.refresh_field('items');
    }
});
