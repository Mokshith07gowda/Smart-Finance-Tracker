import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiDollarSign, FiEye, FiEyeOff, FiShield, FiGlobe, FiArrowRight, FiZap, FiCheckCircle, FiStar, FiUser, FiTrendingUp, FiPieChart, FiBarChart2, FiCreditCard, FiUsers, FiRefreshCw, FiActivity } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const slogans = [
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
];

const Login = () => {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { name, email, password, confirmPassword } = formData;

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(p => (p + 1) % slogans.length), 5000);
    return () => clearInterval(t);
  }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const switchMode = (m) => {
    setMode(m);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!email || !password) { toast.error('Please fill in all fields'); return; }
      setLoading(true);
      try {
        await login(email, password);
        toast.success('Login successful!');
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed');
      } finally { setLoading(false); }
    } else {
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
    }
  };

  return (
    <div className="scroll-smooth">
      {/* =============== SECTION 1 — FULL-SCREEN SHOWCASE =============== */}
      <section className="min-h-screen relative overflow-hidden flex flex-col">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0118] via-[#0d1232] to-[#060e1f]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/15 via-transparent to-purple-600/15" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.5%22%20fill%3D%22rgba(255%2C255%2C255%2C0.025)%22/%3E%3C/svg%3E')]" />

        {/* Blurred orbs */}
        <div className="absolute top-[-8%] right-[10%] w-[500px] h-[500px] bg-purple-500/12 rounded-full blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/12 rounded-full blur-[100px]" />
        <div className="absolute top-[50%] right-[-5%] w-[300px] h-[300px] bg-cyan-400/8 rounded-full blur-[80px]" />
        <div className="absolute top-[20%] left-[40%] w-[200px] h-[200px] bg-pink-500/8 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col flex-1 px-6 sm:px-10 lg:px-16 xl:px-24 py-8">
          {/* Navbar */}
          <nav className="flex items-center justify-between mb-12 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <FiDollarSign size={22} className="text-white" />
              </div>
              <div>
                <span className="text-white text-base font-bold tracking-tight block leading-tight">Smart Finance</span>
                <span className="text-indigo-300/50 text-[10px] font-medium tracking-[0.15em] uppercase">Tracker Pro</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wide">Live</span>
              </div>
              <button onClick={() => switchMode('login')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${mode === 'login' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>Sign In</button>
              <button onClick={() => switchMode('register')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${mode === 'register' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white/90 shadow-md shadow-indigo-500/10 hover:-translate-y-0.5'}`}>Get Started</button>
            </div>
          </nav>

          {/* Hero — Center Content */}
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — Text */}
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
                  <FiZap size={12} className="text-amber-400" />
                  <span className="text-white/60 text-[11px] font-semibold tracking-wide uppercase">All-in-one Finance Platform</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                  Master Your<br />
                  <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Money Story</span>
                </h1>

                <p className="text-white/45 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                  From tracking daily expenses to managing complex budgets — get a crystal-clear view of your finances with real-time insights and smart analytics.
                </p>

                <div className="flex items-center gap-4 flex-wrap mb-10">
                  <button onClick={() => switchMode('register')} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white text-sm font-bold shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all border-none cursor-pointer">
                    Get Started Free <FiArrowRight size={16} />
                  </button>
                </div>

                {/* Trust Row */}
                <div className="flex items-center gap-5 flex-wrap">
                  {[
                    { icon: <FiShield size={14} />, text: 'Bank-grade security' },
                    { icon: <FiGlobe size={14} />, text: '128+ currencies' },
                    { icon: <FiZap size={14} />, text: '100% free' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-white/30">
                      <span className="text-white/40">{t.icon}</span>
                      <span className="text-[11px] font-medium">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Auth Card */}
              <div className="animate-fade-up flex justify-center lg:justify-end" style={{ animationDelay: '150ms' }}>
                <div className="w-full max-w-[420px]">
                  <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-8 shadow-2xl shadow-black/20">
                    <div className="mb-6">
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {mode === 'login' ? 'Welcome back' : 'Create account'}
                      </h2>
                      <p className="text-white/40 text-sm mt-1">
                        {mode === 'login' ? 'Sign in to your account' : 'Start your financial journey'}
                      </p>
                    </div>

                    <form onSubmit={onSubmit}>
                      {mode === 'register' && (
                        <div className="mb-4">
                          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wide"><FiUser size={12} /> Full Name</label>
                          <input type="text" name="name" className="w-full py-3 px-4 border border-white/10 rounded-xl text-sm bg-white/[0.05] text-white transition-all focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-white/25" placeholder="John Doe" value={name} onChange={onChange} required />
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wide"><FiMail size={12} /> Email Address</label>
                        <input type="email" name="email" className="w-full py-3 px-4 border border-white/10 rounded-xl text-sm bg-white/[0.05] text-white transition-all focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-white/25" placeholder="you@example.com" value={email} onChange={onChange} required />
                      </div>

                      <div className={mode === 'login' ? 'mb-2' : 'mb-4'}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 uppercase tracking-wide"><FiLock size={12} /> Password</label>
                          {mode === 'login' && <Link to="/forgot-password" className="text-indigo-300 no-underline text-[11px] font-semibold hover:text-indigo-200 transition-colors">Forgot?</Link>}
                        </div>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} name="password" className="w-full py-3 px-4 pr-12 border border-white/10 rounded-xl text-sm bg-white/[0.05] text-white transition-all focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-white/25" placeholder={mode === 'login' ? 'Enter your password' : 'Min 6 characters'} value={password} onChange={onChange} required minLength={6} />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-white/30 cursor-pointer p-1 hover:text-white/60 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                          </button>
                        </div>
                      </div>

                      {mode === 'register' && (
                        <div className="mb-2">
                          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wide"><FiLock size={12} /> Confirm Password</label>
                          <div className="relative">
                            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" className="w-full py-3 px-4 pr-12 border border-white/10 rounded-xl text-sm bg-white/[0.05] text-white transition-all focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-white/25" placeholder="Confirm your password" value={confirmPassword} onChange={onChange} required minLength={6} />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-white/30 cursor-pointer p-1 hover:text-white/60 transition-colors" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                          </div>
                        </div>
                      )}

                      <button type="submit" disabled={loading} className="w-full mt-5 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none border-none cursor-pointer flex items-center justify-center gap-2">
                        {loading ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                        ) : (
                          <><span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span> <FiArrowRight size={16} /></>
                        )}
                      </button>
                    </form>

                    <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/[0.06]">
                      {[
                        { icon: <FiShield size={11} />, text: 'Encrypted' },
                        { icon: <FiZap size={11} />, text: 'Fast' },
                        { icon: <FiCheckCircle size={11} />, text: 'Secure' },
                      ].map((t, i) => (
                        <div key={i} className="flex items-center gap-1 text-white/25">
                          {t.icon}
                          <span className="text-[9px] font-semibold uppercase tracking-wide">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center mt-5">
                    <p className="text-white/35 text-[13px]">
                      {mode === 'login' ? (
                        <>Don't have an account?{' '}<button onClick={() => switchMode('register')} className="text-indigo-300 bg-transparent border-none font-bold cursor-pointer hover:text-indigo-200 transition-colors text-[13px]">Create one free</button></>
                      ) : (
                        <>Already have an account?{' '}<button onClick={() => switchMode('login')} className="text-indigo-300 bg-transparent border-none font-bold cursor-pointer hover:text-indigo-200 transition-colors text-[13px]">Sign in</button></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom — Quote */}
          <div className="border-t border-white/[0.05] mx-6 sm:mx-10 lg:mx-16 xl:mx-24 pt-5 pb-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
              <div key={quoteIdx} className="animate-fade-in flex-1 min-w-0">
                <p className="text-white/45 text-[13px] italic leading-relaxed truncate">"{slogans[quoteIdx].text}"</p>
                <p className="text-indigo-300/40 text-[11px] font-semibold mt-1">— {slogans[quoteIdx].author}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  {slogans.map((_, i) => (
                    <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === quoteIdx ? 'w-5 bg-indigo-400/60' : 'w-1.5 bg-white/10'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <FiStar key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-white/25 text-[10px] ml-1">5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============== SECTION 2 — STATS BAR =============== */}
      <section className="relative bg-[#070d1f] border-t border-white/[0.04] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '128+', label: 'World Currencies', desc: 'Real-time exchange rates', icon: <FiGlobe size={22} />, color: 'text-indigo-400' },
              { value: '7', label: 'Smart Modules', desc: 'Complete finance toolkit', icon: <FiBarChart2 size={22} />, color: 'text-purple-400' },
              { value: '100%', label: 'Free Forever', desc: 'No hidden fees or trials', icon: <FiCreditCard size={22} />, color: 'text-emerald-400' },
              { value: '24/7', label: 'Always Available', desc: 'Access anytime, anywhere', icon: <FiActivity size={22} />, color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className={`${s.color} flex justify-center mb-3 group-hover:scale-110 transition-transform`}>{s.icon}</div>
                <p className="text-white font-extrabold text-3xl sm:text-4xl leading-tight">{s.value}</p>
                <p className="text-white/60 text-sm font-bold mt-1">{s.label}</p>
                <p className="text-white/25 text-[11px] mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== SECTION 3 — FEATURES DEEP DIVE =============== */}
      <section className="relative bg-gradient-to-b from-[#070d1f] via-[#0a1028] to-[#0c0118] overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
              <FiZap size={12} className="text-amber-400" />
              <span className="text-white/60 text-[11px] font-semibold tracking-wide uppercase">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">Everything You Need to <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Stay in Control</span></h2>
            <p className="text-white/40 text-base max-w-2xl mx-auto">Our comprehensive suite of tools helps you track, manage, and grow your finances — all in one beautifully designed platform.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <FiTrendingUp size={24} />, title: 'Income Tracking', desc: 'Monitor salary, freelance income, investments, and all revenue streams in real-time with visual charts and trend analysis.', color: 'text-emerald-400', border: 'border-emerald-500/10', bg: 'bg-emerald-500/5' },
              { icon: <FiPieChart size={24} />, title: 'Smart Budgets', desc: 'Set category-based spending limits, receive progress alerts, and get AI-powered suggestions to optimize your monthly budget.', color: 'text-amber-400', border: 'border-amber-500/10', bg: 'bg-amber-500/5' },
              { icon: <FiCreditCard size={24} />, title: 'Expense Management', desc: 'Log every transaction, categorize spending automatically, and see detailed breakdowns of where your money goes each month.', color: 'text-rose-400', border: 'border-rose-500/10', bg: 'bg-rose-500/5' },
              { icon: <FiRefreshCw size={24} />, title: 'Split Bills', desc: 'Easily divide expenses among friends, track who owes what, and settle up with clear breakdowns for every participant.', color: 'text-cyan-400', border: 'border-cyan-500/10', bg: 'bg-cyan-500/5' },
              { icon: <FiUsers size={24} />, title: 'Lend & Borrow', desc: 'Keep detailed records of money lent to or borrowed from others, track partial payments, and never lose track of IOUs again.', color: 'text-purple-400', border: 'border-purple-500/10', bg: 'bg-purple-500/5' },
              { icon: <FiGlobe size={24} />, title: 'Live Exchange Rates', desc: 'Access real-time conversion rates for 128+ world currencies, powered by reliable data feeds updated every hour.', color: 'text-indigo-400', border: 'border-indigo-500/10', bg: 'bg-indigo-500/5' },
            ].map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] ${f.border} hover:bg-white/[0.05] transition-all group`}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>{f.icon}</div>
                <h3 className="text-white text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-white/35 text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== SECTION 4 — HOW IT WORKS =============== */}
      <section className="relative bg-[#0c0118] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-purple-600/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
              <FiCheckCircle size={12} className="text-emerald-400" />
              <span className="text-white/60 text-[11px] font-semibold tracking-wide uppercase">Simple Setup</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">Get Started in <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">3 Easy Steps</span></h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">No complex setup, no credit card needed. Start tracking your finances in under a minute.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up for free with just your name and email. No credit card required, no hidden charges — ever.', icon: <FiUser size={20} /> },
              { step: '02', title: 'Set Your Currency', desc: 'Choose from 128+ world currencies. Set your base currency and the app adapts all modules automatically.', icon: <FiGlobe size={20} /> },
              { step: '03', title: 'Start Tracking', desc: 'Add your income, expenses, budgets, and more. Get instant visual insights and take control of your money.', icon: <FiActivity size={20} /> },
            ].map((s, i) => (
              <div key={i} className="relative p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group text-center">
                <div className="text-[64px] font-extrabold text-white/[0.03] absolute top-3 right-5 leading-none select-none">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-indigo-300 mb-5 mx-auto group-hover:scale-110 transition-transform">{s.icon}</div>
                <h3 className="text-white text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-white/35 text-[13px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== SECTION 5 — MODULES BREAKDOWN =============== */}
      <section className="relative bg-gradient-to-b from-[#0c0118] via-[#0d1232] to-[#070d1f] overflow-hidden">
        <div className="absolute top-[40%] right-[-8%] w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
              <FiBarChart2 size={12} className="text-indigo-400" />
              <span className="text-white/60 text-[11px] font-semibold tracking-wide uppercase">All 7 Modules</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">Your Complete <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Finance Toolkit</span></h2>
            <p className="text-white/40 text-base max-w-2xl mx-auto">Every module is purpose-built to handle a specific aspect of your financial life, working together seamlessly.</p>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Dashboard', desc: 'Your financial command center with at-a-glance summaries, charts, recent activity, and quick actions for every module.', icon: <FiActivity size={20} />, color: 'text-indigo-400', gradient: 'from-indigo-500/10 to-indigo-600/5' },
              { num: '02', title: 'Expenses', desc: 'Log, categorize, and analyze every expense. See monthly trends, top spending categories, and daily breakdowns in beautiful charts.', icon: <FiCreditCard size={20} />, color: 'text-rose-400', gradient: 'from-rose-500/10 to-rose-600/5' },
              { num: '03', title: 'Budget Planner', desc: 'Create budgets by category with custom limits. Track progress with visual bars, get alerts when you approach limits, and compare month-over-month.', icon: <FiPieChart size={20} />, color: 'text-amber-400', gradient: 'from-amber-500/10 to-amber-600/5' },
              { num: '04', title: 'Money Lent', desc: 'Track every rupee or dollar you lend. Record partial repayments, set reminders, and see outstanding amounts at a glance with borrower profiles.', icon: <FiTrendingUp size={20} />, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-emerald-600/5' },
              { num: '05', title: 'Money Borrowed', desc: 'Keep honest records of what you owe. Track repayments you have made, see remaining balances, and stay on top of your obligations.', icon: <FiRefreshCw size={20} />, color: 'text-cyan-400', gradient: 'from-cyan-500/10 to-cyan-600/5' },
              { num: '06', title: 'Split Bills', desc: 'Perfect for group dinners, trips, or shared expenses. Add participants, split equally or custom amounts, and track who has settled up.', icon: <FiUsers size={20} />, color: 'text-purple-400', gradient: 'from-purple-500/10 to-purple-600/5' },
              { num: '07', title: 'Settings & Profile', desc: 'Customize your experience — choose from 128+ currencies, toggle dark mode, update your profile, and manage your account security.', icon: <FiShield size={20} />, color: 'text-pink-400', gradient: 'from-pink-500/10 to-pink-600/5' },
            ].map((m, i) => (
              <div key={i} className={`flex items-start gap-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r ${m.gradient} border border-white/[0.04] hover:border-white/[0.08] transition-all group`}>
                <div className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 ${m.color} group-hover:scale-110 transition-transform`}>{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white/15 text-[11px] font-bold">{m.num}</span>
                    <h3 className="text-white text-base font-bold">{m.title}</h3>
                  </div>
                  <p className="text-white/35 text-[13px] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== SECTION 6 — WHY CHOOSE US =============== */}
      <section className="relative bg-[#070d1f] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">Why <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Smart Finance?</span></h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">Built by people who understand the pain of managing money across multiple tools.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <FiZap size={20} />, title: 'Lightning Fast', desc: 'Instant loading, no lag. Built with modern tech for the smoothest experience.' },
              { icon: <FiShield size={20} />, title: 'Bank-Grade Security', desc: 'AES-256 encryption, secure JWT tokens, and hashed passwords protect your data.' },
              { icon: <FiGlobe size={20} />, title: 'Multi-Currency', desc: 'Real-time exchange rates for 128+ currencies with automatic conversion everywhere.' },
              { icon: <FiCheckCircle size={20} />, title: 'Always Free', desc: 'No premium tiers, no feature locks, no credit card. Full access from day one.' },
            ].map((w, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all text-center group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center text-indigo-300 mx-auto mb-4 group-hover:scale-110 transition-transform">{w.icon}</div>
                <h4 className="text-white text-sm font-bold mb-1.5">{w.title}</h4>
                <p className="text-white/30 text-[12px] leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== SECTION 7 — FINAL CTA =============== */}
      <section className="relative bg-gradient-to-b from-[#070d1f] to-[#0c0118] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-purple-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-20 text-center">
          <div className="inline-flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <FiStar key={i} size={16} className="text-amber-400 fill-amber-400" />)}
            <span className="text-white/30 text-sm ml-2">5.0 Rating</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Ready to Take Control of Your <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Finances?</span></h2>
          <p className="text-white/40 text-base mb-8 max-w-xl mx-auto">Join thousands of users who are already mastering their money story. It only takes 30 seconds to get started.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => { switchMode('register'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white text-sm font-bold shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all border-none cursor-pointer">
              Create Free Account <FiArrowRight size={16} />
            </button>
            <button onClick={() => { switchMode('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/[0.1] transition-all cursor-pointer">
              Sign In <FiArrowRight size={16} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              { icon: <FiShield size={13} />, text: 'Bank-grade security' },
              { icon: <FiZap size={13} />, text: 'No credit card needed' },
              { icon: <FiCheckCircle size={13} />, text: 'Free forever' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 text-white/25">
                <span className="text-white/35">{t.icon}</span>
                <span className="text-[11px] font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] py-6">
          <p className="text-center text-[11px] text-white/20 tracking-wide">© 2024 Smart Finance Tracker · Built with precision · All rights reserved</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
