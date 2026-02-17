# Forgot Password Feature - Setup & Usage Guide

## ✅ What's Been Implemented

### 1. **Email Uniqueness Validation**
   - Users cannot register with an email that already exists
   - Clear error message: "An account already exists with this email address. Please login or use forgot password."

### 2. **Forgot Password Flow (3-Step Process)**
   - **Step 1**: User enters their registered email
   - **Step 2**: User receives and enters 6-digit OTP
   - **Step 3**: User creates a new password

### 3. **Features**
   - ✅ OTP sent via email (expires in 10 minutes)
   - ✅ Email validation (shows "Email not registered" for unregistered emails)
   - ✅ OTP verification
   - ✅ Password visibility toggles on reset password form
   - ✅ Resend OTP option
   - ✅ Beautiful multi-step UI with progress indicator

## 🚀 How to Use

### For Users:
1. Go to the login page at `http://localhost:3000/login`
2. Click on **"Forgot Password?"** link below the login button
3. Enter your registered email address and click **"Send OTP"**
4. Check your email for the 6-digit OTP code
5. Enter the OTP code and click **"Verify OTP"**
6. Enter your new password (minimum 6 characters) and confirm it
7. Click **"Reset Password"**
8. You'll be redirected to login with your new password

### Testing Without Email Configuration:
The OTP will be generated and stored in the database, but the email won't actually be sent until you configure email settings. For testing:
- Check the backend terminal/console - the OTP will be logged there
- Or configure a test email service (see below)

## 📧 Email Configuration (REQUIRED for Production)

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or custom name)
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Update `.env` file** in the `backend` folder:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your.actual.email@gmail.com
   EMAIL_PASS=your16characterapppassword
   EMAIL_FROM=Salary Manager <your.actual.email@gmail.com>
   ```

4. **Restart Backend Server**:
   - Stop the current backend server (Ctrl+C in terminal)
   - Run: `cd backend && node server.js`

### Option 2: Other Email Services

**SendGrid**:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

**Outlook/Hotmail**:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your.email@outlook.com
EMAIL_PASS=your_password
EMAIL_FROM=Salary Manager <your.email@outlook.com>
```

## 🗂️ Files Created/Modified

### Backend Files:
- **`models/OTP.js`** - OTP schema with auto-expiry (10 minutes)
- **`utils/emailService.js`** - Email sending service with HTML template
- **`routes/auth.js`** - Added 3 new endpoints:
  - `POST /api/auth/forgot-password` - Send OTP to email
  - `POST /api/auth/verify-otp` - Verify OTP code
  - `POST /api/auth/reset-password` - Reset password with OTP
- **`.env`** - Added email configuration variables

### Frontend Files:
- **`pages/ForgotPassword.js`** - Multi-step forgot password component
- **`pages/ForgotPassword.css`** - Styling for forgot password page
- **`pages/Login.js`** - Added "Forgot Password?" link
- **`pages/Auth.css`** - Added styling for forgot password link
- **`App.js`** - Added `/forgot-password` route

### Dependencies Added:
- **`nodemailer@^6.9.1`** - For sending emails

## 🔐 API Endpoints

### 1. Forgot Password (Send OTP)
```javascript
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "message": "OTP has been sent to your email address", "email": "user@example.com" }
Error: { "message": "Email not registered" } // If email doesn't exist
```

### 2. Verify OTP
```javascript
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "message": "OTP verified successfully" }
Error: { "message": "Invalid or expired OTP" }
```

### 3. Reset Password
```javascript
POST /api/auth/reset-password
Body: { "email": "user@example.com", "otp": "123456", "newPassword": "newpass123" }
Response: { "message": "Password reset successfully" }
Error: { "message": "Invalid or expired OTP" }
```

## 🎨 UI Features

- **Step Progress Indicator**: Shows current step (Email → OTP → Password)
- **Password Visibility Toggles**: Eye icons to show/hide passwords
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading States**: Buttons show loading text while processing
- **Error Handling**: Toast notifications for all errors and success messages
- **Auto-redirect**: Redirects to login after successful password reset

## 🐛 Troubleshooting

### "Failed to send OTP email" Error:
- Check your `.env` file has correct email credentials
- Ensure Gmail App Password is used (not regular password)
- Verify 2-Step Verification is enabled for Gmail
- Check backend terminal for detailed error logs

### "Email not registered" Error:
- User needs to register first using the Register page
- Verify the email is typed correctly

### "Invalid or expired OTP" Error:
- OTP expires after 10 minutes
- Request a new OTP using "Resend OTP" button
- Ensure OTP is entered correctly (6 digits)

### OTP Not Received:
- Check spam/junk folder
- Verify email configuration in `.env`
- Check backend terminal for email sending logs
- For testing, check backend console for the generated OTP

## 📱 Screenshots of User Flow

1. **Login Page** - "Forgot Password?" link below login button
2. **Step 1** - Enter email address
3. **Step 2** - Enter 6-digit OTP from email
4. **Step 3** - Create new password with confirmation
5. **Success** - Redirect to login page

## 🔄 Development Workflow

1. **Backend**: Running on `http://localhost:5000`
2. **Frontend**: Running on `http://localhost:3000`
3. **MongoDB**: Local database at `mongodb://localhost:27017/salary-expense-manager`

## ⚠️ Important Notes

- OTPs are automatically deleted from database after:
  - 10 minutes (auto-expiry)
  - Successful password reset
- Each "Send OTP" request deletes previous OTPs for that email
- Email configuration is REQUIRED for production use
- For development/testing, check backend console for generated OTP

## 🎉 Ready to Test!

Your application is now running with the complete forgot password feature. Configure your email settings in the `.env` file to start sending real OTPs!

**Servers Status**:
- ✅ Backend: Running on port 5000
- ✅ Frontend: Running on port 3000
- ✅ All features implemented and ready to use!
