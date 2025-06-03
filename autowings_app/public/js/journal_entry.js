frappe.ui.form.on("Journal Entry", {
	refresh: function(frm) {
		frm.remove_custom_button(__("Quick Entry"));
	}
});



frappe.ui.form.on('Journal Entry', {
    refresh: function(frm) {
        // Check if the document is new
        if (frm.doc.__islocal) {
            // Add custom button "Add Accounts"
            frm.add_custom_button(__("Quick Entry"), function() {
                // Fetch company abbreviation
                frappe.db.get_value('Company', frm.doc.company, 'abbr', function(r) {
                    let company_abbr = r.abbr || 'A'; // Fallback to 'A' if abbr not found
                    // Create a new dialog (modal)
                    let d = new frappe.ui.Dialog({
                        title: 'Add Accounts',
                        fields: [
                            {
                                label: 'Debit Party Type',
                                fieldname: 'debit_party_type',
                                fieldtype: 'Select',
                                options: ['Customer', 'Supplier', 'Financer'],
                                reqd: 1,
                                onchange: function() {
                                    // Clear Debit Party Name field when Debit Party Type changes
                                    d.set_value('debit_party_name', '');
                                    // Set options for Debit Party Name based on Debit Party Type
                                    let debit_party_type = d.get_value('debit_party_type');
                                    if (debit_party_type === 'Customer') {
                                        d.fields_dict.debit_party_name.df.options = 'Customer';
                                        d.fields_dict.debit_party_name.df.filters = {};
                                    } else if (debit_party_type === 'Supplier') {
                                        d.fields_dict.debit_party_name.df.options = 'Supplier';
                                        d.fields_dict.debit_party_name.df.filters = {};
                                    } else if (debit_party_type === 'Financer') {
                                        d.fields_dict.debit_party_name.df.options = 'Customer';
                                        d.fields_dict.debit_party_name.df.filters = {'customer_group': 'Financer'};
                                    }
                                    d.fields_dict.debit_party_name.refresh();
                                }
                            },
                            {
                                label: 'Debit Party Name',
                                fieldname: 'debit_party_name',
                                fieldtype: 'Link',
                                options: '',
                                depends_on: 'eval:doc.debit_party_type',
                                reqd: 1
                            },
                            {
                                label: 'Credit Party Type',
                                fieldname: 'credit_party_type',
                                fieldtype: 'Select',
                                options: ['Customer', 'Supplier', 'Financer'],
                                reqd: 1,
                                onchange: function() {
                                    // Clear Credit Party Name field when Credit Party Type changes
                                    d.set_value('credit_party_name', '');
                                    // Set options for Credit Party Name based on Credit Party Type
                                    let credit_party_type = d.get_value('credit_party_type');
                                    if (credit_party_type === 'Customer') {
                                        d.fields_dict.credit_party_name.df.options = 'Customer';
                                        d.fields_dict.credit_party_name.df.filters = {'customer_group': ['!=', 'Financer']};
                                    } else if (credit_party_type === 'Supplier') {
                                        d.fields_dict.credit_party_name.df.options = 'Supplier';
                                        d.fields_dict.credit_party_name.df.filters = {};
                                    } else if (credit_party_type === 'Financer') {
                                        d.fields_dict.credit_party_name.df.options = 'Customer';
                                        d.fields_dict.credit_party_name.df.filters = {'customer_group': 'Financer'};
                                    }
                                    d.fields_dict.credit_party_name.refresh();
                                }
                            },
                            {
                                label: 'Credit Party Name',
                                fieldname: 'credit_party_name',
                                fieldtype: 'Link',
                                options: '',
                                depends_on: 'eval:doc.credit_party_type',
                                reqd: 1
                            },
                            {
                                label: 'Amount',
                                fieldname: 'amount',
                                fieldtype: 'Float',
                                reqd: 1
                            }
                        ],
                        primary_action_label: 'Add',
                        primary_action(values) {
                            // Add debit row to the accounts child table
                            let debit_row = frm.add_child('accounts');
                            debit_row.party_type = values.debit_party_type === 'Financer' ? 'Customer' : values.debit_party_type;
                            debit_row.party = values.debit_party_name;
                            debit_row.debit_in_account_currency = values.amount;
                            if (values.debit_party_type === 'Customer') {
                                debit_row.account = 'Debtors - ' + company_abbr;
                            } else if (values.debit_party_type === 'Supplier') {
                                debit_row.account = values.debit_party_name + ' Payable - ' + company_abbr;
                            } else if (values.debit_party_type === 'Financer') {
                                debit_row.account = values.debit_party_name + ' Receivable - ' + company_abbr;
                            }

                            // Add credit row to the accounts child table
                            let credit_row = frm.add_child('accounts');
                            credit_row.party_type = values.credit_party_type === 'Financer' ? 'Customer' : values.credit_party_type;
                            credit_row.party = values.credit_party_name;
                            credit_row.credit_in_account_currency = values.amount;
                            if (values.credit_party_type === 'Customer') {
                                credit_row.account = 'Debtors - ' + company_abbr;
                            } else if (values.credit_party_type === 'Supplier') {
                                credit_row.account = values.credit_party_name + ' Payable - ' + company_abbr;
                            } else if (values.credit_party_type === 'Financer') {
                                credit_row.account = values.credit_party_name + ' Receivable - ' + company_abbr;
                            }

                            // Refresh the accounts table
                            frm.refresh_field('accounts');

                            // Close the dialog
                            d.hide();

                            // Show confirmation modal
                            let confirm_dialog = new frappe.ui.Dialog({
                                title: 'Confirm Save',
                                fields: [
                                    {
                                        label: 'Do you want to save?',
                                        fieldname: 'save_confirmation',
                                        fieldtype: 'HTML',
                                        options: '<p>Do you want to save the Journal Entry?</p>'
                                    }
                                ],
                                primary_action_label: 'Yes',
                                primary_action() {
                                    // Save the form
                                    frm.save();
                                    confirm_dialog.hide();
                                },
                                secondary_action_label: 'No',
                                secondary_action() {
                                    // Close the confirmation dialog without saving
                                    confirm_dialog.hide();
                                }
                            });
                            confirm_dialog.show();
                        }
                    });
                    // Show the dialog
                    d.show();
                });
            });
        }
    }
});