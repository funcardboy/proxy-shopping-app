# Proxy Shopping App PRD

## Context
Sam helps others purchase items from various (mainly Japanese) websites. Currently uses Google Sheets but struggles with item tracking, exchange rate fluctuations, and partial payments.

## Problem Statement
- Hard to remember what specific items a total amount represents.
- Exchange rates (JPY to HKD) vary per purchase.
- Customers often make multiple orders and pay in installments (partial payments).
- Need a clear dashboard to see outstanding balances per customer.

## Key Features

### 1. Item Management
- **Manual Input**: Users can manually add items (no mandatory URL).
- **Image Support**: Ability to attach/upload photos of products for visual tracking.
- **Cost Tracking**: Record cost in original currency (e.g., JPY) and the specific exchange rate used for that transaction.

### 2. Customer Dashboard
- **Balance Tracking**: Real-time view of how much each customer owes.
- **Payment History**: Support for partial payments and multiple orders.
- **Outstanding Summary**: Clear visibility into "who owes how much".

### 3. Google Sheets Integration
- **Interface Sync**: A web interface that syncs data back and forth with Google Sheets (acting as the database or source of truth).

## Success Criteria
- Can see a list of items for a specific customer with photos.
- The dashboard correctly calculates the HKD total based on transaction-specific JPY rates.
- Outstanding balance accurately reflects partial payments.
