# Backend - Smart Expense and Salary Manager

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/salary-expense-manager
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2026
JWT_EXPIRE=7d
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Documentation

All routes are prefixed with `/api`

### Authentication Routes (`/auth`)
- POST `/register` - Register new user
- POST `/login` - Login user
- GET `/me` - Get current user (Protected)

### Expense Routes (`/expenses`)
All routes require authentication
- GET `/` - Get all expenses (supports filtering)
- GET `/:id` - Get single expense
- POST `/` - Create expense
- PUT `/:id` - Update expense
- DELETE `/:id` - Delete expense

### Salary Routes (`/salary`)
All routes require authentication
- GET `/` - Get all salary entries
- GET `/:id` - Get single salary entry
- POST `/` - Create salary entry
- PUT `/:id` - Update salary entry
- DELETE `/:id` - Delete salary entry

### Budget Routes (`/budget`)
All routes require authentication
- GET `/` - Get budgets
- POST `/` - Create/Update budget
- PUT `/:id` - Update budget
- DELETE `/:id` - Delete budget

### Dashboard Routes (`/dashboard`)
All routes require authentication
- GET `/summary` - Get current month summary
- GET `/monthly-trend` - Get 6-month trend
- GET `/recent-transactions` - Get recent transactions
