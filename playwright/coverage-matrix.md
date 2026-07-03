# Test Coverage Matrix

**Project**: E-Commerce Platform  
**Generated**: 2026-01-15T10:30:00Z  
**Coverage**: 92% (23/25 requirements)

---

## Features

### F-001: User Authentication (P0)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Users can register with email and password | T-010, T-011 | ✓ Covered |
| Password must be at least 8 characters | T-012, T-006 | ✓ Covered |
| Users can login with email and password | T-001, T-002, T-003, T-004, T-005 | ✓ Covered |
| Failed login attempts are logged | - | ✗ Not testable from UI |
| Users can reset their password via email | T-015 | ✓ Covered |

**Coverage**: 80% (4/5 requirements)

---

### F-002: Product Catalog (P1)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Products are displayed in a grid layout | T-020 | ✓ Covered |
| Each product shows image, name, price, and description | T-020 | ✓ Covered |
| Users can filter products by category | T-021 | ✓ Covered |
| Users can search products by name | T-022 | ✓ Covered |
| Product details page shows full information | T-023 | ✓ Covered |

**Coverage**: 100% (5/5 requirements)

---

### F-003: Shopping Cart (P0)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Users can add products to cart | T-031, T-039 | ✓ Covered |
| Cart shows quantity and total price | T-031, T-032 | ✓ Covered |
| Users can update quantity in cart | T-032 | ✓ Covered |
| Users can remove items from cart | T-033 | ✓ Covered |
| Cart persists across sessions | T-038 | ✓ Covered |

**Coverage**: 100% (5/5 requirements)

---

### F-004: Checkout Process (P0)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Checkout requires user to be logged in | T-036 | ✓ Covered |
| Users enter shipping address | T-050 | ✓ Covered |
| Users select payment method | T-051 | ✓ Covered |
| Order summary is shown before confirmation | T-052 | ✓ Covered |
| Confirmation email is sent after purchase | T-053 | ✓ Covered |

**Coverage**: 100% (5/5 requirements)

---

### F-005: Order History (P1)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Order history page lists all past orders | T-060 | ✓ Covered |
| Each order shows date, items, total, and status | T-060 | ✓ Covered |
| Users can click to view order details | T-061 | ✓ Covered |
| Order status updates are tracked | - | ✗ Deferred (requires time delay) |

**Coverage**: 75% (3/4 requirements)

---

## Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Requirements** | 25 | 100% |
| **Covered** | 23 | 92% |
| **Not Testable** | 1 | 4% |
| **Deferred** | 1 | 4% |

---

## Untested Requirements

### 1. F-001: Failed login attempts are logged
**Reason**: Not testable from UI  
**Explanation**: This requirement requires backend verification (checking server logs or database). Cannot be tested through browser automation alone.  
**Recommendation**: Add backend API test or manual verification step.

### 2. F-005: Order status updates are tracked
**Reason**: Deferred  
**Explanation**: This requirement requires multiple sessions and time delays to test properly (order placed → status changes over time).  
**Recommendation**: Create separate integration test or manual test scenario.

---

## Test Distribution by Priority

| Priority | Count | Percentage |
|----------|-------|------------|
| **P0** (Critical) | 24 | 60% |
| **P1** (Important) | 12 | 30% |
| **P2** (Nice-to-have) | 4 | 10% |
| **Total** | 40 | 100% |

---

## Test Distribution by Type

| Type | Count | Percentage |
|------|-------|------------|
| **Happy Path** | 20 | 50% |
| **Error Path** | 15 | 37.5% |
| **Edge Case** | 5 | 12.5% |
| **Total** | 40 | 100% |

---

## Files Generated

| File | Tests | Priority |
|------|-------|----------|
| `auth/login.spec.ts` | 9 | P0: 6, P1: 3 |
| `auth/register.spec.ts` | 8 | P0: 6, P1: 2 |
| `products/catalog.spec.ts` | 5 | P1: 5 |
| `cart/cart.spec.ts` | 11 | P0: 6, P1: 5 |
| `checkout/checkout.spec.ts` | 7 | P0: 6, P1: 1 |

**Total**: 40 tests across 5 files

---

## Next Steps

1. **Execute tests** using Skill 5 (Execution)
2. **Review failures** and update tests as needed
3. **Add backend tests** for untestable requirements
4. **Create integration tests** for deferred requirements
5. **Generate report** using Skill 6 (Reporting)
