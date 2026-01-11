# Marybill Conglomerate - Supermarket Management Software

![Version](https://img.shields.io/badge/version-1.3.7-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Electron](https://img.shields.io/badge/Electron-35.0.2-47848F.svg)

A comprehensive desktop application for managing supermarket operations, built with Electron and SQLite. This software provides a complete solution for inventory management, sales tracking, customer management, and business analytics.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Building for Production](#-building-for-production)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [User Roles](#-user-roles)
- [Auto-Updates](#-auto-updates)
- [License](#-license)

## ✨ Features

### Core Functionality

- **User Authentication & Authorization** - Secure login system with role-based access control
- **Product Management** - Add, update, and track products with wholesale and retail pricing
- **Inventory Management** - Real-time stock tracking for both wholesale and retail quantities
- **Sales Processing** - Complete point-of-sale system with multiple payment methods
- **Customer Management** - Maintain customer records and transaction history
- **Supplier Management** - Track supplier information and product relationships
- **Stock Replenishment** - Record and manage inventory restocking operations
- **Payment Tracking** - Monitor payments with reference numbers and status tracking
- **Low Stock Alerts** - Automatic notifications when inventory falls below reorder levels

### Analytics & Reporting

- **Dashboard Statistics** - Real-time overview of daily sales, transactions, and inventory status
- **Sales Analysis** - Daily, weekly, and custom date range sales reports
- **Product Performance** - Track sales history by product
- **Stocking History** - Complete audit trail of all inventory movements

### Advanced Features

- **Auto-Updates** - Automatic software updates from remote server
- **Data Synchronization** - Sync sales data with cloud backend
- **Desktop Shortcuts** - Automatic creation of desktop and start menu shortcuts
- **Protected Records** - Safeguards for critical data like "Walk-in Customer"
- **Branch Activation** - Multi-branch support with activation system

## 🛠 Technology Stack

- **Framework**: [Electron](https://www.electronjs.org/) v35.0.2
- **Database**: [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) v11.9.1
- **Authentication**: JSON Web Tokens (JWT)
- **Build Tool**: Electron Forge v7.8.1
- **UI**: HTML, CSS, JavaScript (Vanilla)
- **Additional Libraries**:
  - `electron-store` - Persistent configuration storage
  - `electron-updater` - Auto-update functionality
  - `html2canvas` - Receipt/report generation
  - `uuid` - Unique identifier generation
  - `dotenv` - Environment variable management

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### System Requirements

- **Windows**: Windows 10 or later (primary platform)
- **macOS**: macOS 10.13 or later
- **Linux**: Ubuntu 18.04 or later, Fedora 32 or later

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd supermarket-desktop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   The application uses a SQLite database (`store.db`) located in the `resources` folder. On first run, this database will be automatically copied to the user's data directory.

4. **Configure environment variables** (optional)

   Create a `.env` file in the root directory if you need custom configuration:

   ```env
   # Add any environment-specific variables here
   ```

## 🏃 Running the Application

### Development Mode

Start the application in development mode with hot-reload:

```bash
npm start
```

This will:

- Launch the Electron application
- Enable developer tools
- Show the application menu
- Load the activation page (if not activated) or login page

### First-Time Setup

On first launch, you'll need to:

1. **Activate the software** - Enter your branch ID to activate the application
2. **Login** - Use your credentials to access the system

## 🔨 Building for Production

### Package the Application

Create a distributable package without installers:

```bash
npm run package
```

The packaged application will be in the `out` folder.

### Create Installers

Build platform-specific installers:

```bash
npm run make
```

This will create installers for your current platform:

- **Windows**: Squirrel installer (`.exe`)
- **macOS**: ZIP archive
- **Linux**: DEB and RPM packages

The installers will be located in the `out/make` directory.

### Distribution Files

After building, you'll find:

- **Windows**: `Marybill_Conglomerate-Setup-{version}.exe`
- **macOS**: `Marybill Conglomerate-{version}.zip`
- **Linux**: `.deb` and `.rpm` packages

## 📁 Project Structure

```
supermarket-desktop/
├── assets/              # Static assets (CSS, images, jQuery)
├── DB/                  # Database configuration and operations
│   ├── dbConfig.js      # Database connection setup
│   └── storeManager.js  # Database query functions
├── functions/           # Utility functions
├── ipc/                 # Inter-process communication handlers
│   ├── ipcHandlers.js   # Main IPC handlers
│   └── updateHandlers.js # Auto-update handlers
├── jwt/                 # JWT authentication utilities
├── modules/             # Application modules
├── pages/               # HTML pages
│   ├── activation-page.html
│   ├── login.html
│   ├── index.html       # Main dashboard
│   ├── suppliers.html
│   └── routes/          # Additional page routes
├── renderer/            # Renderer process scripts
├── resources/           # Application resources
│   ├── file.json        # Branch configuration
│   ├── store.db         # Default database
│   └── app_icon.*       # Application icons
├── main.mjs             # Main process entry point
├── preload.mjs          # Preload script for IPC
├── menuConfig.js        # Application menu configuration
├── forge.config.mjs     # Electron Forge configuration
└── package.json         # Project dependencies and scripts
```

## 🗄 Database Schema

The application uses SQLite with the following main tables:

- **Users** - User accounts with roles and authentication
- **Products** - Product catalog with pricing and stock levels
- **Customers** - Customer information and contact details
- **Suppliers** - Supplier records and contact information
- **Sales** - Sales transactions with payment details
- **Sales_items** - Individual items in each sale
- **Stocking** - Inventory replenishment records
- **Stocking_items** - Items in each stocking operation
- **Payments** - Payment tracking with references
- **Settings** - Application settings and sync status

### Key Features:

- **Dual Pricing**: Wholesale and retail pricing for all products
- **Stock Tracking**: Separate wholesale and retail inventory counts
- **Audit Trail**: Complete history of all transactions
- **Data Integrity**: Foreign key relationships and constraints

## 👥 User Roles

The application supports multiple user roles with different permissions:

- **Admin** - Full system access
- **Manager** - Sales and inventory management
- **Cashier** - Point-of-sale operations
- **Stock Clerk** - Inventory management

## 🔄 Auto-Updates

The application includes automatic update functionality:

- **Update Server**: `https://web.marybillconglomerate.com.ng/updates/`
- **Update Check**: Automatic on application start (Windows only)
- **Update UI**: Professional update progress dialog
- **Installation**: Automatic download and installation

Updates are only enabled in production builds on Windows.

## 📝 License

ISC License

Copyright (c) 2024 Marybill Conglomerate

---

## 🤝 Support

For support, please contact:

- **Company**: Marybill Conglomerate Ltd
- **Email**: [Contact Information]
- **Website**: https://web.marybillconglomerate.com.ng

## 🔐 Security Notes

- Passwords are stored in the database (consider implementing hashing in production)
- JWT tokens are used for session management
- The application uses context isolation for security
- Protected records prevent accidental deletion of critical data

## 🚧 Development Notes

### Running Tests

```bash
npm test
```

_Note: Test suite needs to be implemented_

### Debugging

- Development mode includes Chrome DevTools
- Check console logs in both main and renderer processes
- Database file location: `%APPDATA%/marybill-conglomerate-software/store.db`

### Common Issues

1. **Database not found**: Ensure `resources/store.db` exists
2. **Build failures**: Run `npm install electron-rebuild` and rebuild native modules
3. **Update errors**: Check internet connection and update server availability

---

**Built by Effa Ojah with for Marybill Conglomerate**
