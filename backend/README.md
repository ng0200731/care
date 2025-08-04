# Care Label Layout System - Backend API

## Overview
Backend API for the Care Label Layout System with user authentication, master file management, supplier management, and order management.

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
1. Install PostgreSQL on your system
2. Create a new database called `care_db`
3. Update the `DATABASE_URL` in `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/care_db"
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

### 4. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Master Files
- `GET /api/master-files` - Get all master files
- `GET /api/master-files/:id` - Get specific master file
- `POST /api/master-files` - Create new master file
- `PUT /api/master-files/:id` - Update master file
- `DELETE /api/master-files/:id` - Delete master file

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get specific supplier
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Schema

### Users
- Multi-user support with role-based access (ADMIN/USER)
- Secure password hashing with bcrypt

### Master Files
- Stores coordinate viewer JSON data
- User-specific access control

### Suppliers
- Flexible contact information and capabilities
- User-specific supplier management

### Orders
- Links master files with suppliers
- Order status tracking
- User-specific order management

## Security Features
- JWT-based authentication
- Role-based access control
- Input validation with Zod
- CORS protection
- Helmet security headers
- Password hashing with bcrypt

## Development Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Create and apply new migration
