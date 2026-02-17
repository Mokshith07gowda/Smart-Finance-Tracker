# Frontend - Smart Expense and Salary Manager

## Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## Environment

The frontend is configured to proxy API requests to `http://localhost:5000` during development.

## Features

- User Authentication (Login/Register)
- Expense Tracking with CRUD operations
- Salary/Income Management
- Budget Planning and Tracking
- Interactive Dashboard with Charts
- Responsive Design
- Real-time Notifications

## Dependencies

- React 18
- React Router DOM 6
- Axios
- Chart.js & react-chartjs-2
- React Icons
- React Toastify

## Folder Structure

```
src/
├── components/     # Reusable components (Navbar)
├── pages/         # Page components
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   ├── Expenses.js
│   ├── Salary.js
│   └── Budget.js
├── context/       # React Context (AuthContext)
├── App.js         # Main app component with routing
└── index.js       # Entry point
```

## Key Features

### Authentication
- JWT-based authentication
- Protected routes
- Persistent login sessions

### Dashboard
- Financial overview cards
- 6-month trend chart
- Category-wise expense breakdown
- Recent transactions
- Budget progress tracking

### Expense Management
- Category-based filtering
- Add/Edit/Delete operations
- Date-based tracking
- Real-time calculations

### Salary Management
- Multiple income types
- Comprehensive history
- Type-based filtering

### Budget Planning
- Monthly budget setting
- Category-wise budgets
- Progress visualization
- Over-budget warnings
