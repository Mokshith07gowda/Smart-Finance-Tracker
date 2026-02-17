import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

const COUNTRIES = [
  // ─── South Asia ───
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', symbol: '₨', locale: 'en-PK', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳', locale: 'bn-BD', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', symbol: 'Rs', locale: 'si-LK', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', symbol: 'Rs', locale: 'ne-NP', flag: '🇳🇵' },
  { code: 'AF', name: 'Afghanistan', currency: 'AFN', symbol: '؋', locale: 'ps-AF', flag: '🇦🇫' },
  { code: 'BT', name: 'Bhutan', currency: 'BTN', symbol: 'Nu', locale: 'dz-BT', flag: '🇧🇹' },
  { code: 'MV', name: 'Maldives', currency: 'MVR', symbol: 'Rf', locale: 'dv-MV', flag: '🇲🇻' },
  // ─── North America ───
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: 'MX$', locale: 'es-MX', flag: '🇲🇽' },
  // ─── Central America & Caribbean ───
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', symbol: 'Q', locale: 'es-GT', flag: '🇬🇹' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', symbol: '₡', locale: 'es-CR', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', currency: 'PAB', symbol: 'B/', locale: 'es-PA', flag: '🇵🇦' },
  { code: 'HN', name: 'Honduras', currency: 'HNL', symbol: 'L', locale: 'es-HN', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO', symbol: 'C$', locale: 'es-NI', flag: '🇳🇮' },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP', symbol: 'RD$', locale: 'es-DO', flag: '🇩🇴' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$', locale: 'en-JM', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD', symbol: 'TT$', locale: 'en-TT', flag: '🇹🇹' },
  { code: 'CU', name: 'Cuba', currency: 'CUP', symbol: '$', locale: 'es-CU', flag: '🇨🇺' },
  { code: 'HT', name: 'Haiti', currency: 'HTG', symbol: 'G', locale: 'fr-HT', flag: '🇭🇹' },
  { code: 'BZ', name: 'Belize', currency: 'BZD', symbol: 'BZ$', locale: 'en-BZ', flag: '🇧🇿' },
  // ─── South America ───
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', locale: 'pt-BR', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: 'AR$', locale: 'es-AR', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: 'CL$', locale: 'es-CL', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', currency: 'COP', symbol: 'CO$', locale: 'es-CO', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', currency: 'PEN', symbol: 'S/', locale: 'es-PE', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', currency: 'VES', symbol: 'Bs', locale: 'es-VE', flag: '🇻🇪' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', symbol: '$U', locale: 'es-UY', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', symbol: '₲', locale: 'es-PY', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', currency: 'BOB', symbol: 'Bs', locale: 'es-BO', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', symbol: '$', locale: 'es-EC', flag: '🇪🇨' },
  { code: 'GY', name: 'Guyana', currency: 'GYD', symbol: 'G$', locale: 'en-GY', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', currency: 'SRD', symbol: 'SR$', locale: 'nl-SR', flag: '🇸🇷' },
  // ─── Europe ───
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'EU', name: 'Europe (Euro)', currency: 'EUR', symbol: '€', locale: 'en-IE', flag: '🇪🇺' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', locale: 'de-CH', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', locale: 'sv-SE', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr', locale: 'nb-NO', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr', locale: 'da-DK', flag: '🇩🇰' },
  { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł', locale: 'pl-PL', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', symbol: 'Kč', locale: 'cs-CZ', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', symbol: 'Ft', locale: 'hu-HU', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', currency: 'RON', symbol: 'lei', locale: 'ro-RO', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', currency: 'BGN', symbol: 'лв', locale: 'bg-BG', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', currency: 'EUR', symbol: '€', locale: 'hr-HR', flag: '🇭🇷' },
  { code: 'RS', name: 'Serbia', currency: 'RSD', symbol: 'din', locale: 'sr-RS', flag: '🇷🇸' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH', symbol: '₴', locale: 'uk-UA', flag: '🇺🇦' },
  { code: 'RU', name: 'Russia', currency: 'RUB', symbol: '₽', locale: 'ru-RU', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺', locale: 'tr-TR', flag: '🇹🇷' },
  { code: 'IS', name: 'Iceland', currency: 'ISK', symbol: 'kr', locale: 'is-IS', flag: '🇮🇸' },
  { code: 'GE', name: 'Georgia', currency: 'GEL', symbol: '₾', locale: 'ka-GE', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', currency: 'AMD', symbol: '֏', locale: 'hy-AM', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', currency: 'AZN', symbol: '₼', locale: 'az-AZ', flag: '🇦🇿' },
  { code: 'BY', name: 'Belarus', currency: 'BYN', symbol: 'Br', locale: 'be-BY', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', currency: 'MDL', symbol: 'L', locale: 'ro-MD', flag: '🇲🇩' },
  { code: 'AL', name: 'Albania', currency: 'ALL', symbol: 'L', locale: 'sq-AL', flag: '🇦🇱' },
  { code: 'MK', name: 'North Macedonia', currency: 'MKD', symbol: 'ден', locale: 'mk-MK', flag: '🇲🇰' },
  { code: 'BA', name: 'Bosnia & Herzegovina', currency: 'BAM', symbol: 'KM', locale: 'bs-BA', flag: '🇧🇦' },
  // ─── East Asia ───
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', locale: 'ko-KR', flag: '🇰🇷' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD', symbol: 'NT$', locale: 'zh-TW', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', symbol: 'HK$', locale: 'en-HK', flag: '🇭🇰' },
  { code: 'MN', name: 'Mongolia', currency: 'MNT', symbol: '₮', locale: 'mn-MN', flag: '🇲🇳' },
  // ─── Southeast Asia ───
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', locale: 'ms-MY', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', locale: 'th-TH', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', locale: 'id-ID', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', locale: 'en-PH', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', locale: 'vi-VN', flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', currency: 'MMK', symbol: 'K', locale: 'my-MM', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', currency: 'KHR', symbol: '៛', locale: 'km-KH', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', currency: 'LAK', symbol: '₭', locale: 'lo-LA', flag: '🇱🇦' },
  { code: 'BN', name: 'Brunei', currency: 'BND', symbol: 'B$', locale: 'ms-BN', flag: '🇧🇳' },
  // ─── Central Asia ───
  { code: 'KZ', name: 'Kazakhstan', currency: 'KZT', symbol: '₸', locale: 'kk-KZ', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', currency: 'UZS', symbol: 'сўм', locale: 'uz-UZ', flag: '🇺🇿' },
  { code: 'KG', name: 'Kyrgyzstan', currency: 'KGS', symbol: 'сом', locale: 'ky-KG', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', currency: 'TJS', symbol: 'SM', locale: 'tg-TJ', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', currency: 'TMT', symbol: 'T', locale: 'tk-TM', flag: '🇹🇲' },
  // ─── Middle East ───
  { code: 'AE', name: 'UAE', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', locale: 'ar-SA', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: 'QR', locale: 'ar-QA', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك', locale: 'ar-KW', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: 'BD', locale: 'ar-BH', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', currency: 'OMR', symbol: 'ر.ع', locale: 'ar-OM', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', currency: 'JOD', symbol: 'JD', locale: 'ar-JO', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', currency: 'LBP', symbol: 'ل.ل', locale: 'ar-LB', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', currency: 'IQD', symbol: 'ع.د', locale: 'ar-IQ', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', currency: 'IRR', symbol: '﷼', locale: 'fa-IR', flag: '🇮🇷' },
  { code: 'IL', name: 'Israel', currency: 'ILS', symbol: '₪', locale: 'he-IL', flag: '🇮🇱' },
  { code: 'SY', name: 'Syria', currency: 'SYP', symbol: '£S', locale: 'ar-SY', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', currency: 'YER', symbol: '﷼', locale: 'ar-YE', flag: '🇾🇪' },
  // ─── Oceania ───
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', currency: 'FJD', symbol: 'FJ$', locale: 'en-FJ', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', currency: 'PGK', symbol: 'K', locale: 'en-PG', flag: '🇵🇬' },
  // ─── Africa ───
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', locale: 'en-ZA', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', locale: 'en-NG', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', locale: 'ar-EG', flag: '🇪🇬' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', locale: 'en-KE', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: 'GH₵', locale: 'en-GH', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh', locale: 'sw-TZ', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh', locale: 'en-UG', flag: '🇺🇬' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', symbol: 'Br', locale: 'am-ET', flag: '🇪🇹' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', symbol: 'MAD', locale: 'ar-MA', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', currency: 'TND', symbol: 'DT', locale: 'ar-TN', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', currency: 'DZD', symbol: 'DA', locale: 'ar-DZ', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', currency: 'LYD', symbol: 'LD', locale: 'ar-LY', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', currency: 'SDG', symbol: 'ج.س', locale: 'ar-SD', flag: '🇸🇩' },
  { code: 'AO', name: 'Angola', currency: 'AOA', symbol: 'Kz', locale: 'pt-AO', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', symbol: 'MT', locale: 'pt-MZ', flag: '🇲🇿' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'ZK', locale: 'en-ZM', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', symbol: 'Z$', locale: 'en-ZW', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', symbol: 'P', locale: 'en-BW', flag: '🇧🇼' },
  { code: 'MU', name: 'Mauritius', currency: 'MUR', symbol: '₨', locale: 'en-MU', flag: '🇲🇺' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'RF', locale: 'rw-RW', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', symbol: 'CFA', locale: 'fr-SN', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', symbol: 'CFA', locale: 'fr-CI', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', symbol: 'FCFA', locale: 'fr-CM', flag: '🇨🇲' },
  { code: 'CD', name: 'Congo (DRC)', currency: 'CDF', symbol: 'FC', locale: 'fr-CD', flag: '🇨🇩' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA', symbol: 'Ar', locale: 'mg-MG', flag: '🇲🇬' },
  { code: 'SC', name: 'Seychelles', currency: 'SCR', symbol: '₨', locale: 'en-SC', flag: '🇸🇨' },
  { code: 'GM', name: 'Gambia', currency: 'GMD', symbol: 'D', locale: 'en-GM', flag: '🇬🇲' },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLE', symbol: 'Le', locale: 'en-SL', flag: '🇸🇱' },
  { code: 'SO', name: 'Somalia', currency: 'SOS', symbol: 'Sh', locale: 'so-SO', flag: '🇸🇴' },
  { code: 'ER', name: 'Eritrea', currency: 'ERN', symbol: 'Nfk', locale: 'ti-ER', flag: '🇪🇷' },
  { code: 'DJ', name: 'Djibouti', currency: 'DJF', symbol: 'Fdj', locale: 'fr-DJ', flag: '🇩🇯' },
  { code: 'MW', name: 'Malawi', currency: 'MWK', symbol: 'MK', locale: 'en-MW', flag: '🇲🇼' },
  { code: 'NA', name: 'Namibia', currency: 'NAD', symbol: 'N$', locale: 'en-NA', flag: '🇳🇦' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL', symbol: 'L', locale: 'en-LS', flag: '🇱🇸' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', symbol: 'E', locale: 'en-SZ', flag: '🇸🇿' },
  // ─── Other ───
  { code: 'MM2', name: 'West Africa (CFA)', currency: 'XOF', symbol: 'CFA', locale: 'fr-SN', flag: '🌍' },
  { code: 'CM2', name: 'Central Africa (CFA)', currency: 'XAF', symbol: 'FCFA', locale: 'fr-CM', flag: '🌍' },
];

export const CurrencyProvider = ({ children }) => {
  const [countryCode, setCountryCode] = useState(() => {
    return localStorage.getItem('countryCode') || 'IN';
  });

  const [exchangeRates, setExchangeRates] = useState({ INR: 1 });
  const [ratesLoaded, setRatesLoaded] = useState(false);

  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Fetch live exchange rates from our backend
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await axios.get('/api/exchange-rates');
        if (response.data.success && response.data.rates) {
          setExchangeRates(response.data.rates);
          setRatesLoaded(true);
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates from server');
      }
    };

    fetchRates();

    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('countryCode', countryCode);
  }, [countryCode]);

  // Convert from INR (base) to selected currency
  const convertFromBase = useCallback((amountInINR) => {
    if (!amountInINR || isNaN(amountInINR)) return 0;
    const rate = exchangeRates[country.currency] || 1;
    return Number(amountInINR) * rate;
  }, [country.currency, exchangeRates]);

  // Convert from selected currency to INR (base) for storage
  const convertToBase = useCallback((amountInUserCurrency) => {
    if (!amountInUserCurrency || isNaN(amountInUserCurrency)) return 0;
    const rate = exchangeRates[country.currency] || 1;
    return Number(amountInUserCurrency) / rate;
  }, [country.currency, exchangeRates]);

  // Format amount: converts from INR to selected currency, then formats with symbol
  // Always use en-US locale for consistent dot decimal separator (558.35 not 558,35)
  const formatCurrency = useCallback((amountInINR) => {
    if (amountInINR === null || amountInINR === undefined || isNaN(amountInINR)) return `${country.symbol}0`;
    const converted = convertFromBase(amountInINR);
    return `${country.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }, [country, convertFromBase]);

  const changeCountry = (code) => {
    setCountryCode(code);
  };

  return (
    <CurrencyContext.Provider value={{
      country,
      countries: COUNTRIES,
      countryCode,
      changeCountry,
      formatCurrency,
      convertFromBase,
      convertToBase,
      ratesLoaded,
      currencySymbol: country.symbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
