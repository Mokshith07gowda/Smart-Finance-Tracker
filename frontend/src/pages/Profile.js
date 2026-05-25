import React, { useState, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCamera, FiEdit, FiCheck, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { LanguageContext } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';

const inputCls = 'w-full py-2.5 px-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400 disabled:bg-slate-50 disabled:dark:bg-slate-800 disabled:text-slate-500';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md transition-all cursor-pointer border-none';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer border-none';
const btnDangerOutline = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all cursor-pointer border border-red-200 dark:border-red-800';
const btnDanger = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer border-none';
const labelCls = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5';
const sectionCls = 'card-elevated p-6 animate-fade-up';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showEmailPasswords, setShowEmailPasswords] = useState({
    verify: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    verifyPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // email | otp | newpass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPasswords, setShowForgotPasswords] = useState({ new: false, confirm: false });
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showResetOTP, setShowResetOTP] = useState(false);
  const [resetOTP, setResetOTP] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteOTP, setShowDeleteOTP] = useState(false);
  const [deleteOTP, setDeleteOTP] = useState('');
  const [sendingDeleteOTP, setSendingDeleteOTP] = useState(false);

  const handleNameUpdate = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (editName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const response = await axios.put('/api/auth/update-name', { name: editName.trim() });
      setUser(response.data.user);
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update name');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files (jpg, png, gif, webp) are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB allowed');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploadingPhoto(true);
    try {
      const response = await axios.post('/api/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(response.data.user);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const response = await axios.delete('/api/auth/remove-photo');
      setUser(response.data.user);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove photo');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const toggleEmailPasswordVisibility = (field) => {
    setShowEmailPasswords({ ...showEmailPasswords, [field]: !showEmailPasswords[field] });
  };

  const handleEmailDataChange = (e) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (emailData.newPassword !== emailData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (emailData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await axios.post('/api/auth/change-email', {
        currentPassword: emailData.verifyPassword,
        newEmail: emailData.newEmail,
        newPassword: emailData.newPassword
      });
      toast.success(response.data.message);
      setUser(response.data.user);
      setEmailData({
        verifyPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangeEmail(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change email');
    }
  };

  // Forgot Password handlers
  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Please enter your email'); return; }
    setForgotLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: forgotEmail });
      toast.success('OTP sent to your email');
      setForgotStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally { setForgotLoading(false); }
  };

  const handleForgotVerifyOTP = async (e) => {
    e.preventDefault();
    if (!forgotOTP || forgotOTP.length !== 6) { toast.error('Please enter a valid 6-digit OTP'); return; }
    setForgotLoading(true);
    try {
      await axios.post('/api/auth/verify-otp', { email: forgotEmail, otp: forgotOTP });
      toast.success('OTP verified! Set your new password.');
      setForgotStep('newpass');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally { setForgotLoading(false); }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPass !== forgotConfirmPass) { toast.error('Passwords do not match'); return; }
    if (forgotNewPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setForgotLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email: forgotEmail, otp: forgotOTP, newPassword: forgotNewPass });
      toast.success('Password reset successfully!');
      setShowForgotPassword(false);
      setForgotStep('email');
      setForgotEmail(''); setForgotOTP(''); setForgotNewPass(''); setForgotConfirmPass('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally { setForgotLoading(false); }
  };

  const cancelForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep('email');
    setForgotEmail(''); setForgotOTP(''); setForgotNewPass(''); setForgotConfirmPass('');
  };

  const handleResetAccountClick = () => {
    setShowResetWarning(true);
  };

  const handleAcceptReset = async () => {
    setSendingOTP(true);
    try {
      await axios.post('/api/auth/send-reset-account-otp');
      toast.success('OTP sent to your email');
      setShowResetWarning(false);
      setShowResetOTP(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResetAccountSubmit = async (e) => {
    e.preventDefault();
    if (!resetOTP || resetOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await axios.post('/api/auth/reset-account', { otp: resetOTP });
      toast.success(response.data.message);
      setShowResetOTP(false);
      setResetOTP('');
      // Optionally refresh the page or redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset account');
    }
  };

  const handleCancelReset = () => {
    setShowResetWarning(false);
    setShowResetOTP(false);
    setResetOTP('');
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteWarning(true);
  };

  const handleAcceptDelete = async () => {
    setSendingDeleteOTP(true);
    try {
      await axios.post('/api/auth/send-delete-account-otp');
      toast.success('OTP sent to your email');
      setShowDeleteWarning(false);
      setShowDeleteOTP(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingDeleteOTP(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deleteOTP || deleteOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await axios.post('/api/auth/delete-account', { otp: deleteOTP });
      toast.success(response.data.message);
      setShowDeleteOTP(false);
      setDeleteOTP('');
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteOTP(false);
    setDeleteOTP('');
  };

  const PasswordField = ({ label, name, value, onChange, show, onToggle }) => (
    <div className="mb-4">
      <label className={labelCls}><FiLock size={14} /> {label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={`Enter ${label.toLowerCase()}`} required minLength={6} className={`${inputCls} pr-12`} />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-primary transition-colors" onClick={onToggle}>
          {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mt-10 mb-10">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('profile_title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('profile_subtitle')}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Picture & Info Card */}
        <div className={sectionCls}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white overflow-hidden shadow-lg">
                {user?.profilePicture ? (
                  <img src={`${process.env.REACT_APP_API_URL || ''}${user.profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={40} />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all border-none cursor-pointer" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} title="Upload photo">
                <FiCamera size={14} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="hidden" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">{uploadingPhoto ? 'Uploading...' : 'Click the camera icon to update photo'}</p>
              {user?.profilePicture && (
                <button className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-red-500 hover:text-red-600 bg-transparent border-none cursor-pointer" onClick={handleRemovePhoto}>
                  <FiTrash2 size={12} /> Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name & Email Fields */}
        <div className={sectionCls}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Personal Information</h3>
          <div className="mb-4">
            <label className={labelCls}>
              <FiUser size={14} /> Full Name
              {!isEditingName && (
                <button className="ml-auto text-primary hover:text-primary-hover bg-transparent border-none cursor-pointer p-0" onClick={() => { setEditName(user?.name || ''); setIsEditingName(true); }} title="Edit name"><FiEdit size={14} /></button>
              )}
            </label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleNameUpdate(); if (e.key === 'Escape') setIsEditingName(false); }} className={`${inputCls} flex-1`} />
                <button className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-all border-none cursor-pointer" onClick={handleNameUpdate} title="Save"><FiCheck size={16} /></button>
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 transition-all border-none cursor-pointer" onClick={() => setIsEditingName(false)} title="Cancel"><FiX size={16} /></button>
              </div>
            ) : (
              <input type="text" value={user?.name || ''} disabled className={inputCls} />
            )}
          </div>
          <div>
            <label className={labelCls}><FiMail size={14} /> Email Address</label>
            <input type="email" value={user?.email || ''} disabled className={inputCls} />
          </div>
        </div>

        {/* Change Password & Email */}
        <div className={sectionCls}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Security</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {!showChangePassword && <button className={btnPrimary} onClick={() => setShowChangePassword(true)}><FiLock size={15} /> Change Password</button>}
            {!showChangeEmail && <button className={btnPrimary} onClick={() => setShowChangeEmail(true)}><FiEdit size={15} /> Change Email</button>}
            {!showForgotPassword && <button className={btnSecondary} onClick={() => setShowForgotPassword(true)}><FiMail size={15} /> Forgot Password</button>}
          </div>

          {showChangePassword && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Change Password</h4>
              <form onSubmit={handleSubmit}>
                <PasswordField label="Current Password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} show={showPasswords.current} onToggle={() => togglePasswordVisibility('current')} />
                <PasswordField label="New Password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} show={showPasswords.new} onToggle={() => togglePasswordVisibility('new')} />
                <PasswordField label="Confirm New Password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} show={showPasswords.confirm} onToggle={() => togglePasswordVisibility('confirm')} />
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" className={btnSecondary} onClick={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button>
                  <button type="submit" className={btnPrimary}>Update Password</button>
                </div>
              </form>
            </div>
          )}

          {showChangeEmail && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Change Email</h4>
              <p className="text-xs text-slate-500 mb-4">Enter your current password to verify identity, then provide new email and password.</p>
              <form onSubmit={handleEmailSubmit}>
                <PasswordField label="Current Password" name="verifyPassword" value={emailData.verifyPassword} onChange={handleEmailDataChange} show={showEmailPasswords.verify} onToggle={() => toggleEmailPasswordVisibility('verify')} />
                <div className="mb-4">
                  <label className={labelCls}><FiMail size={14} /> New Email Address</label>
                  <input type="email" name="newEmail" value={emailData.newEmail} onChange={handleEmailDataChange} placeholder="Enter new email address" required className={inputCls} />
                </div>
                <PasswordField label="New Password" name="newPassword" value={emailData.newPassword} onChange={handleEmailDataChange} show={showEmailPasswords.new} onToggle={() => toggleEmailPasswordVisibility('new')} />
                <PasswordField label="Confirm New Password" name="confirmPassword" value={emailData.confirmPassword} onChange={handleEmailDataChange} show={showEmailPasswords.confirm} onToggle={() => toggleEmailPasswordVisibility('confirm')} />
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" className={btnSecondary} onClick={() => { setShowChangeEmail(false); setEmailData({ verifyPassword: '', newEmail: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button>
                  <button type="submit" className={btnPrimary}>Update Email</button>
                </div>
              </form>
            </div>
          )}

          {showForgotPassword && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Forgot Password</h4>
              <p className="text-xs text-slate-500 mb-4">
                {forgotStep === 'email' && 'Enter your registered email to receive an OTP.'}
                {forgotStep === 'otp' && 'Enter the 6-digit OTP sent to your email.'}
                {forgotStep === 'newpass' && 'Set your new password.'}
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {['email', 'otp', 'newpass'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${forgotStep === step ? 'bg-primary text-white' : i < ['email', 'otp', 'newpass'].indexOf(forgotStep) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>{i + 1}</div>
                    {i < 2 && <div className={`w-8 h-0.5 ${i < ['email', 'otp', 'newpass'].indexOf(forgotStep) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`} />}
                  </div>
                ))}
              </div>

              {forgotStep === 'email' && (
                <form onSubmit={handleForgotSendOTP}>
                  <div className="mb-4">
                    <label className={labelCls}><FiMail size={14} /> Registered Email</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your registered email" required className={inputCls} />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className={btnSecondary} onClick={cancelForgotPassword}>Cancel</button>
                    <button type="submit" className={btnPrimary} disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send OTP'}</button>
                  </div>
                </form>
              )}

              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotVerifyOTP}>
                  <div className="mb-4">
                    <label className={labelCls}><FiLock size={14} /> Enter OTP</label>
                    <input type="text" value={forgotOTP} onChange={(e) => setForgotOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength={6} required className={`${inputCls} text-center text-lg tracking-[0.5em] font-bold`} />
                    <p className="text-[11px] text-slate-400 mt-1.5">OTP sent to {forgotEmail}</p>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className={btnSecondary} onClick={cancelForgotPassword}>Cancel</button>
                    <button type="submit" className={btnPrimary} disabled={forgotLoading}>{forgotLoading ? 'Verifying...' : 'Verify OTP'}</button>
                  </div>
                </form>
              )}

              {forgotStep === 'newpass' && (
                <form onSubmit={handleForgotResetPassword}>
                  <div className="mb-4">
                    <label className={labelCls}><FiLock size={14} /> New Password</label>
                    <div className="relative">
                      <input type={showForgotPasswords.new ? 'text' : 'password'} value={forgotNewPass} onChange={(e) => setForgotNewPass(e.target.value)} placeholder="Enter new password" required className={inputCls} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setShowForgotPasswords(p => ({ ...p, new: !p.new }))}>{showForgotPasswords.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className={labelCls}><FiLock size={14} /> Confirm Password</label>
                    <div className="relative">
                      <input type={showForgotPasswords.confirm ? 'text' : 'password'} value={forgotConfirmPass} onChange={(e) => setForgotConfirmPass(e.target.value)} placeholder="Confirm new password" required className={inputCls} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setShowForgotPasswords(p => ({ ...p, confirm: !p.confirm }))}>{showForgotPasswords.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className={btnSecondary} onClick={cancelForgotPassword}>Cancel</button>
                    <button type="submit" className={btnPrimary} disabled={forgotLoading}>{forgotLoading ? 'Saving...' : 'Save Password'}</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card-elevated p-6 animate-fade-up border-red-200/60 dark:border-red-800/30">
          <h3 className="text-sm font-semibold text-red-600 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <FiAlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reset Account</h4>
                <p className="text-xs text-slate-500 mt-0.5">Delete all your financial data permanently.</p>
              </div>
              <button className={btnDangerOutline} onClick={handleResetAccountClick}><FiTrash2 size={14} /> Reset</button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <FiAlertTriangle size={20} className="text-red-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Delete Account</h4>
                <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all data. Irreversible.</p>
              </div>
              <button className={btnDanger} onClick={handleDeleteAccountClick}><FiTrash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Warning Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={handleCancelReset}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <FiAlertTriangle size={22} className="text-red-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">Reset Account</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={handleCancelReset}>&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3"><strong>Warning:</strong> This will permanently delete all your data:</p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc mb-4">
                <li>All salary records</li><li>All expense entries</li><li>All budget plans</li><li>All money lent records</li><li>All money borrowed records</li>
              </ul>
              <p className="text-sm text-red-600 font-semibold mb-2">This action cannot be undone!</p>
              <p className="text-sm text-slate-500">An OTP will be sent to <strong>{user?.email}</strong> for verification.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
              <button className={btnSecondary} onClick={handleCancelReset} disabled={sendingOTP}>Cancel</button>
              <button className={btnDanger} onClick={handleAcceptReset} disabled={sendingOTP}>{sendingOTP ? 'Sending OTP...' : 'I Accept, Send OTP'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset OTP Modal */}
      {showResetOTP && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={handleCancelReset}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Verify OTP to Reset</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={handleCancelReset}>&times;</button>
            </div>
            <form onSubmit={handleResetAccountSubmit} className="p-6">
              <div className="mb-4">
                <label className={labelCls}><FiMail size={14} /> Enter OTP sent to {user?.email}</label>
                <input type="text" placeholder="Enter 6-digit OTP" value={resetOTP} onChange={(e) => setResetOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required className={`${inputCls} text-center text-lg tracking-[0.3em]`} />
                <p className="text-xs text-slate-400 mt-1.5">Check your email inbox and spam folder.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className={btnSecondary} onClick={handleCancelReset}>Cancel</button>
                <button type="submit" className={btnDanger}>Verify & Reset Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={handleCancelDelete}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <FiAlertTriangle size={22} className="text-red-700" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">Delete Account</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={handleCancelDelete}>&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3"><strong>Warning:</strong> This will permanently delete your account and all data:</p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc mb-4">
                <li>Your user account</li><li>All salary records</li><li>All expense entries</li><li>All budget plans</li><li>All money lent records</li><li>All money borrowed records</li>
              </ul>
              <p className="text-sm text-red-600 font-bold mb-2">This action is irreversible!</p>
              <p className="text-sm text-slate-500">An OTP will be sent to <strong>{user?.email}</strong> for verification.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
              <button className={btnSecondary} onClick={handleCancelDelete} disabled={sendingDeleteOTP}>Cancel</button>
              <button className={btnDanger} onClick={handleAcceptDelete} disabled={sendingDeleteOTP}>{sendingDeleteOTP ? 'Sending OTP...' : 'I Accept, Send OTP'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete OTP Modal */}
      {showDeleteOTP && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={handleCancelDelete}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Verify OTP to Delete</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={handleCancelDelete}>&times;</button>
            </div>
            <form onSubmit={handleDeleteAccountSubmit} className="p-6">
              <div className="mb-4">
                <label className={labelCls}><FiMail size={14} /> Enter OTP sent to {user?.email}</label>
                <input type="text" placeholder="Enter 6-digit OTP" value={deleteOTP} onChange={(e) => setDeleteOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required className={`${inputCls} text-center text-lg tracking-[0.3em]`} />
                <p className="text-xs text-slate-400 mt-1.5">Check your email inbox and spam folder.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className={btnSecondary} onClick={handleCancelDelete}>Cancel</button>
                <button type="submit" className={btnDanger}>Verify & Delete Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
