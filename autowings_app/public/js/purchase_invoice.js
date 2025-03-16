frappe.ui.form.on("Purchase Invoice", {
    onload: function(frm) {
        check_and_show_purchase_type_modal(frm);
        show_vin_buttons(frm);
    },

    refresh: function(frm) {
        check_and_show_purchase_type_modal(frm);
        show_vin_buttons(frm);
    },

    custom_purchase_type: function(frm) {
        // Make the custom_purchase_type field read-only after selection
        frm.set_df_property("custom_purchase_type", "read_only", 1);

        // Toggle purchase vehicle details section
        toggle_purchase_vehicle_fields(frm);
        show_vin_buttons(frm);
    },

    validate: function(frm) {
        // Prevent submission if `custom_purchase_type` is not set
        if (!frm.doc.custom_purchase_type) {
            enforce_purchase_type_selection(frm);
            frappe.throw(__("Please select a Purchase Type (Spare or Vehicle) before saving."));
        }

        // Ensure VIN child table is mandatory if "Vehicle" is selected
        if (frm.doc.custom_purchase_type === "Vehicle" && (!frm.doc.custom_vin || frm.doc.custom_vin.length === 0)) {
            frappe.throw(__("VIN details are required in the `custom_vin` table when purchasing a Vehicle."));
        }
    },

    custom_vin: function(frm) {
        sync_vin_to_items(frm);
    }
});

// **Check & Show Modal If `custom_purchase_type` is Not Set**
function check_and_show_purchase_type_modal(frm) {
    if (frm.is_new() && !frm.doc.custom_purchase_type) {
        enforce_purchase_type_selection(frm);
    }
}

// **Enforce Purchase Type Selection Modal**
function enforce_purchase_type_selection(frm) {
    if (window.purchaseTypeDialogActive) return; // Prevent multiple popups
    window.purchaseTypeDialogActive = true;

    let wrapper = document.createElement("div");
    wrapper.id = "purchase-type-overlay";
    wrapper.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; 
            position: fixed; top: 0; left: 0; background: rgba(0, 0, 0, 0.5); z-index: 1050;">
            
            <div id="purchase-type-modal" style="background: white; padding: 30px; border-radius: 10px; 
                text-align: center; box-shadow: 0px 0px 20px rgba(0,0,0,0.2);">
                
              <h4 style="margin-bottom: 20px;">What do you want to purchase?</h4>
                <div style="display: flex; justify-content: center; gap: 40px; padding-top: 10px; padding-bottom: 10px;">
                    <button id="purchase_spare" class="custom-button"
                        style="background: #6c757d; color: white; padding: 8px 20px; font-size: 18px; 
                        border: none; border-radius: 10px; cursor: pointer;">
                        Spare
                    </button>
                    <button id="purchase_vehicle" class="custom-button"
                        style="background: #000; color: white; padding: 8px 20px; font-size: 18px; 
                        border: none; border-radius: 10px; cursor: pointer;">
                        Vehicle
                    </button>
                </div>


            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    document.getElementById("purchase_spare").addEventListener("click", function() {
        frm.set_value("custom_purchase_type", "Spare");
        toggle_purchase_vehicle_fields(frm);
        fadeOutAndClosePurchaseModal();
    });

    document.getElementById("purchase_vehicle").addEventListener("click", function() {
        frm.set_value("custom_purchase_type", "Vehicle");
        toggle_purchase_vehicle_fields(frm);
        fadeOutAndClosePurchaseModal();
    });
}

// **Smooth Fade-out Effect Before Closing Modal**
function fadeOutAndClosePurchaseModal() {
    document.getElementById("purchase-type-overlay").remove();
    window.purchaseTypeDialogActive = false; // Reset flag after selection
}

// **Hide/Show Vehicle Details Section & Make VIN Table Mandatory When "Vehicle" is Selected**
function toggle_purchase_vehicle_fields(frm) {
    let is_vehicle = frm.doc.custom_purchase_type === "Vehicle";

    // Hide `custom_purchase_vehicle_details` when "Spare" is selected
    frm.toggle_display("custom_purchase_vehicle_details", is_vehicle);

    // Make `custom_vin` table mandatory when "Vehicle" is selected
    // frm.toggle_reqd("custom_vin", is_vehicle);
}

// **Sync `custom_vin` Table Data to `items` Table**
function sync_vin_to_items(frm) {
    if (frm.doc.custom_purchase_type !== "Vehicle") return;

    let item_qty = {};
    let item_serials = {};

    // Collect VIN data
    frm.doc.custom_vin.forEach(vin => {
        if (!item_qty[vin.item]) {
            item_qty[vin.item] = 0;
            item_serials[vin.item] = [];
        }
        item_qty[vin.item] += 1;
        item_serials[vin.item].push(vin.chassis_number);
    });

    // Clear `items` table before syncing
    frm.clear_table("items");

    // Add items with correct quantity and serial_no
    Object.keys(item_qty).forEach(item_code => {
        let item_row = frm.add_child("items");
        item_row.item_code = item_code;
        item_row.qty = item_qty[item_code];
        item_row.serial_no = item_serials[item_code].join("\n"); // Multiple serial numbers
    });

    frm.refresh_field("items");
}

// **Show VIN Download/Upload Buttons inside "Autowings" Menu**
// function show_vin_buttons(frm) {
//     if (frm.doc.custom_purchase_type === "Vehicle") {
//         frm.add_custom_button(__('Update VIN Data'), function() {
//             open_vin_modal(frm);
//         }, __("Autowings"));
//     }
// }
// ✅ Show "Update VIN Data" button directly (not under Autowings menu)
function show_vin_buttons(frm) {
    if (frm.doc.custom_purchase_type === "Vehicle") {
        frm.add_custom_button(__('Update VIN Data'), function() {
            open_vin_modal(frm);
        });
    }
}


// **Open Modal for VIN Upload & Download**
function open_vin_modal(frm) {
    let d = new frappe.ui.Dialog({
        title: __("Update VIN Data"),
        fields: [
            {
                label: __("Download VIN CSV"),
                fieldname: "download_vin",
                fieldtype: "Button",
                click: function() {
                    download_vin_csv(frm);
                }
            },
            {
                label: __("Upload VIN CSV"),
                fieldname: "upload_vin",
                fieldtype: "Attach",
                reqd: 1
            }
        ],
        primary_action_label: __("Upload & Update"),
        primary_action(values) {
            if (values.upload_vin) {
                update_vin_data(frm, values.upload_vin);
            }
            d.hide();
        }
    });

    d.show();
}

// **Download Existing VIN Data as CSV**
function download_vin_csv(frm) {
    frappe.call({
        method: "autowings_app.custom_scripts.purchase_invoice.download_vin_csv",
        args: { docname: frm.doc.name },
        callback: function(r) {
            if (r.message) {
                let csvData = r.message;
                let blob = new Blob([csvData], { type: "text/csv" });
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement("a");
                a.setAttribute("href", url);
                a.setAttribute("download", `VIN_Details_${frm.doc.name}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }
    });
}

function update_vin_data(frm, file_url) {
    frappe.call({
        method: "autowings_app.custom_scripts.purchase_invoice.upload_vin_csv",
        args: {
            doc: JSON.stringify(frm.doc),  // ✅ Pass full document as JSON string
            file_url: file_url
        },
        callback: function(r) {
            if (!r.exc) {
                frappe.msgprint(__("VIN data updated successfully."));
                
                // Update the form with new VIN data without requiring a save
                frappe.model.sync(r.message.doc);
                frm.refresh();
            }
        }
    });
}

// for update items
