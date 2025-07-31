# import frappe
# from frappe import _

# def before_save_sales_invoice(doc, method):
#     """
#     Before saving a Sales Invoice, validate the taxes table and set included_in_print_rate
#     based on the is_this_tax_included_in_basic_rate from Autowings Naming Series.
#     """
#     # Check if custom_sub_sales_type is set
#     if not doc.custom_sub_sales_type:
#         frappe.throw(
#             _("Custom Sub Sales Type is not set. Please select a Sub Sales Type before saving."),
#             title=_("Missing Sub Sales Type")
#         )

#     # Fetch Autowings Naming Series configuration
#     naming_series_doc = frappe.get_single("Autowings Naming Series")
#     matching_config = None
#     for config in naming_series_doc.autowings_naming_series_configuration:
#         if config.sub_sales_type == doc.custom_sub_sales_type and config.enable:
#             matching_config = config
#             break

#     # If no matching configuration is found, throw an error
#     if not matching_config:
#         frappe.throw(
#             _("No enabled configuration found for Sub Sales Type '{0}' in Autowings Naming Series.").format(doc.custom_sub_sales_type),
#             title=_("Configuration Error")
#         )

#     # Check if taxes table is empty
#     if not doc.taxes or len(doc.taxes) == 0:
#         frappe.throw(
#             _("Taxes and Charges table is empty. Please add tax entries before saving."),
#             title=_("Missing Taxes")
#         )

#     # Update included_in_print_rate in the taxes child table
#     tax_included_value = matching_config.is_this_tax_included_in_basic_rate or 0
#     for tax_row in doc.taxes:
#         tax_row.included_in_print_rate = tax_included_value

#     # Recalculate taxes and totals to reflect changes
#     doc.calculate_taxes_and_totals()


import frappe
from frappe import _

def before_save_sales_invoice(doc, method):
    """
    Before saving a Sales Invoice, validate the taxes table, set included_in_print_rate,
    and automatically set Place of Supply, Tax Category, and Sales Taxes and Charges Template.
    """
    # Check if custom_sub_sales_type is set
    if not doc.custom_sub_sales_type:
        frappe.throw(
            _("Custom Sub Sales Type is not set. Please select a Sub Sales Type before saving."),
            title=_("Missing Sub Sales Type")
        )

    # Fetch Autowings Naming Series configuration
    naming_series_doc = frappe.get_single("Autowings Naming Series")
    matching_config = None
    for config in naming_series_doc.autowings_naming_series_configuration:
        if config.sub_sales_type == doc.custom_sub_sales_type and config.enable:
            matching_config = config
            break

    # If no matching configuration is found, throw an error
    if not matching_config:
        frappe.throw(
            _("No enabled configuration found for Sub Sales Type '{0}' in Autowings Naming Series.").format(doc.custom_sub_sales_type),
            title=_("Configuration Error")
        )

    # Automatically set Place of Supply, Tax Category, and Sales Taxes and Charges Template
    set_tax_details(doc)

    # Check if taxes table is empty
    if not doc.taxes or len(doc.taxes) == 0:
        frappe.throw(
            _("Taxes and Charges table is empty. Please add tax entries before saving."),
            title=_("Missing Taxes")
        )

    # Update included_in_print_rate in the taxes child table
    tax_included_value = matching_config.is_this_tax_included_in_basic_rate or 0
    for tax_row in doc.taxes:
        tax_row.included_in_print_rate = tax_included_value

    # Recalculate taxes and totals to reflect changes
    doc.calculate_taxes_and_totals()

def set_tax_details(doc):
    """
    Automatically set Place of Supply, Tax Category, and Sales Taxes and Charges Template based on customer details.
    """
    # Get customer details
    customer = frappe.get_doc("Customer", doc.customer)
    
    # Determine Place of Supply
    customer_state = None
    if customer.tax_id and len(customer.tax_id) >= 2:
        customer_state = customer.tax_id[:2]  # GSTIN-based state code
    elif customer.customer_primary_address:
        address = frappe.get_doc("Address", customer.customer_primary_address)
        customer_state = address.gst_state_number  # Directly use gst_state_number
    
    if not customer_state:
        frappe.throw(
            _("Customer state could not be determined. Please set a valid billing address or GSTIN for customer '{0}'.").format(doc.customer),
            title=_("Missing Customer State")
        )
    
    # Validate state code against the provided list
    valid_state_codes = {
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
        "21", "22", "23", "24", "26", "27", "29", "30", "31", "32",
        "33", "34", "35", "36", "37", "38", "96", "97"
    }
    if customer_state not in valid_state_codes:
        frappe.throw(
            _("Invalid state code '{0}' for customer '{1}'. Please use a valid GST state code.").format(customer_state, doc.customer),
            title=_("Invalid State Code")
        )
    
    # Set Place of Supply (e.g., "20-Jharkhand" format) with fallback
    state_name = frappe.get_value("State", customer_state, "state_name")
    if not state_name:
        # Fallback to a predefined state name mapping if not found in State doctype
        state_mapping = {
            "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
            "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
            "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
            "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
            "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
            "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
            "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra",
            "29": "Karnataka", "30": "Goa", "31": "Lakshadweep Islands", "32": "Kerala",
            "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands",
            "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh", "96": "Other Countries",
            "97": "Other Territory"
        }
        state_name = state_mapping.get(customer_state)
        if not state_name:
            frappe.throw(
                _("State code '{0}' is not found in the system or predefined mapping.").format(customer_state),
                title=_("Invalid State")
            )
    place_of_supply = f"{customer_state}-{state_name}"
    doc.place_of_supply = place_of_supply

    # Get company GSTIN state and abbreviation
    company_gstin = frappe.get_value("Company", doc.company, "gstin")
    company_abbr = frappe.get_value("Company", doc.company, "abbr") or "A"  # Fallback to 'A' if abbr is not found
    if company_gstin and len(company_gstin) >= 2:
        company_state_code = company_gstin[:2]
    else:
        frappe.throw(_("Company GSTIN is not configured properly."), title=_("Configuration Error"))

    # Determine Tax Category
    doc.tax_category = "In-State" if company_state_code == customer_state else "Out-State"

    # Set Sales Taxes and Charges Template dynamically based on company abbreviation
    template_map = {
        "In-State": f"Output GST In-state - {company_abbr}",
        "Out-State": f"Output GST Out-state - {company_abbr}"
    }
    doc.taxes_and_charges = template_map.get(doc.tax_category)
    if not doc.taxes_and_charges:
        frappe.throw(
            _("No suitable Sales Taxes and Charges Template found for Tax Category '{0}' with company abbreviation '{1}'.").format(doc.tax_category, company_abbr),
            title=_("Template Error")
        )

    # Refresh taxes if template is set
    if doc.taxes_and_charges:
        doc.set("taxes", [])  # Clear existing taxes
        doc.set_taxes()  # Populate taxes from the template