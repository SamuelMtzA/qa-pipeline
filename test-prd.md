# E-Commerce Platform

A modern e-commerce platform for selling products online.

## User Authentication

Users must be able to register and login to the platform securely.

### Requirements
- Users can register with email and password
- Password must be at least 8 characters
- Users can login with email and password
- Failed login attempts are logged
- Users can reset their password via email

### Acceptance Criteria
- Given a valid email and password, when the user clicks "Register", then an account is created and confirmation email is sent
- Given an invalid email format, when the user clicks "Register", then an error message is shown
- Given valid credentials, when the user clicks "Login", then they are redirected to dashboard
- Given invalid credentials, when the user clicks "Login", then an error message is shown and attempt is logged

## Product Catalog

Users should be able to browse and search for products.

### Requirements
- Products are displayed in a grid layout
- Each product shows image, name, price, and description
- Users can filter products by category
- Users can search products by name
- Product details page shows full information

### Acceptance Criteria
- Given the catalog page, when it loads, then products are displayed in a responsive grid
- Given a category filter, when selected, then only products in that category are shown
- Given a search query, when entered, then matching products are displayed
- Given a product click, when clicked, then the product details page is shown

## Shopping Cart

Users must be able to add products to a cart and manage their selections.

### Requirements
- Users can add products to cart
- Cart shows quantity and total price
- Users can update quantity in cart
- Users can remove items from cart
- Cart persists across sessions

### Acceptance Criteria
- Given a product page, when "Add to Cart" is clicked, then the product is added to cart
- Given the cart page, when quantity is updated, then the total price is recalculated
- Given an item in cart, when "Remove" is clicked, then the item is removed from cart
- Given a logged-in user, when they return to the site, then their cart is still populated

## Checkout Process

Users must be able to complete a purchase through a streamlined checkout process.

### Requirements
- Checkout requires user to be logged in
- Users enter shipping address
- Users select payment method
- Order summary is shown before confirmation
- Confirmation email is sent after purchase

### Acceptance Criteria
- Given items in cart, when user clicks "Checkout", then they are prompted to login if not already
- Given a logged-in user, when shipping address is entered, then it is validated
- Given valid payment info, when "Place Order" is clicked, then order is created and confirmation is shown
- Given a completed order, then confirmation email is sent to user's email address

## Order History

Users should be able to view their past orders.

### Requirements
- Order history page lists all past orders
- Each order shows date, items, total, and status
- Users can click to view order details
- Order status updates are tracked

### Acceptance Criteria
- Given a logged-in user with orders, when they visit order history, then all orders are displayed
- Given an order in the list, when clicked, then detailed order information is shown
- Given an order, then the status reflects current fulfillment state
