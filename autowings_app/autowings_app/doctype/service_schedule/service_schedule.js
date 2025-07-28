frappe.ui.form.on("Service Schedule", {
    refresh: function(frm) {
        frm.add_custom_button(__("Create Reminder Tasks"), function() {
            frappe.call({
                method: "autowings_app.autowings_app.doctype.service_schedule.service_schedule.create_service_reminder_tasks",
                args: {
                    is_manual: true,
                    doc_name: frm.doc.name
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint(r.message, __("Success"), () => {
                            frm.reload_doc(); // Reloads the form after closing the popup
                        });
                    }
                }
            });
        });
    }
});