# Smart Expense and Salary Manager

A full-stack web application built with the MERN stack (MongoDB, Express.js, React, Node.js) to help users track expenses, manage salary/income, set budgets, and gain insights into their financial habits.

## 🌟 Features

### User Authentication
- ✅ Secure registration and login with JWT authentication
- ✅ Protected routes and user sessions
- ✅ Password hashing with bcrypt

### Expense Tracking
- ✅ Add, edit, and delete expenses
- ✅ Categorize expenses (Food, Travel, Bills, Entertainment, Healthcare, Shopping, Education, Other)
- ✅ Filter expenses by category
- ✅ View detailed expense history with dates
- ✅ Real-time expense calculations

### Salary Management
- ✅ Track multiple income sources (Monthly Salary, Bonus, Freelance, Investment, Other Income)
- ✅ Add, edit, and delete salary entries
- ✅ View complete salary history
- ✅ Filter by income type

### Budget Planning
- ✅ Set monthly budgets (overall and category-wise)
- ✅ Visual progress bars showing budget usage
- ✅ Warnings when spending exceeds limits
- ✅ Track budget across different months and years

### Dashboard & Insights
- ✅ Total balance and savings calculation
- ✅ Savings rate percentage
- ✅ Recent transactions overview
- ✅ Interactive charts:
  - Monthly spending trends (6-month view)
  - Category-wise expense distribution (Doughnut chart)
  - Income vs Expenses comparison (Line chart)
- ✅ Budget progress tracking
- ✅ Financial health summary cards

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Chart.js & react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Toastify** - Notifications

## 📁 Project Structure

```
salary/
├── backend/
│   ├── models/          # Database schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── .env            # Environment variables
│   ├── server.js       # Server entry point
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── context/     # React context (Auth)
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd salary
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/salary-expense-manager
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2026
   JWT_EXPIRE=7d
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB**
   Make sure MongoDB is running on your system

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5000`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   Application will open on `http://localhost:3000`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Salary
- `GET /api/salary` - Get all salary entries
- `POST /api/salary` - Create salary entry
- `PUT /api/salary/:id` - Update salary entry
- `DELETE /api/salary/:id` - Delete salary entry

### Budget
- `GET /api/budget` - Get budgets
- `POST /api/budget` - Create/Update budget
- `PUT /api/budget/:id` - Update budget
- `DELETE /api/budget/:id` - Delete budget

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/monthly-trend` - Get 6-month trend data
- `GET /api/dashboard/recent-transactions` - Get recent transactions

## 🎨 Features Showcase

### Dashboard
- Real-time financial overview
- Visual charts for better understanding
- Quick access to recent transactions
- Budget tracking with warnings

### Expense Management
- Intuitive categorization
- Easy filtering and search
- Clean, modern UI
- Quick edit and delete actions

### Salary Tracking
- Multiple income source support
- Comprehensive history view
- Type-based filtering
- Clear income visualization

### Budget Planning
- Category-wise budgets
- Monthly budget tracking
- Visual progress indicators
- Over-budget warnings

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Secure user sessions
- Environment variable configuration

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

## 🎯 Future Enhancements

- Export data to CSV/PDF
- Recurring transactions
- Multi-currency support
- Email notifications
- Advanced analytics and reports
- Goal setting features
- Bill reminders

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ as a comprehensive financial management solution.

## 📧 Support

For support, please open an issue in the repository.

---

**Note:** Remember to change the JWT_SECRET in production and use a secure MongoDB connection string.
