import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiDollarSign, FiShield } from 'react-icons/fi';

const inputCls = 'w-full py-3 px-4 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400';
const labelCls = 'flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';
const submitCls = 'w-full mt-2 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none cursor-pointer flex items-center justify-center gap-2';
const toggleCls = 'absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-primary transition-colors';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      toast.success(response.data.message);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/verify-otp', { email, otp });
      toast.success('OTP verified successfully');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      toast.success(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const StepDot = ({ num, label }) => (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= num ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{num}</span>
      <p className={`text-xs font-medium ${step >= num ? 'text-primary' : 'text-slate-400'}`}>{label}</p>
    </div>
  );

  const StepLine = ({ active }) => (
    <div className={`flex-1 h-0.5 mt-[-18px] transition-colors ${active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSendOTP} className="mt-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Forgot Password</h2>
              <p className="text-sm text-slate-500">Enter your email address to receive OTP</p>
            </div>
            <div className="mb-4">
              <label htmlFor="email" className={labelCls}><FiMail /> Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your registered email" required className={inputCls} />
            </div>
            <button type="submit" className={submitCls} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <div className="text-center mt-5 text-[13px] text-slate-500">
              Remember your password? <Link to="/login" className="text-primary font-semibold no-underline hover:underline transition-all">Login here</Link>
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyOTP} className="mt-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Verify OTP</h2>
              <p className="text-sm text-slate-500">Enter the 6-digit OTP sent to {email}</p>
            </div>
            <div className="mb-4">
              <label htmlFor="otp" className={labelCls}>OTP Code</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength="6" required className={`${inputCls} text-center text-lg tracking-[0.3em]`} />
            </div>
            <button type="submit" className={submitCls} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => handleSendOTP({ preventDefault: () => {} })} className="bg-transparent border-none text-primary font-semibold text-[13px] cursor-pointer hover:underline transition-all">
                Resend OTP
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="mt-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Reset Password</h2>
              <p className="text-sm text-slate-500">Enter your new password</p>
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className={labelCls}><FiLock /> New Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 characters)" required className={`${inputCls} pr-12`} />
                <button type="button" className={toggleCls} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className={labelCls}><FiLock /> Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your new password" required className={`${inputCls} pr-12`} />
                <button type="button" className={toggleCls} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <button type="submit" className={submitCls} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900 to-purple-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22/%3E%3Cpath%20d%3D%22M30%200v60M0%2030h60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22%20stroke-width%3D%221%22/%3E%3C/svg%3E')]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><FiDollarSign size={22} className="text-white" /></div>
              <span className="text-white text-lg font-bold tracking-tight">Smart Finance</span>
            </div>
            <p className="text-white/60 text-xs tracking-wide">ACCOUNT RECOVERY</p>
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6"><FiShield size={32} className="text-white/80" /></div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">Secure Password <span className="text-amber-300">Recovery</span></h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6">We'll send a one-time verification code to your registered email. Your security is our top priority.</p>
            <div className="space-y-3">
              {['OTP verification via email', 'AES-256 encrypted connection', 'Auto-expiring security codes'].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="text-sm text-white/80">{t}</span></div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-white/50 text-xs italic">"The best time to secure your finances was yesterday. The second best time is now."</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[440px] animate-fade-up">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white mb-4 shadow-glow"><FiDollarSign size={28} /></div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Smart Finance</h1>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-center gap-0 px-4 mb-2">
              <StepDot num={1} label="Email" />
              <StepLine active={step >= 2} />
              <StepDot num={2} label="OTP" />
              <StepLine active={step >= 3} />
              <StepDot num={3} label="Password" />
            </div>
            {renderStepContent()}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Built with precision. Designed for your financial freedom.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
