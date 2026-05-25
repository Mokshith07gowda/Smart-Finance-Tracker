import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiDollarSign, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const inputCls = 'w-full py-3 px-4 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400';
const labelCls = 'flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

const slogans = [
  "The habit of saving is itself an education; it fosters every virtue.",
  "It's not how much money you make, but how much money you keep.",
  "Do not save what is left after spending, but spend what is left after saving.",
  "Wealth is not about having a lot of money — it's about having options.",
];

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { name, email, password, confirmPassword } = formData;

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(p => (p + 1) % slogans.length), 5000);
    return () => clearInterval(t);
  }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Panel — Product Showcase */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22/%3E%3Cpath%20d%3D%22M30%200v60M0%2030h60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.04)%22%20stroke-width%3D%221%22/%3E%3C/svg%3E')]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiDollarSign size={22} className="text-white" />
              </div>
              <span className="text-white text-lg font-bold tracking-tight">Smart Finance</span>
            </div>
            <p className="text-white/60 text-xs tracking-wide">PERSONAL FINANCE TRACKER</p>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Start Your Journey to <span className="text-amber-300">Financial Freedom</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              Join thousands of users who are already taking control of their finances with our powerful, easy-to-use tools.
            </p>

            <div className="space-y-3 mb-10">
              {['Track unlimited income sources', 'Set smart budgets by category', 'Monitor expenses in real-time', '128+ currencies with live rates', 'Bank-grade data security'].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <FiCheckCircle size={16} className="text-emerald-300 shrink-0" />
                  <span className="text-sm text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div key={quoteIdx} className="animate-fade-in">
              <p className="text-white/80 text-sm italic leading-relaxed">"{slogans[quoteIdx]}"</p>
            </div>
            <div className="flex gap-1.5 mt-3">
              {slogans.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all ${i === quoteIdx ? 'w-5 bg-white/80' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4 shadow-glow">
              <FiDollarSign size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Smart Finance</h1>
            <p className="text-slate-500 text-sm mt-1">Your personal finance companion</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Create account</h1>
              <p className="text-slate-500 text-sm mt-1">Start managing your finances today</p>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className={labelCls}><FiUser size={14} /> Full Name</label>
                <input type="text" name="name" className={inputCls} placeholder="John Doe" value={name} onChange={onChange} required />
              </div>
              <div className="mb-4">
                <label className={labelCls}><FiMail size={14} /> Email</label>
                <input type="email" name="email" className={inputCls} placeholder="you@example.com" value={email} onChange={onChange} required />
              </div>
              <div className="mb-4">
                <label className={labelCls}><FiLock size={14} /> Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" className={`${inputCls} pr-12`} placeholder="Min 6 characters" value={password} onChange={onChange} required minLength={6} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-primary transition-colors" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <label className={labelCls}><FiLock size={14} /> Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" className={`${inputCls} pr-12`} placeholder="Confirm your password" value={confirmPassword} onChange={onChange} required minLength={6} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-primary transition-colors" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none cursor-pointer flex items-center justify-center gap-2">
                {loading ? 'Creating Account...' : <><span>Create Account</span> <FiArrowRight size={16} /></>}
              </button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary no-underline font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Built with precision. Designed for your financial freedom.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
