import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiDroplet, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { CurrencyContext } from '../context/CurrencyContext';
import './Settings.css';

const PRESET_THEMES = [
  { name: 'Ocean Blue', colors: { primaryColor: '#0284c7', bgColor: '#f0f9ff', cardBg: '#ffffff', textPrimary: '#0c4a6e', textSecondary: '#64748b', sidebarBg: '#0c4a6e', accentColor: '#0ea5e9' } },
  { name: 'Forest Green', colors: { primaryColor: '#059669', bgColor: '#ecfdf5', cardBg: '#ffffff', textPrimary: '#064e3b', textSecondary: '#6b7280', sidebarBg: '#064e3b', accentColor: '#10b981' } },
  { name: 'Sunset Orange', colors: { primaryColor: '#ea580c', bgColor: '#fff7ed', cardBg: '#ffffff', textPrimary: '#7c2d12', textSecondary: '#78716c', sidebarBg: '#7c2d12', accentColor: '#f97316' } },
  { name: 'Rose Pink', colors: { primaryColor: '#e11d48', bgColor: '#fff1f2', cardBg: '#ffffff', textPrimary: '#881337', textSecondary: '#71717a', sidebarBg: '#881337', accentColor: '#f43f5e' } },
  { name: 'Royal Purple', colors: { primaryColor: '#7c3aed', bgColor: '#f5f3ff', cardBg: '#ffffff', textPrimary: '#3b0764', textSecondary: '#6b7280', sidebarBg: '#3b0764', accentColor: '#8b5cf6' } },
  { name: 'Midnight', colors: { primaryColor: '#6366f1', bgColor: '#0f172a', cardBg: '#1e293b', textPrimary: '#e2e8f0', textSecondary: '#94a3b8', sidebarBg: '#020617', accentColor: '#818cf8' } },
  { name: 'Dracula', colors: { primaryColor: '#bd93f9', bgColor: '#282a36', cardBg: '#44475a', textPrimary: '#f8f8f2', textSecondary: '#6272a4', sidebarBg: '#191a21', accentColor: '#ff79c6' } },
  { name: 'Monokai', colors: { primaryColor: '#a6e22e', bgColor: '#272822', cardBg: '#3e3d32', textPrimary: '#f8f8f2', textSecondary: '#75715e', sidebarBg: '#1e1f1c', accentColor: '#f92672' } },
];

const Settings = () => {
  const { theme, setLightTheme, setDarkTheme, setCustomTheme, customColors, updateCustomColor, resetCustomColors } = useContext(ThemeContext);
  const { country, countries, changeCountry } = useContext(CurrencyContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleCountrySelect = (countryCode) => {
    changeCountry(countryCode);
    // Navigate to dashboard after currency change
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="settings-page fade-in">
      <div className="container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Customize your app experience</p>
        </div>

        <div className="settings-layout">
          {/* Left Fixed Panel — Country & Currency */}
          <div className="settings-left-panel">
            <div className="settings-section card">
              <h2>Country & Currency</h2>
              <p className="section-description">
                Select your country to set the currency format across the app
              </p>

              <div className="current-currency">
                <span className="current-flag">{country.flag}</span>
                <div className="current-details">
                  <h3>{country.name}</h3>
                  <p>{country.currency} ({country.symbol})</p>
                </div>
              </div>

              <div className="country-search">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Search country or currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="country-grid">
                {filteredCountries.map((c) => (
                  <div
                    key={c.code}
                    className={`country-card ${country.code === c.code ? 'selected' : ''}`}
                    onClick={() => handleCountrySelect(c.code)}
                  >
                    <span className="country-flag">{c.flag}</span>
                    <div className="country-info">
                      <h4>{c.name}</h4>
                      <p>{c.currency} ({c.symbol})</p>
                    </div>
                    {country.code === c.code && <div className="country-check">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content — Appearance */}
          <div className="settings-right-content">
            <div className="settings-section card">
              <h2>Appearance</h2>
              <p className="section-description">Choose your preferred theme</p>

          <div className="theme-options">
            <div
              className={`theme-card ${theme === 'light' ? 'selected' : ''}`}
              onClick={setLightTheme}
            >
              <div className="theme-preview light-preview">
                <div className="preview-navbar"></div>
                <div className="preview-content">
                  <div className="preview-card"></div>
                  <div className="preview-card"></div>
                </div>
              </div>
              <div className="theme-info">
                <div className="theme-icon light-icon">
                  <FiSun size={24} />
                </div>
                <div>
                  <h3>Light Theme</h3>
                  <p>Clean and bright interface</p>
                </div>
              </div>
              {theme === 'light' && <div className="theme-check">✓</div>}
            </div>

            <div
              className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
              onClick={setDarkTheme}
            >
              <div className="theme-preview dark-preview">
                <div className="preview-navbar"></div>
                <div className="preview-content">
                  <div className="preview-card"></div>
                  <div className="preview-card"></div>
                </div>
              </div>
              <div className="theme-info">
                <div className="theme-icon dark-icon">
                  <FiMoon size={24} />
                </div>
                <div>
                  <h3>Dark Theme</h3>
                  <p>Easy on the eyes at night</p>
                </div>
              </div>
              {theme === 'dark' && <div className="theme-check">✓</div>}
            </div>

            <div
              className={`theme-card ${theme === 'custom' ? 'selected' : ''}`}
              onClick={setCustomTheme}
            >
              <div className="theme-preview custom-preview" style={{
                background: `linear-gradient(135deg, ${customColors.primaryColor}, ${customColors.accentColor})`
              }}>
                <div className="preview-navbar" style={{ backgroundColor: customColors.sidebarBg }}></div>
                <div className="preview-content">
                  <div className="preview-card" style={{ backgroundColor: customColors.cardBg, border: 'none' }}></div>
                  <div className="preview-card" style={{ backgroundColor: customColors.cardBg, border: 'none' }}></div>
                </div>
              </div>
              <div className="theme-info">
                <div className="theme-icon custom-icon" style={{
                  background: `linear-gradient(135deg, ${customColors.primaryColor}, ${customColors.accentColor})`
                }}>
                  <FiDroplet size={24} />
                </div>
                <div>
                  <h3>Custom Theme</h3>
                  <p>Pick your own colors</p>
                </div>
              </div>
              {theme === 'custom' && <div className="theme-check">✓</div>}
            </div>
          </div>

          {/* Custom Color Picker Section */}
          {theme === 'custom' && (
            <div className="custom-theme-section">
              <div className="custom-theme-header">
                <h3>Customize Colors</h3>
                <button className="btn btn-sm btn-outline" onClick={resetCustomColors}>
                  <FiRefreshCw size={14} /> Reset
                </button>
              </div>

              {/* Preset Themes */}
              <div className="preset-themes">
                <p className="preset-label">Quick Presets</p>
                <div className="preset-grid">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.name}
                      className="preset-btn"
                      title={preset.name}
                      onClick={() => {
                        Object.entries(preset.colors).forEach(([key, value]) => {
                          updateCustomColor(key, value);
                        });
                      }}
                    >
                      <span className="preset-swatch" style={{
                        background: `linear-gradient(135deg, ${preset.colors.primaryColor}, ${preset.colors.accentColor})`
                      }}></span>
                      <span className="preset-name">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Color Pickers */}
              <div className="color-pickers">
                <div className="color-picker-item">
                  <label>Primary Color</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.primaryColor}
                      onChange={(e) => updateCustomColor('primaryColor', e.target.value)}
                    />
                    <span className="color-hex">{customColors.primaryColor}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Accent Color</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.accentColor}
                      onChange={(e) => updateCustomColor('accentColor', e.target.value)}
                    />
                    <span className="color-hex">{customColors.accentColor}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Background</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.bgColor}
                      onChange={(e) => updateCustomColor('bgColor', e.target.value)}
                    />
                    <span className="color-hex">{customColors.bgColor}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Card Background</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.cardBg}
                      onChange={(e) => updateCustomColor('cardBg', e.target.value)}
                    />
                    <span className="color-hex">{customColors.cardBg}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Text Color</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.textPrimary}
                      onChange={(e) => updateCustomColor('textPrimary', e.target.value)}
                    />
                    <span className="color-hex">{customColors.textPrimary}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Secondary Text</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.textSecondary}
                      onChange={(e) => updateCustomColor('textSecondary', e.target.value)}
                    />
                    <span className="color-hex">{customColors.textSecondary}</span>
                  </div>
                </div>
                <div className="color-picker-item">
                  <label>Sidebar / Navbar</label>
                  <div className="picker-row">
                    <input
                      type="color"
                      value={customColors.sidebarBg}
                      onChange={(e) => updateCustomColor('sidebarBg', e.target.value)}
                    />
                    <span className="color-hex">{customColors.sidebarBg}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
