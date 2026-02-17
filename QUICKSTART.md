# Smart Expense and Salary Manager - Quick Start Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/salary-expense-manager
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2026
JWT_EXPIRE=7d

# Start the server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will open automatically at `http://localhost:3000`

### 3. Using the Application

1. **Register**: Create a new account with your name, email, and password
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your financial overview
4. **Add Expenses**: Track your spending by category
5. **Add Income**: Record your salary and other income sources
6. **Set Budget**: Create monthly budgets and track your spending
7. **View Analytics**: Check charts and insights on the dashboard

## Default Categories

### Expenses
- Food
- Travel
- Bills
- Entertainment
- Healthcare
- Shopping
- Education
- Other

### Income Types
- Monthly Salary
- Bonus
- Freelance
- Investment
- Other Income

## Tips for Best Experience

1. **Set a Budget First**: Go to the Budget page and set your monthly budget
2. **Add Regular Expenses**: Record your bills and recurring expenses
3. **Track Income**: Add your salary and any additional income
4. **Monitor Dashboard**: Check the dashboard regularly for insights
5. **Review Categories**: See which categories consume the most budget

## Troubleshooting

### Backend Issues
- Ensure MongoDB is running
- Check if port 5000 is available
- Verify .env file configuration

### Frontend Issues
- Ensure backend is running first
- Check if port 3000 is available
- Clear browser cache if needed

### Database Connection
- For local MongoDB: Ensure MongoDB service is running
- For MongoDB Atlas: Use the connection string from Atlas

## Production Deployment

### Backend
1. Set production environment variables
2. Use a secure JWT_SECRET
3. Configure CORS for your domain
4. Use MongoDB Atlas or similar for database

### Frontend
1. Build the production bundle: `npm run build`
2. Deploy the build folder to your hosting service
3. Update API endpoints if needed

## Security Notes

- ⚠️ Change the JWT_SECRET in production
- ⚠️ Use strong passwords
- ⚠️ Keep .env file secure and never commit it
- ⚠️ Use HTTPS in production

## Support

For issues or questions, please check:
- README.md for detailed documentation
- Backend README for API documentation
- Frontend README for component details

---

Happy budgeting! 💰
