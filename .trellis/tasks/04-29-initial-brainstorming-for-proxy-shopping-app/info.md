# Proxy Shopping App - Technical Design & Schema

## Data Architecture
We will use **Google Sheets** as the primary database. The webapp will interface with a Google Sheet containing the following tabs/tables.

## Schema Definition

### 1. Customers Table
Stores customer information and overall balance.
- `customer_id`: Unique ID (string/uuid)
- `name`: Customer name (string)
- `contact_info`: Telegram/WhatsApp/etc (string)
- `created_at`: Timestamp

### 2. Items Table
Stores individual product details from purchases.
- `item_id`: Unique ID
- `customer_id`: Link to Customers
- `description`: Product name/memo (string)
- `image_url`: Path or Google Drive link to product photo
- `cost_jpy`: Price in Japanese Yen (number)
- `exchange_rate`: JPY to HKD rate at time of purchase (number)
- `cost_hkd`: Calculated value (`cost_jpy * exchange_rate`)
- `status`: Ordered / Received / Delivered
- `purchase_date`: Date of transaction

### 3. Payments Table
Tracks payments made by customers.
- `payment_id`: Unique ID
- `customer_id`: Link to Customers
- `amount_hkd`: Amount paid (number)
- `payment_date`: Date of payment
- `method`: FPS / PayMe / Bank Transfer
- `note`: Memo (e.g., "Partial payment for Apr batch")

## Calculated Views (Dashboard Logic)
- **Total Owed (HKD)**: `SUM(Items.cost_hkd WHERE customer_id = X)`
- **Total Paid (HKD)**: `SUM(Payments.amount_hkd WHERE customer_id = X)`
- **Outstanding Balance**: `Total Owed - Total Paid`

## UI/UX Considerations
- **Item Entry Form**: Fields for Description, JPY Cost, Rate, and an Image Upload trigger.
- **Customer View**: A list of customers with a progress bar or highlighted red "Balance Due" figure.
- **Mobile Friendly**: Sam is likely on the go when buying; needs to work well on a phone.
