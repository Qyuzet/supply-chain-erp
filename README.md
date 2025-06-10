# Supply Chain Management Platform

A comprehensive, full-stack supply chain management platform built with Next.js, TypeScript, Supabase, and Tailwind CSS. This platform implements role-based access control (RBAC) and provides specialized interfaces for customers, suppliers, warehouse staff, shipping carriers, factory workers, and administrators.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control (RBAC)** - 6 distinct user roles with tailored interfaces
- **Real-time Updates** - Live data synchronization using Supabase subscriptions
- **Comprehensive Audit Logging** - All status changes are tracked in history tables
- **Responsive Design** - Mobile-first approach with modern UI components
- **Type Safety** - Full TypeScript implementation with strict typing

### User Roles & Capabilities

#### 👤 **Customer**
- Place and track orders
- View product catalog
- Order management dashboard

#### 🏭 **Supplier**
- Manage product catalog
- View supplier dashboard
- Product management interface

#### 📦 **Warehouse Staff**
- Real-time inventory management
- Stock level adjustments and tracking
- Low stock alerts and notifications
- Warehouse location management

#### 🚛 **Shipping Carrier**
- Manage assigned deliveries
- Delivery tracking interface
- Carrier dashboard

#### 🏭 **Factory Worker**
- Manage production orders
- Manufacturing workflow control
- Quality control and inspection
- Production analytics and metrics

#### 👨‍💼 **Administrator**
- Complete system oversight
- Order management
- Product and inventory oversight
- Warehouse management
- System-wide analytics and reports

## 🛠 Technology Stack

- **Frontend**: Next.js 13 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with **21 tables** covering the complete supply chain workflow:

### ✅ Fully Implemented Tables (21 tables)

#### **Core Business Logic (12 tables):**
- `users` - Authentication and role management
- `customers`, `supplier` - User profile extensions
- `product` - Product catalog
- `warehouses` - Warehouse locations
- `inventory` - Current stock levels
- `Order` - Customer orders
- `orderdetail` - Order line items
- `shipments` - Shipping management
- `shippingcarrier` - Carrier management
- `orderstatushistory` - Order audit trail
- `inventorylog` - Inventory movement tracking

#### **Payment System (2 tables):**
- `paymentcustomer` - Customer payment records
- `paymentsupplier` - Supplier payment records

#### **Production System (2 tables):**
- `production` - Production orders
- `productionstatuslog` - Production status history

#### **Purchase Order System (2 tables):**
- `purchaseorder` - Supplier purchase orders
- `purchaseorderstatushistory` - Purchase order status history

#### **Returns System (2 tables):**
- `returns` - Product return requests
- `returnstatushistory` - Return status history

#### **Performance Tracking (1 table):**
- `supplierperformance` - Supplier performance evaluations

### 🎯 Complete Implementation Features
This implementation covers the **entire supply chain ecosystem**:
- **Customer Experience:** Shopping, ordering, payments, returns, tracking
- **Supplier Management:** Purchase orders, payments, performance evaluation
- **Production Planning:** Manufacturing orders, status tracking
- **Warehouse Operations:** Inventory management, order fulfillment
- **Carrier Services:** Shipment tracking, delivery management
- **Financial Tracking:** Customer and supplier payment processing
- **Performance Analytics:** Supplier performance metrics and evaluation
- **Complete Audit Trail:** Status history for all major entities

### Order Management
- `order` - Customer orders
- `orderdetail` - Order line items
- `shipments` - Shipment tracking
- `shippingcarrier` - Carrier information

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Policies** - Granular data access permissions
- **JWT Authentication** - Secure token-based auth via Supabase
- **Middleware Protection** - Route-level access control
- **Data Isolation** - Users only see their relevant data

## 📱 Pages & Interfaces

### Customer Interface
- `/dashboard` - Customer overview and metrics
- `/shop` - Product browsing and shopping cart
- `/checkout` - Secure order placement
- `/orders` - Order history and tracking
- `/returns` - Return request management
- `/payments` - Payment history and records

### Supplier Interface
- `/dashboard` - Supplier metrics and overview
- `/products` - Product catalog management
- `/purchase-orders` - Purchase order management
- `/production` - Manufacturing order management
- `/payments` - Payment tracking and history
- `/supplier-performance` - Performance metrics

### Warehouse Interface
- `/dashboard` - Warehouse operations overview
- `/warehouse-orders` - Order processing and fulfillment
- `/inventory` - Real-time inventory management
- `/locations` - Warehouse location management

### Carrier Interface
- `/dashboard` - Delivery overview
- `/carrier` - Shipment management and status updates

### Factory Interface
- `/dashboard` - Factory operations overview
- `/factory-production` - Production order management
- `/manufacturing` - Manufacturing analytics dashboard
- `/quality-control` - Quality inspection and control

### Admin Interface
- `/dashboard` - System-wide overview
- `/admin` - Admin panel and user management
- `/orders` - All orders management
- `/products` - Product management
- `/inventory` - System inventory overview
- `/warehouses` - Warehouse management
- `/purchase-orders` - Purchase order oversight
- `/production` - Production management
- `/returns` - Return request management
- `/payments` - Financial transaction management
- `/supplier-performance` - Supplier evaluation
- `/carriers` - Carrier management
- `/carrier` - Shipment oversight
- `/reports` - Analytics and reporting

## 🔄 Real-time Features

The platform implements comprehensive real-time updates using Supabase subscriptions:

- **Order Status Changes** - Instant notifications for status updates
- **Inventory Movements** - Real-time stock level changes
- **Shipment Tracking** - Live delivery status updates
- **Production Updates** - Real-time production progress
- **Return Processing** - Instant return status changes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd supply-chain-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database**
- Run the migration file in your Supabase SQL editor
- The migration creates all tables, RLS policies, and sample data

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
- Open [http://localhost:3000](http://localhost:3000)
- Create an account or use sample credentials

## 📋 Sample Data

The platform includes sample data for testing:
- Warehouses (New York, Los Angeles, Miami)
- Shipping carriers (FedEx, UPS, DHL)
- Sample products and inventory

## 🔧 Configuration

### Database Configuration
- All tables have RLS enabled
- Role-based access policies are pre-configured
- Audit logging is automatic via triggers

### Authentication
- Supabase Auth handles user registration/login
- Custom user profiles are created automatically
- Role assignment during registration

### Real-time Subscriptions
- Automatic subscription management
- Role-based data filtering
- Efficient connection pooling

## 📈 Performance Features

- **Server Components** - Optimized rendering where possible
- **Static Generation** - Pre-built pages for better performance
- **Efficient Queries** - Optimized database queries with joins
- **Real-time Optimization** - Selective subscriptions based on user role
- **Responsive Design** - Mobile-optimized interface

## 🧪 Testing

The platform is designed for comprehensive testing:
- Unit tests for database operations
- Integration tests for API endpoints
- E2E tests for user workflows
- Real-time subscription testing

## 📚 API Documentation

### Database Operations
- `lib/database.ts` - CRUD operations for all entities
- `lib/realtime.ts` - Real-time subscription management
- `lib/auth.ts` - Authentication utilities

### Key Functions
- `orderOperations` - Order management
- `inventoryOperations` - Inventory control
- `shipmentOperations` - Shipment tracking
- `productOperations` - Product management
- `purchaseOrderOperations` - PO management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the database schema
- Examine the sample data
- Test with different user roles

## 🔮 Future Enhancements

- Mobile app development
- Advanced analytics and ML insights
- Integration with external logistics APIs
- Automated inventory replenishment
- Advanced reporting and export features
- Multi-language support
- Advanced notification system
