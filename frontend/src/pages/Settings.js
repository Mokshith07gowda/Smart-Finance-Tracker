import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiDroplet, FiSearch, FiRefreshCw, FiGlobe, FiCheck } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

const inputCls = 'w-full py-2.5 px-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400';
const sectionCls = 'card-elevated p-6 animate-fade-up';

const PRESET_THEMES = {
  'Light': [
    { name: 'Ocean Blue', colors: { primaryColor: '#0284c7', bgColor: '#f0f9ff', cardBg: '#ffffff', textPrimary: '#0c4a6e', textSecondary: '#64748b', sidebarBg: '#0c4a6e', accentColor: '#0ea5e9' } },
    { name: 'Forest Green', colors: { primaryColor: '#059669', bgColor: '#ecfdf5', cardBg: '#ffffff', textPrimary: '#064e3b', textSecondary: '#6b7280', sidebarBg: '#064e3b', accentColor: '#10b981' } },
    { name: 'Sunset Orange', colors: { primaryColor: '#ea580c', bgColor: '#fff7ed', cardBg: '#ffffff', textPrimary: '#7c2d12', textSecondary: '#78716c', sidebarBg: '#7c2d12', accentColor: '#f97316' } },
    { name: 'Rose Pink', colors: { primaryColor: '#e11d48', bgColor: '#fff1f2', cardBg: '#ffffff', textPrimary: '#881337', textSecondary: '#71717a', sidebarBg: '#881337', accentColor: '#f43f5e' } },
    { name: 'Royal Purple', colors: { primaryColor: '#7c3aed', bgColor: '#f5f3ff', cardBg: '#ffffff', textPrimary: '#3b0764', textSecondary: '#6b7280', sidebarBg: '#3b0764', accentColor: '#8b5cf6' } },
    { name: 'Golden Sand', colors: { primaryColor: '#b45309', bgColor: '#fffbeb', cardBg: '#ffffff', textPrimary: '#78350f', textSecondary: '#92400e', sidebarBg: '#78350f', accentColor: '#d97706' } },
    { name: 'Sky Breeze', colors: { primaryColor: '#0891b2', bgColor: '#ecfeff', cardBg: '#ffffff', textPrimary: '#164e63', textSecondary: '#6b7280', sidebarBg: '#164e63', accentColor: '#06b6d4' } },
    { name: 'Clean Slate', colors: { primaryColor: '#475569', bgColor: '#f8fafc', cardBg: '#ffffff', textPrimary: '#1e293b', textSecondary: '#64748b', sidebarBg: '#1e293b', accentColor: '#6366f1' } },
  ],
  'Dark': [
    { name: 'Midnight', colors: { primaryColor: '#6366f1', bgColor: '#0f172a', cardBg: '#1e293b', textPrimary: '#e2e8f0', textSecondary: '#94a3b8', sidebarBg: '#020617', accentColor: '#818cf8' } },
    { name: 'Dracula', colors: { primaryColor: '#bd93f9', bgColor: '#282a36', cardBg: '#44475a', textPrimary: '#f8f8f2', textSecondary: '#6272a4', sidebarBg: '#191a21', accentColor: '#ff79c6' } },
    { name: 'Monokai', colors: { primaryColor: '#a6e22e', bgColor: '#272822', cardBg: '#3e3d32', textPrimary: '#f8f8f2', textSecondary: '#75715e', sidebarBg: '#1e1f1c', accentColor: '#f92672' } },
    { name: 'Nord Dark', colors: { primaryColor: '#88c0d0', bgColor: '#2e3440', cardBg: '#3b4252', textPrimary: '#eceff4', textSecondary: '#d8dee9', sidebarBg: '#242933', accentColor: '#81a1c1' } },
    { name: 'Ayu Dark', colors: { primaryColor: '#ffb454', bgColor: '#0b0e14', cardBg: '#1c1f27', textPrimary: '#bfbdb6', textSecondary: '#565b66', sidebarBg: '#07090d', accentColor: '#e6b450' } },
    { name: 'Catppuccin', colors: { primaryColor: '#cba6f7', bgColor: '#1e1e2e', cardBg: '#313244', textPrimary: '#cdd6f4', textSecondary: '#a6adc8', sidebarBg: '#11111b', accentColor: '#f5c2e7' } },
    { name: 'Tokyo Night', colors: { primaryColor: '#7aa2f7', bgColor: '#1a1b26', cardBg: '#24283b', textPrimary: '#c0caf5', textSecondary: '#565f89', sidebarBg: '#16161e', accentColor: '#bb9af7' } },
    { name: 'Gruvbox Dark', colors: { primaryColor: '#fabd2f', bgColor: '#282828', cardBg: '#3c3836', textPrimary: '#ebdbb2', textSecondary: '#a89984', sidebarBg: '#1d2021', accentColor: '#fb4934' } },
  ],
  'Nature': [
    { name: 'Cherry Blossom', colors: { primaryColor: '#db2777', bgColor: '#fdf2f8', cardBg: '#ffffff', textPrimary: '#831843', textSecondary: '#9d174d', sidebarBg: '#831843', accentColor: '#ec4899' } },
    { name: 'Autumn Leaves', colors: { primaryColor: '#c2410c', bgColor: '#fef3c7', cardBg: '#fffbeb', textPrimary: '#7c2d12', textSecondary: '#92400e', sidebarBg: '#451a03', accentColor: '#ea580c' } },
    { name: 'Arctic Ice', colors: { primaryColor: '#2563eb', bgColor: '#eff6ff', cardBg: '#ffffff', textPrimary: '#1e3a5f', textSecondary: '#60a5fa', sidebarBg: '#1e3a5f', accentColor: '#3b82f6' } },
    { name: 'Lavender Fields', colors: { primaryColor: '#a855f7', bgColor: '#faf5ff', cardBg: '#ffffff', textPrimary: '#581c87', textSecondary: '#7e22ce', sidebarBg: '#3b0764', accentColor: '#c084fc' } },
  ],
  'Professional': [
    { name: 'Corporate Blue', colors: { primaryColor: '#1d4ed8', bgColor: '#f1f5f9', cardBg: '#ffffff', textPrimary: '#1e293b', textSecondary: '#64748b', sidebarBg: '#1e293b', accentColor: '#3b82f6' } },
    { name: 'Executive Gray', colors: { primaryColor: '#374151', bgColor: '#f3f4f6', cardBg: '#ffffff', textPrimary: '#111827', textSecondary: '#6b7280', sidebarBg: '#111827', accentColor: '#4b5563' } },
    { name: 'Fintech Emerald', colors: { primaryColor: '#047857', bgColor: '#f0fdf4', cardBg: '#ffffff', textPrimary: '#14532d', textSecondary: '#6b7280', sidebarBg: '#14532d', accentColor: '#10b981' } },
    { name: 'Banking Navy', colors: { primaryColor: '#1e40af', bgColor: '#eff6ff', cardBg: '#ffffff', textPrimary: '#172554', textSecondary: '#64748b', sidebarBg: '#172554', accentColor: '#2563eb' } },
  ],
};

const Settings = () => {
  const { theme, setLightTheme, setDarkTheme, setCustomTheme, customColors, updateCustomColor, resetCustomColors } = useContext(ThemeContext);
  const { country, countries, changeCountry, ratesLoaded, ratesError, exchangeRates } = useContext(CurrencyContext);
  const { language, changeLanguage, t, languages } = useContext(LanguageContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const navigate = useNavigate();

  const handleCountrySelect = async (countryCode) => {
    await changeCountry(countryCode);
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

  const colorPickers = [
    { label: 'Primary Color', key: 'primaryColor' },
    { label: 'Accent Color', key: 'accentColor' },
    { label: 'Background', key: 'bgColor' },
    { label: 'Card Background', key: 'cardBg' },
    { label: 'Text Color', key: 'textPrimary' },
    { label: 'Secondary Text', key: 'textSecondary' },
    { label: 'Sidebar / Navbar', key: 'sidebarBg' },
  ];

  const filteredLangs = languages.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const themeOptions = [
    { key: 'light', label: t('set_light'), desc: t('set_light_desc'), icon: <FiSun size={20} />, onClick: setLightTheme, preview: 'bg-white border-slate-200', previewBar: 'bg-slate-100' },
    { key: 'dark', label: t('set_dark'), desc: t('set_dark_desc'), icon: <FiMoon size={20} />, onClick: setDarkTheme, preview: 'bg-slate-800 border-slate-700', previewBar: 'bg-slate-900' },
    { key: 'custom', label: t('set_custom'), desc: t('set_custom_desc'), icon: <FiDroplet size={20} />, onClick: setCustomTheme, preview: null, previewBar: null },
  ];

  const [mobileTab, setMobileTab] = useState('currency');

  const mobileTabs = [
    { key: 'currency', label: t('set_country'), icon: '💱' },
    { key: 'language', label: t('set_language'), icon: '🌐' },
    { key: 'theme', label: t('set_appearance'), icon: '🎨' },
  ];

  return (
    <div className="container mt-10 mb-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('set_title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('set_subtitle')}</p>
      </div>

      {/* Mobile Tab Buttons — visible only on small screens, sticky on scroll */}
      <div className="flex gap-2 mb-5 md:hidden sticky top-[60px] z-[100] bg-white dark:bg-surface-900 py-3 -mx-4 px-4">
        {mobileTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-2 cursor-pointer transition-all ${
              mobileTab === tab.key
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Column 1: Country & Currency */}
        <div className={`${sectionCls} ${mobileTab !== 'currency' ? 'hidden md:block' : ''}`}>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{t('set_country')}</h2>
          <p className="text-xs text-slate-500 mb-4">{t('set_country_desc')}</p>

          <div className="flex items-center gap-3 p-3 bg-primary-light rounded-xl mb-4">
            <span className="text-3xl">{country.flag}</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{country.name}</h3>
              <p className="text-xs text-slate-500">{country.currency} ({country.symbol})</p>
              {ratesLoaded && <p className="text-[11px] text-emerald-600 font-medium mt-0.5">✓ Live rates ({Object.keys(exchangeRates).length} currencies)</p>}
              {ratesError && <p className="text-[11px] text-red-500 font-medium mt-0.5">⚠ Using fallback rates</p>}
              {!ratesLoaded && !ratesError && <p className="text-[11px] text-slate-400 mt-0.5">Loading exchange rates...</p>}
            </div>
          </div>

          <div className="relative mb-4">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={t('set_search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputCls} pl-9`} />
          </div>

          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
            {filteredCountries.map((c) => (
              <div key={c.code} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${country.code === c.code ? 'bg-primary-light ring-1 ring-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`} onClick={() => handleCountrySelect(c.code)}>
                <span className="text-xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{c.currency} ({c.symbol})</p>
                </div>
                {country.code === c.code && <span className="text-primary font-bold text-sm">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Language */}
        <div className={`${sectionCls} ${mobileTab !== 'language' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <FiGlobe size={18} className="text-primary" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('set_language')}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">{t('set_language_desc')}</p>

          <div className="relative mb-4">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={t('set_search_lang')} value={langSearch} onChange={(e) => setLangSearch(e.target.value)} className={`${inputCls} pl-9`} />
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredLangs.map((lang) => (
              <div
                key={lang.code}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  language === lang.code
                    ? 'bg-primary-light ring-2 ring-primary shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700'
                }`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{lang.native}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{lang.name}</p>
                </div>
                {language === lang.code && (
                  <FiCheck size={18} className="text-primary shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Appearance / Theme */}
        <div className={`${sectionCls} ${mobileTab !== 'theme' ? 'hidden md:block' : ''}`}>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{t('set_appearance')}</h2>
          <p className="text-xs text-slate-500 mb-4">{t('set_appearance_desc')}</p>

          {/* Row 1: Light & Dark */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {themeOptions.filter(o => o.key !== 'custom').map(opt => (
              <div key={opt.key} className={`rounded-xl border-2 p-3 cursor-pointer transition-all ${theme === opt.key ? 'border-primary shadow-glow' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`} onClick={opt.onClick}>
                <div className={`w-full h-14 rounded-lg mb-2 overflow-hidden ${opt.preview || ''}`}>
                  <div className={`h-3 ${opt.previewBar || ''}`} />
                  <div className="flex gap-1 p-1.5">
                    <div className={`flex-1 h-3 rounded ${opt.key === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />
                    <div className={`flex-1 h-3 rounded ${opt.key === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${opt.key === 'light' ? 'bg-amber-400' : 'bg-indigo-600'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{opt.label}</h3>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Custom Theme (full width) */}
          <div className={`rounded-xl border-2 p-3 cursor-pointer transition-all ${theme === 'custom' ? 'border-primary shadow-glow' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`} onClick={setCustomTheme}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${customColors.primaryColor}, ${customColors.accentColor})` }}>
                <FiDroplet size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('set_custom')}</h3>
                <p className="text-[10px] text-slate-500">{t('set_custom_desc')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {[customColors.primaryColor, customColors.accentColor, customColors.sidebarBg, customColors.bgColor].map((c, i) => (
                  <span key={i} className="w-5 h-5 rounded-full ring-1 ring-slate-200 dark:ring-slate-600" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Custom Colors Expanded */}
          {theme === 'custom' && (
            <div className="animate-fade-up mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('set_customize')}</h3>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover bg-transparent border-none cursor-pointer" onClick={resetCustomColors}><FiRefreshCw size={12} /> {t('set_reset')}</button>
              </div>

              <div className="max-h-[260px] overflow-y-auto pr-1 mb-4 space-y-3">
                {Object.entries(PRESET_THEMES).map(([category, presets]) => (
                  <div key={category}>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{category}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {presets.map((preset) => (
                        <button key={preset.name} title={preset.name} className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer group" onClick={() => { Object.entries(preset.colors).forEach(([key, value]) => { updateCustomColor(key, value); }); }}>
                          <span className="w-8 h-8 rounded-md shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary group-hover:scale-110 transition-all" style={{ background: `linear-gradient(135deg, ${preset.colors.primaryColor}, ${preset.colors.accentColor})` }} />
                          <span className="text-[8px] font-semibold text-slate-500 truncate w-full text-center leading-tight">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {colorPickers.map(cp => (
                  <div key={cp.key} className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <input type="color" value={customColors[cp.key]} onChange={(e) => updateCustomColor(cp.key, e.target.value)} className="w-7 h-7 rounded-md border-none cursor-pointer shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{cp.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono shrink-0">{customColors[cp.key]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
