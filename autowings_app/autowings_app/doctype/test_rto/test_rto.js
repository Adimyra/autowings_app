frappe.ui.form.on('Test RTO', {
    refresh: function(frm) {
        frm.add_custom_button(__('Attach Image'), function() {
            const attach_btn = frm.fields_dict.image_upload.$wrapper.find('.btn-attach');
            if (attach_btn.length) {
                attach_btn.click();
                frappe.after_ajax(() => {
                    frappe.ui.form.on('File', {
                        after_save: function() {
                            frm.save();
                        }
                    });
                });
            }
        });
    }
});