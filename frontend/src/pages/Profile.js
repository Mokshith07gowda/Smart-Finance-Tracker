import React, { useState, useContext, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCamera, FiEdit, FiCheck, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
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

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '40px' }}>
      <div className="profile-container">
        <div className="profile-header-section">
          <h1>Profile</h1>
          <p className="text-secondary">Your profile information</p>
        </div>

        <div className="profile-card card fade-in">
          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="profile-picture">
              <div className="profile-picture-inner">
                {user?.profilePicture ? (
                  <img
                    src={`http://localhost:5000${user.profilePicture}`}
                    alt="Profile"
                    className="profile-image"
                  />
                ) : (
                  <FiUser size={60} />
                )}
              </div>
              <button
                className="camera-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Upload photo"
              >
                <FiCamera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
            </div>
            <p className="text-secondary">
              {uploadingPhoto ? 'Uploading...' : 'Click the camera icon to update your photo'}
            </p>
            {user?.profilePicture && (
              <button
                className="btn btn-secondary remove-photo-btn"
                onClick={handleRemovePhoto}
                style={{ marginTop: '8px', fontSize: '13px', padding: '6px 14px' }}
              >
                <FiTrash2 size={14} />
                Remove Photo
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="profile-info">
            <div className="form-group">
              <label>
                <FiUser size={18} />
                Full Name
                {!isEditingName && (
                  <button
                    className="edit-name-btn"
                    onClick={() => {
                      setEditName(user?.name || '');
                      setIsEditingName(true);
                    }}
                    title="Edit name"
                  >
                    <FiEdit size={16} />
                  </button>
                )}
              </label>
              {isEditingName ? (
                <div className="name-edit-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameUpdate();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <div className="name-edit-actions">
                    <button className="name-action-btn save" onClick={handleNameUpdate} title="Save">
                      <FiCheck size={18} />
                    </button>
                    <button className="name-action-btn cancel" onClick={() => setIsEditingName(false)} title="Cancel">
                      <FiX size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={user?.name || ''}
                  disabled
                />
              )}
            </div>

            <div className="form-group">
              <label>
                <FiMail size={18} />
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
              />
            </div>
          </div>

          {/* Change Password and Email Sections */}
          <div className="change-sections-container">
            {/* Change Password Section */}
            <div className="change-password-section">
            {!showChangePassword ? (
              <button 
                className="btn btn-primary"
                onClick={() => setShowChangePassword(true)}
              >
                <FiLock size={18} />
                Change Password
              </button>
            ) : (
              <div className="change-password-form">
                <h3>Change Password</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      Current Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        className="form-control"
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        className="form-control"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        className="form-control"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="password-form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Change Email Section */}
          <div className="change-email-section">
            {!showChangeEmail ? (
              <button 
                className="btn btn-primary"
                onClick={() => setShowChangeEmail(true)}
              >
                <FiEdit size={18} />
                Change Email
              </button>
            ) : (
              <div className="change-email-form">
                <h3>Change Email</h3>
                <p className="text-secondary" style={{ marginBottom: '16px', fontSize: '14px' }}>
                  Enter your current password to verify your identity, then provide your new email and a new password.
                </p>
                <form onSubmit={handleEmailSubmit}>
                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      Current Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showEmailPasswords.verify ? 'text' : 'password'}
                        name="verifyPassword"
                        className="form-control"
                        placeholder="Enter your current password"
                        value={emailData.verifyPassword}
                        onChange={handleEmailDataChange}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => toggleEmailPasswordVisibility('verify')}
                      >
                        {showEmailPasswords.verify ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiMail size={18} />
                      New Email Address
                    </label>
                    <input
                      type="email"
                      name="newEmail"
                      className="form-control"
                      placeholder="Enter new email address"
                      value={emailData.newEmail}
                      onChange={handleEmailDataChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showEmailPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        className="form-control"
                        placeholder="Enter new password"
                        value={emailData.newPassword}
                        onChange={handleEmailDataChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => toggleEmailPasswordVisibility('new')}
                      >
                        {showEmailPasswords.new ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiLock size={18} />
                      Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showEmailPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        className="form-control"
                        placeholder="Confirm new password"
                        value={emailData.confirmPassword}
                        onChange={handleEmailDataChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => toggleEmailPasswordVisibility('confirm')}
                      >
                        {showEmailPasswords.confirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="password-form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowChangeEmail(false);
                        setEmailData({
                          verifyPassword: '',
                          newEmail: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Email
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          </div>

          {/* Reset Account Section */}
          <div className="reset-account-section">
            <div className="reset-account-warning">
              <FiAlertTriangle size={24} color="#ef4444" />
              <div>
                <h3>Danger Zone</h3>
                <p>Reset your account to delete all your financial data permanently.</p>
              </div>
            </div>
            <button 
              className="btn btn-danger"
              onClick={handleResetAccountClick}
            >
              <FiTrash2 size={18} />
              Reset Account
            </button>
          </div>

          {/* Delete Account Section */}
          <div className="delete-account-section">
            <div className="delete-account-warning">
              <FiAlertTriangle size={24} color="#dc2626" />
              <div>
                <h3>Delete Account Permanently</h3>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
            </div>
            <button 
              className="btn btn-danger-dark"
              onClick={handleDeleteAccountClick}
            >
              <FiTrash2 size={18} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Reset Warning Modal */}
      {showResetWarning && (
        <div className="modal-overlay" onClick={handleCancelReset}>
          <div className="modal-content reset-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FiAlertTriangle size={28} color="#ef4444" />
              <h2>Reset Account Confirmation</h2>
              <button className="modal-close" onClick={handleCancelReset}>&times;</button>
            </div>
            <div className="reset-warning-content">
              <p className="warning-text">
                <strong>Warning:</strong> This will permanently delete all your data:
              </p>
              <ul className="reset-data-list">
                <li>All salary records</li>
                <li>All expense entries</li>
                <li>All budget plans</li>
                <li>All money lent records</li>
                <li>All money borrowed records</li>
              </ul>
              <p className="warning-text">
                <strong>This action cannot be undone!</strong>
              </p>
              <p className="warning-text">
                An OTP will be sent to <strong>{user?.email}</strong> for verification.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelReset}
                disabled={sendingOTP}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleAcceptReset}
                disabled={sendingOTP}
              >
                {sendingOTP ? 'Sending OTP...' : 'I Accept, Send OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showResetOTP && (
        <div className="modal-overlay" onClick={handleCancelReset}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify OTP to Reset Account</h2>
              <button className="modal-close" onClick={handleCancelReset}>&times;</button>
            </div>
            <form onSubmit={handleResetAccountSubmit}>
              <div className="form-group">
                <label>
                  <FiMail size={18} />
                  Enter OTP sent to {user?.email}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter 6-digit OTP"
                  value={resetOTP}
                  onChange={(e) => setResetOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
                <small className="text-secondary">
                  Check your email inbox and spam folder for the OTP code.
                </small>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancelReset}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Verify & Reset Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarning && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content delete-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FiAlertTriangle size={28} color="#dc2626" />
              <h2>Delete Account Confirmation</h2>
              <button className="modal-close" onClick={handleCancelDelete}>&times;</button>
            </div>
            <div className="delete-warning-content">
              <p className="warning-text">
                <strong>Warning:</strong> This will permanently delete your account and all data:
              </p>
              <ul className="delete-data-list">
                <li>Your user account</li>
                <li>All salary records</li>
                <li>All expense entries</li>
                <li>All budget plans</li>
                <li>All money lent records</li>
                <li>All money borrowed records</li>
              </ul>
              <p className="warning-text">
                <strong>This action is irreversible!</strong>
              </p>
              <p className="warning-text">
                An OTP will be sent to <strong>{user?.email}</strong> for verification.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                disabled={sendingDeleteOTP}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger-dark"
                onClick={handleAcceptDelete}
                disabled={sendingDeleteOTP}
              >
                {sendingDeleteOTP ? 'Sending OTP...' : 'I Accept, Send OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete OTP Verification Modal */}
      {showDeleteOTP && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify OTP to Delete Account</h2>
              <button className="modal-close" onClick={handleCancelDelete}>&times;</button>
            </div>
            <form onSubmit={handleDeleteAccountSubmit}>
              <div className="form-group">
                <label>
                  <FiMail size={18} />
                  Enter OTP sent to {user?.email}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter 6-digit OTP"
                  value={deleteOTP}
                  onChange={(e) => setDeleteOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
                <small className="text-secondary">
                  Check your email inbox and spam folder for the OTP code.
                </small>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger-dark">
                  Verify & Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
