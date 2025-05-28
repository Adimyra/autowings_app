app_name = "autowings_app"
app_title = "Autowings App"
app_publisher = "Adimyra Systems Private Limited"
app_description = "Automobile"
app_email = "faiyaz@adimyra.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []
app_include_js = [
    "/assets/autowings_app/js/lib/chart.min.js",
    "/assets/autowings_app/js/rto_registration_list.js",
    "/assets/autowings_app/js/serial_no.js",
    "/assets/autowings_app/js/customer.js"


    # "/assets/autowings_app/js/firebase_auth.js"
]
app_include_css = [
    "/assets/autowings_app/css/custom.css"
]

doc_events = {
    "Item": {
        "after_insert": "autowings_app.custom_scripts.item_price.create_buying_price"
    }
}



doctype_js = {
    "Opportunity": "public/js/opportunity.js",
    "Sales Order": "public/js/sales_order.js",
    "Sales Invoice": "public/js/sales_invoice.js",
    "Purchase Receipt": "public/js/purchase_receipt.js",
    "Purchase Invoice": "public/js/purchase_invoice.js",
    "Delivery Note": "public/js/delivery_note.js",
    "Supplier": "public/js/supplier.js",
    "Payment Entry": "public/js/payment_entry.js",
    "Serial No": "public/js/serial_no.js",
    "Customer": "public/js/customer.js"



}
override_doctype_class = {
    "Customer": "autowings_app.custom_scripts.customer_mobile_no_validation.Customer"
}

doc_events = {
# "Customer": {
#         "before_save": "autowings_app.custom_scripts.customer_mobile_no_validation.before_save"
#     },
    "Purchase Receipt": {
        "before_save": "autowings_app.custom_scripts.purchase_receipt.before_save",
        "before_submit": "autowings_app.custom_scripts.purchase_receipt.before_submit",
        "on_submit": "autowings_app.custom_scripts.purchase_receipt.on_submit"
    },
    "Delivery Note": {
        "before_save": "autowings_app.custom_scripts.delivery_note.before_save",
        "before_submit": "autowings_app.custom_scripts.delivery_note.before_submit"
    },
    # "Sales Invoice": {
    #     "before_submit": "autowings_app.custom_scripts.sales_invoice.before_submit"
    # # },
    # "Sales Invoice": {
    #     "before_submit": "autowings_app.custom_scripts.sales_invoice.before_submit",
    #     "on_submit": "autowings_app.custom_scripts.events.on_submit_sales_invoice"
    # },
    "Sales Invoice": {
        "before_submit": "autowings_app.custom_scripts.sales_invoice.before_submit",
        "after_insert": "autowings_app.custom_scripts.sales_invoice.after_insert_sales_invoice",
        "on_submit": "autowings_app.custom_scripts.sales_invoice.on_submit_sales_invoice",
        "on_cancel": "autowings_app.custom_scripts.sales_invoice.on_cancel_sales_invoice"
    },
     "Purchase Invoice": {
        "validate": "autowings_app.custom_scripts.serial_no_validation.validate_chassis_and_engine_number"
    },
    # "RTO Registration": {
    #     "on_update": "autowings_app.custom_scripts.events.on_update_rto_registration"
    # },
    # "Vehicle Insurance": {
    #     "on_update": "autowings_app.custom_scripts.events.on_update_vehicle_insurance"
    # },
    # "Vehicle Finance": {
    #     "on_update": "autowings_app.custom_scripts.events.on_update_vehicle_finance"
    # }
    # "RTO Registration": {
    #     "before_save": "autowings_app.custom_scripts.events.before_save_rto_registration",
    #     "on_update": "autowings_app.custom_scripts.events.on_update_rto_registration"
    # },
    # "Vehicle Insurance": {
    #     "before_save": "autowings_app.custom_scripts.events.before_save_vehicle_insurance",
    #     "on_update": "autowings_app.custom_scripts.events.on_update_vehicle_insurance"
    # },
    # "Vehicle Finance": {
    #     "before_save": "autowings_app.custom_scripts.events.before_save_vehicle_finance",
    #     "on_update": "autowings_app.custom_scripts.events.on_update_vehicle_finance"
    # },
    "Supplier": {
        "after_insert": "autowings_app.custom_scripts.supplier.on_supplier_save",
        "on_update": "autowings_app.custom_scripts.supplier.on_supplier_save",
        "on_trash": "autowings_app.custom_scripts.supplier.on_supplier_trash"
    },
    "Customer": {
        "after_insert": "autowings_app.custom_scripts.customer.on_customer_save",
        "on_update": "autowings_app.custom_scripts.customer.on_customer_save",
        "on_trash": "autowings_app.custom_scripts.customer.on_customer_trash"
    },
    "Payment Entry": {
        # "after_insert": "autowings_app.custom_scripts.payment_entry.update_journal_entries",
        "after_insert": "autowings_app.custom_scripts.payment_entry.update_vehicle_misc_sales"
    },
    "RTO Registration": {
        "Validate": "autowings_app.custom_scripts.api.update_due_documents_flag"
    }
    # "Payment Entry": {
    #     "on_submit": "autowings_app.custom_scripts.payment_entry.on_payment_entry_submit"
    # }


}

web_routes = [
    {"from_route": "/landing_page", "to_route": "landing_page"}
]


fixtures = [
    {"dt": "Custom HTML Block"}
]
# fixtures = [
#     {"dt": "Party Type", "filters": [["name", "in", ["Financer"]]]},
# ]
# fixtures = [
#     {"dt": "Account", "filters": [["name", "in", ["RTO Charges Payable - A", "Insurance Charges Payable - A", "Finance Receivable - A"]]]},
#     {"dt": "Supplier Group", "filters": [["name", "in", ["Insurance", "RTO"]]]}
# ]
# fixtures = [
#     {"doctype": "Customer Group", "filters": {"name": ["in", ["Financer"]]}}
# ]
# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "autowings_app",
# 		"logo": "/assets/autowings_app/logo.png",
# 		"title": "Autowings App",
# 		"route": "/autowings_app",
# 		"has_permission": "autowings_app.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/autowings_app/css/autowings_app.css"
# app_include_js = "/assets/autowings_app/js/autowings_app.js"

# include js, css files in header of web template
# web_include_css = "/assets/autowings_app/css/autowings_app.css"
# web_include_js = "/assets/autowings_app/js/autowings_app.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "autowings_app/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "autowings_app/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "autowings_app.utils.jinja_methods",
# 	"filters": "autowings_app.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "autowings_app.install.before_install"
# after_install = "autowings_app.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "autowings_app.uninstall.before_uninstall"
# after_uninstall = "autowings_app.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "autowings_app.utils.before_app_install"
# after_app_install = "autowings_app.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "autowings_app.utils.before_app_uninstall"
# after_app_uninstall = "autowings_app.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "autowings_app.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"autowings_app.tasks.all"
# 	],
# 	"daily": [
# 		"autowings_app.tasks.daily"
# 	],
# 	"hourly": [
# 		"autowings_app.tasks.hourly"
# 	],
# 	"weekly": [
# 		"autowings_app.tasks.weekly"
# 	],
# 	"monthly": [
# 		"autowings_app.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "autowings_app.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "autowings_app.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "autowings_app.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["autowings_app.utils.before_request"]
# after_request = ["autowings_app.utils.after_request"]

# Job Events
# ----------
# before_job = ["autowings_app.utils.before_job"]
# after_job = ["autowings_app.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"autowings_app.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

