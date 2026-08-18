# 🛒 Supermarket POS System - Frontend

A frontend application for managing sales, cashier operations, products, categories, inventory, invoices, employees, and reports in a supermarket environment.

The application is designed to provide a simple and efficient experience for cashiers and administrators, with role-based access and permission-based control over system features.

---

## Overview

The system provides the following main capabilities:

* Fast POS checkout without barcode scanners.
* Product search and category filtering.
* Automatic stock updates after confirmed sales.
* Product management and category management.
* Inventory management and stock history.
* Invoice management and printing.
* Return and exchange operations.
* Employee management and attendance tracking.
* Permission-based access to system screens and actions.
* Dashboard and sales reports.

---

## Tech Stack

* **React 18** - Frontend library
* **TypeScript** - Type-safe development
* **Vite** - Development server and build tool
* **TailwindCSS** - Styling and UI design
* **Lucide React** - Icons
* **React Router DOM v6** - Routing and navigation
* **REST API** - Communication with the ASP.NET Core backend

---

## Project Structure

```text
supermarket-pos-frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── services/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── invoices/
│   │   ├── pos/
│   │   └── products/
│   │
│   ├── hooks/
│   ├── pages/
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── StockHistoryPage.tsx
│   │   └── UsersPageWrapper.tsx
│   │
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Main Features

### 1. POS Checkout

The POS screen allows cashiers to:

* Search for products by name.
* Filter products by category.
* Select quantities.
* Sell products by Piece or Package.
* Apply a percentage discount to the invoice.
* Check available stock before completing a sale.
* Create invoices through the backend API.

### 2. Product Management

The product management section supports:

* Viewing products.
* Filtering products.
* Creating products.
* Updating product information.
* Deactivating products.
* Managing selling prices and units.
* Viewing current stock quantities.

### 3. Category Management

Users with the required permissions can:

* View categories.
* Create new categories.
* Manage category-related data.

### 4. Stock Management

The inventory section provides:

* Add Stock operations.
* Stock quantity updates.
* Stock history.
* Employee information for stock additions.
* Low-stock products.
* Out-of-stock products.
* Remaining stock information.

### 5. Invoices

The invoice section provides:

* Invoice listing.
* Invoice details.
* Product and quantity information.
* Invoice totals and discounts.
* Cashier information.
* Invoice date and time.
* Invoice printing.

Invoice details are loaded when an invoice is selected to keep the initial invoice list lightweight.

### 6. Invoice Printing

The application supports:

* 80mm thermal receipt printing.
* A4 invoice printing.
* Invoice number.
* Product name, quantity, and unit price.
* Discount and final total.
* Cashier name.
* Invoice date and time.

Printing is handled separately from the main application interface so only the invoice content is printed.

### 7. Returns and Exchanges

The system supports two operations:

**Return**

* Returns the selected quantity to stock.
* Keeps the original invoice.
* Records the return operation.

**Exchange**

* Returns the original product quantity to stock.
* Allows the cashier to select a replacement product.
* Creates a new invoice for the replacement product.

### 8. Employee Management

The employee section supports:

* Adding employees.
* Assigning roles.
* Managing permissions.
* Deactivating employees.
* Viewing attendance and shift history.

Employee data and historical records remain available after an account is deactivated.

### 9. Hold and Resume Cart

Cashiers can temporarily save an active cart and continue it later.

Held carts are stored in `localStorage`, allowing them to remain available after refreshing the page.

### 10. Dashboard and Reports

The application provides dashboard and reporting features for authorized users, including:

* Daily sales information.
* Invoice counts.
* Low-stock information.
* Sales reports.
* Employee-related reports.
* Product-related reports.

---

## Permission System

Access to application screens and actions is controlled through permissions provided by the authenticated user's JWT.

Examples:

| Permission                | Access                         |
| ------------------------- | ------------------------------ |
| `sales.create`            | POS                            |
| `invoices.view`           | Invoice list and details       |
| `invoices.return`         | Return operations              |
| `invoices.exchange`       | Exchange operations            |
| `invoices.override_price` | Price override                 |
| `products.view`           | Product management             |
| `products.manage`         | Product management operations  |
| `categories.view`         | Category list                  |
| `categories.manage`       | Category management            |
| `products.stock_add`      | Add stock                      |
| `employees.view`          | Employee management            |
| `employees.manage`        | Employee management operations |
| `reports.view`            | Reports                        |
| `dashboard.view`          | Dashboard                      |

The navigation and protected routes use these permissions to determine which screens and actions are available to the current user.

---

## API Integration

The frontend communicates with the ASP.NET Core backend through REST APIs.

A shared API client is used to:

* Send requests to the backend.
* Attach the authenticated user's Bearer Token.
* Handle API responses.
* Keep API communication consistent across the application.

---

## Setup

### Requirements

* Node.js `18.0.0` or later
* npm `9.0.0` or later

### 1. Clone the repository

```bash
git clone https://github.com/noormashaqi/supermarket-pos-frontend.git
cd supermarket-pos-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5206
```

Update the URL if the backend is running on a different address or port.

### 4. Run the application

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

### 5. Build the project

```bash
npm run build
```

---

## Development

The project follows a modular structure where:

* `pages` contains the main application screens.
* `components` contains reusable UI components.
* `api` contains backend communication.
* `hooks` contains reusable React hooks.
* `types` contains TypeScript types and interfaces.
* `utils` contains shared helper functions.

This structure keeps the application organized and makes it easier to add new features as the project grows.

---

## Backend

The frontend is designed to work with an **ASP.NET Core Web API** backend responsible for authentication, permissions, products, categories, inventory, invoices, employees, returns, and reports.

Make sure the backend is running before starting the frontend application.

---

## Project Status

The frontend currently includes the main interfaces for:

* Categories
* Products
* Stock Management
* Stock History
* Low Stock
* Out of Stock
* POS
* Invoices
* Employees
* Reports
* Dashboard
* Returns and Exchanges
* Invoice Printing

Further improvements and additional features will be added as development continues.
