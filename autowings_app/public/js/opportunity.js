frappe.ui.form.on('Opportunity', {
    refresh: function(frm) {
        if (frm.doc.opportunity_from === "Lead" && frm.doc.party_name) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Lead",
                    filters: { name: frm.doc.party_name },
                    fieldname: "custom_area"
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value("custom_area", r.message.custom_area || "");
                    }
                }
            });
        }
    }
});


frappe.ui.form.on('Opportunity', {
    refresh: function(frm) {
        frm.trigger('toggle_direct_opportunity_fields'); // Ensure correct state on refresh
    },

    custom_direct_opportunity: function(frm) {
        frm.trigger('toggle_direct_opportunity_fields'); // Handle checkbox toggle
    },

    toggle_direct_opportunity_fields: function(frm) {
        if (frm.doc.custom_direct_opportunity) {
            // Hide 'opportunity_from' and 'party_name' & remove mandatory
            frm.set_df_property('opportunity_from', 'reqd', 0);
            frm.set_df_property('opportunity_from', 'hidden', 1);
            frm.set_df_property('party_name', 'hidden', 1);

            // Show 'custom_first_name' and 'custom_last_name'
            frm.toggle_display(['custom_first_name', 'custom_last_name'], true);
        } else {
            // Show 'opportunity_from' and 'party_name', make mandatory again
            frm.set_df_property('opportunity_from', 'reqd', 1);
            frm.set_df_property('opportunity_from', 'hidden', 0);
            frm.set_df_property('party_name', 'hidden', 0);

            // Hide 'custom_first_name' and 'custom_last_name'
            frm.toggle_display(['custom_first_name', 'custom_last_name'], false);
        }
    }
});
