---
name: exploratory-testing
description: Explore a web application and document findings in structured markdown. Use this skill when you need to manually explore an application to understand its structure, features, and behavior before generating tests.
---

# Exploratory Testing Skill

## Purpose

Explore a web application interactively and document findings in a structured markdown report.

## Input

- `url`: The URL of the web application to explore (e.g., `https://example.com`)

## Output

- `exploration.md`: Structured markdown document containing:
  - Application overview
  - Pages discovered
  - Navigation structure
  - Forms and interactive elements
  - Visual observations
  - Issues or anomalies found
  - Screenshots (referenced)

## Process

1. Navigate to the target URL using Playwright MCP
2. Take initial screenshot of landing page
3. Document page structure and elements
4. Explore navigation links systematically
5. Identify forms, buttons, and interactive elements
6. Test basic interactions (click, hover, form submission)
7. Document visual observations (layout, responsiveness)
8. Note any issues or anomalies
9. Generate structured markdown report
10. Save screenshots with descriptive names

## Exploration Strategy

### Phase 1: Landing Page
- Take screenshot
- Document title, main heading, key elements
- Identify primary navigation
- Note call-to-action buttons

### Phase 2: Navigation Discovery
- Click through main navigation links
- Document each page visited
- Take screenshots of key pages
- Map site structure

### Phase 3: Interactive Elements
- Identify all forms
- Identify all buttons and links
- Test hover states
- Document form fields and validation

### Phase 4: User Flows
- Test common user journeys
- Document multi-step processes
- Note any authentication requirements
- Identify error states

### Phase 5: Visual Assessment
- Check responsiveness (resize viewport)
- Note visual issues
- Document branding and styling
- Check accessibility basics

## Example Output

```markdown
# Exploratory Testing Report

**URL**: https://example.com
**Date**: 2026-01-15
**Duration**: 30 minutes

## Application Overview

E-commerce platform for selling products online.

## Pages Discovered

1. **Home Page** (/)
   - Hero section with CTA
   - Product grid
   - Navigation: Home, Products, Cart, Login
   
2. **Products Page** (/products)
   - Product listing with filters
   - Search functionality
   - Sort options
   
3. **Product Detail** (/products/:id)
   - Product image
   - Description
   - Add to cart button
   
4. **Cart** (/cart)
   - Item list
   - Quantity controls
   - Checkout button
   
5. **Login** (/login)
   - Email/password form
   - Remember me checkbox
   - Forgot password link

## Navigation Structure

```
Home
├── Products
│   └── Product Detail
├── Cart
│   └── Checkout
└── Login
    └── Register
```

## Forms Identified

### Login Form
- **Location**: /login
- **Fields**:
  - Email (required, email validation)
  - Password (required, min 8 chars)
  - Remember me (checkbox)
- **Submit**: "Login" button
- **Validation**: Client-side validation present

### Registration Form
- **Location**: /register
- **Fields**:
  - Name (required)
  - Email (required, email validation)
  - Password (required, min 8 chars)
  - Confirm password (required, must match)
- **Submit**: "Register" button

## Interactive Elements

### Buttons
- Add to Cart (product pages)
- Update Quantity (cart)
- Remove Item (cart)
- Checkout (cart)
- Login/Register (auth pages)

### Links
- Navigation menu (5 items)
- Product cards (link to detail)
- Footer links (About, Contact, Terms)

## User Flows Tested

### Flow 1: Browse Products
1. Navigate to /products
2. Apply category filter
3. Click product card
4. View product details
**Result**: ✓ Works as expected

### Flow 2: Add to Cart
1. Navigate to product detail
2. Click "Add to Cart"
3. Navigate to /cart
4. Verify item in cart
**Result**: ✓ Works as expected

### Flow 3: Login
1. Navigate to /login
2. Enter valid credentials
3. Click "Login"
4. Verify redirect to dashboard
**Result**: ✗ Not tested (no test credentials)

## Visual Observations

### Responsiveness
- Desktop (1920x1080): ✓ Good
- Tablet (768x1024): ✓ Good
- Mobile (375x667): ⚠ Navigation menu collapses but some elements overlap

### Visual Issues
- Hero image on home page is low resolution
- Footer links are small and hard to click on mobile
- Cart badge doesn't update immediately after adding item

## Issues Found

### Critical
- None

### Major
- Cart badge update delay (requires page refresh)

### Minor
- Low resolution hero image
- Small footer links on mobile
- No loading indicator when adding to cart

## Screenshots

- `screenshots/01-home.png` - Home page
- `screenshots/02-products.png` - Products listing
- `screenshots/03-product-detail.png` - Product detail page
- `screenshots/04-cart.png` - Shopping cart
- `screenshots/05-login.png` - Login form
- `screenshots/06-mobile-home.png` - Mobile view of home page

## Recommendations

1. **Fix cart badge update** - Should update immediately without refresh
2. **Improve mobile navigation** - Fix overlapping elements
3. **Add loading indicators** - For cart operations
4. **Optimize images** - Hero image needs higher resolution
5. **Improve mobile UX** - Increase footer link tap targets

## Next Steps

1. Generate test cases based on findings
2. Create Playwright tests for user flows
3. Test authentication flows with credentials
4. Perform accessibility audit
5. Test edge cases and error states
```

## Usage

```bash
# Explore an application
@exploratory-testing https://example.com

# Output will be written to exploration.md
```

## Playwright MCP Tools Used

- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Get page structure
- `browser_take_screenshot` - Capture screenshots
- `browser_click` - Click elements
- `browser_type` - Type into inputs
- `browser_resize` - Test responsiveness

## Validation

The skill validates:
- URL is accessible
- At least one page is explored
- Screenshots are captured
- Report has required sections

## Error Handling

- URL not accessible: Error with status code
- Page load timeout: Warning and continue
- Screenshot fails: Warning and continue
- No interactive elements: Note in report

## Limitations

- Manual exploration (not automated crawling)
- Limited to what's visible without authentication
- No performance testing
- No security testing
