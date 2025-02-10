import frappe

@frappe.whitelist()
def create_buying_price(doc, method):
    """Creates an Item Price record for Standard Buying after the Item is saved."""
    
    if not doc.custom_standard_buying_rate:
        return  # Skip if no buying rate is set

    price_list = "Standard Buying"

    # Check if an Item Price already exists for this item in Standard Buying
    existing_price = frappe.get_all("Item Price", 
        filters={"item_code": doc.item_code, "price_list": price_list}, 
        fields=["name"]
    )

    if existing_price:
        # Update the existing price list rate
        price_doc = frappe.get_doc("Item Price", existing_price[0].name)
        price_doc.price_list_rate = doc.custom_standard_buying_rate
        price_doc.save(ignore_permissions=True)
    else:
        # Create a new Item Price record after the Item is saved
        item_price = frappe.get_doc({
            "doctype": "Item Price",
            "item_code": doc.item_code,
            "item_name": doc.item_name,
            "item_description": doc.description or doc.item_name,
            "uom": doc.stock_uom,
            "price_list": price_list,
            "buying": 1,
            "selling": 0,
            "currency": "INR",
            "price_list_rate": doc.custom_standard_buying_rate,
            "valid_from": frappe.utils.today()
        })
        item_price.insert(ignore_permissions=True)
    
    frappe.db.commit()
