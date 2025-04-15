// Copyright (c) 2025, Adimyra Systems Private Limited and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Autowings Naming Series", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Autowings Naming Series', {
    onload: function(frm) {
        console.log("Autowings Naming Series form loaded");  // Debug: Confirm script is running
        frappe.call({
            method: "autowings_app.api.get_sales_invoice_series",
            callback: function(r) {
                console.log("Response from get_sales_invoice_series:", r);  // Debug: Check response
                if (r.message && Array.isArray(r.message) && r.message.length > 0) {
                    let options = r.message.join("\n");  // Convert list to newline-separated string
                    console.log("Setting options for sales_naming_series:", options);  // Debug: Check options

                    // Use the same approach as User Privileges Settings
                    frm.fields_dict['autowings_naming_series_configuration'].grid.fields_map['sales_naming_series'].options = options;
                    
                    // Refresh the child table to reflect the changes
                    frm.refresh_field('autowings_naming_series_configuration');
                    console.log("Child table refreshed with new options");  // Debug: Confirm refresh
                } else {
                    console.log("No valid naming series received:", r.message);  // Debug: If no options
                }
            },
            error: function(err) {
                console.log("Error calling get_sales_invoice_series:", err);  // Debug: Catch errors
            }
        });
    }
});