const express = require('express');
const router = express.Router();
const https = require('https');

// In-memory cache
let cachedRates = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for fresher rates

// Currencies we need rates for (all world currencies)
const TARGET_CURRENCIES = [
  // Major
  'USD','GBP','EUR','JPY','CNY','AUD','CAD','CHF',
  // South Asia
  'PKR','BDT','LKR','NPR','AFN','BTN','MVR',
  // Middle East
  'AED','SAR','QAR','KWD','BHD','OMR','JOD','LBP','IQD','IRR','ILS','SYP','YER',
  // East & Southeast Asia
  'KRW','TWD','HKD','MNT','SGD','MYR','THB','IDR','PHP','VND','MMK','KHR','LAK','BND',
  // Central Asia
  'KZT','UZS','KGS','TJS','TMT',
  // Europe
  'SEK','NOK','DKK','PLN','CZK','HUF','RON','BGN','RSD','UAH','RUB','TRY','ISK','GEL','AMD','AZN','BYN','MDL','ALL','MKD','BAM',
  // Americas
  'MXN','BRL','ARS','CLP','COP','PEN','VES','UYU','PYG','BOB','GYD','SRD','GTQ','CRC','PAB','HNL','NIO','DOP','JMD','TTD','CUP','HTG','BZD',
  // Oceania
  'NZD','FJD','PGK',
  // Africa
  'ZAR','NGN','EGP','KES','GHS','TZS','UGX','ETB','MAD','TND','DZD','LYD','SDG','AOA','MZN','ZMW','ZWL','BWP','MUR','RWF','XOF','XAF','CDF','MGA','SCR','GMD','SLE','SOS','ERN','DJF','MWK','NAD','LSL','SZL'
];

// Fetch raw text/html from a URL (quick timeout for scraping)
function fetchRaw(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    const req = https.get(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchRaw(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// Fetch JSON from a URL
function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers
      }
    };
    const req = https.get(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location, options).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// Popular currencies to scrape from Google Finance (real-time, most accurate)
// Keep this small (~20) since each requires a separate page fetch (~1MB each)
const GOOGLE_FINANCE_CURRENCIES = [
  'USD','GBP','EUR','JPY','CNY','AUD','CAD','CHF','AED','SGD',
  'KRW','BRL','RUB','ZAR','MXN','SEK','NZD','THB','MYR','PKR',
  'LKR','SAR','TRY','INR'
];

// ─── SOURCE 1: Google Finance Scraping (real-time mid-market rates) ───
async function fetchGoogleFinanceRates() {
  const rates = { INR: 1 };

  // Only scrape popular currencies to keep it fast (batches of 4)
  const batchSize = 4;
  for (let i = 0; i < GOOGLE_FINANCE_CURRENCIES.length; i += batchSize) {
    const batch = GOOGLE_FINANCE_CURRENCIES.slice(i, i + batchSize);
    const promises = batch.map(async (target) => {
      try {
        const html = await fetchRaw(`https://www.google.com/finance/quote/INR-${target}`, 8000);
        const match = html.match(/data-last-price="([\d.]+)"/);
        if (match) {
          rates[target] = parseFloat(match[1]);
        }
      } catch (e) { /* skip this currency */ }
    });
    await Promise.all(promises);
  }

  const count = Object.keys(rates).length - 1;
  if (count >= 5) {
    console.log(`✅ Google Finance rates fetched (${count}/${GOOGLE_FINANCE_CURRENCIES.length} popular currencies) — real-time mid-market`);
    return rates;
  }
  throw new Error(`Google Finance returned only ${count} currencies`);
}

// ─── SOURCE 2: Frankfurter API (ECB data — closest to xe.com in testing) ───
async function fetchFrankfurterRates() {
  const data = await fetchJSON(`https://api.frankfurter.app/latest?from=INR&to=${TARGET_CURRENCIES.join(',')}`);
  if (!data || !data.rates) throw new Error('No Frankfurter data');
  const rates = { INR: 1 };
  for (const [key, value] of Object.entries(data.rates)) {
    rates[key] = value;
  }
  console.log(`✅ Frankfurter (ECB) rates fetched (${Object.keys(rates).length - 1} currencies)`);
  return rates;
}

// ─── SOURCE 3: FloatRates (frequently updated, good precision) ───
async function fetchFloatRates() {
  const data = await fetchJSON('https://www.floatrates.com/daily/inr.json');
  if (!data) throw new Error('No FloatRates data');
  const rates = { INR: 1 };
  for (const currency of TARGET_CURRENCIES) {
    const key = currency.toLowerCase();
    if (data[key] && data[key].rate) {
      rates[currency] = data[key].rate;
    }
  }
  if (Object.keys(rates).length < 5) throw new Error('Insufficient FloatRates data');
  console.log(`✅ FloatRates fetched (${Object.keys(rates).length - 1} currencies)`);
  return rates;
}

// ─── SOURCE 4: ExchangeRate-API v6 (paid key, daily update) ───
async function fetchExchangeRateAPIv6() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) throw new Error('No API key');
  const data = await fetchJSON(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`);
  if (data.result !== 'success' || !data.conversion_rates) throw new Error('API failed');
  const rates = { INR: 1, ...data.conversion_rates };
  console.log(`✅ ExchangeRate-API v6 fetched (${Object.keys(rates).length - 1} currencies)`);
  return rates;
}

// ─── SOURCE 5: Fawaz Currency API (9+ decimal precision) ───
async function fetchFawazRates() {
  const data = await fetchJSON('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json');
  if (!data || !data.inr) throw new Error('No data');
  const rates = { INR: 1 };
  for (const [key, value] of Object.entries(data.inr)) {
    rates[key.toUpperCase()] = value;
  }
  console.log(`✅ Fawaz Currency API fetched (${Object.keys(rates).length - 1} currencies)`);
  return rates;
}

// ─── SOURCE 6: Open ER-API (free, no key needed) ───
async function fetchOpenERAPI() {
  const data = await fetchJSON('https://open.er-api.com/v6/latest/INR');
  if (!data || !data.rates) throw new Error('No data');
  console.log(`✅ Open ER-API fetched`);
  return data.rates;
}

// ─── AGGREGATION: Google Finance for popular currencies, bulk APIs for all ───
async function fetchLatestRates() {
  const successfulSources = [];

  // Phase 1: Try ExchangeRate-API v6 FIRST — returns ALL 160+ currencies in ONE call
  try {
    const bulkRates = await fetchExchangeRateAPIv6();
    successfulSources.push({ name: 'ExchangeRate-API v6', rates: bulkRates, weight: 3 });
  } catch (e) {
    console.warn(`⚠️ ExchangeRate-API v6 failed: ${e.message}`);
  }

  // Phase 2: Google Finance for popular currencies (most accurate, real-time)
  // + other JSON APIs in parallel
  const phase2Sources = [
    { name: 'Google Finance', fetch: fetchGoogleFinanceRates, weight: 5 },
    { name: 'FloatRates', fetch: fetchFloatRates, weight: 2 },
    { name: 'Fawaz Currency API', fetch: fetchFawazRates, weight: 2 },
  ];

  const phase2 = await Promise.allSettled(
    phase2Sources.map(async (s) => {
      try {
        const rates = await s.fetch();
        return { name: s.name, rates, weight: s.weight };
      } catch (e) {
        console.warn(`⚠️ ${s.name} failed: ${e.message}`);
        throw e;
      }
    })
  );

  for (const r of phase2) {
    if (r.status === 'fulfilled') successfulSources.push(r.value);
  }

  // Phase 3: Last resort fallbacks if we still have few sources
  if (successfulSources.length < 2) {
    const fallbackSources = [
      { name: 'Frankfurter (ECB)', fetch: fetchFrankfurterRates, weight: 2 },
      { name: 'Open ER-API', fetch: fetchOpenERAPI, weight: 1 },
    ];
    const phase3 = await Promise.allSettled(
      fallbackSources.map(async (s) => {
        try {
          const rates = await s.fetch();
          return { name: s.name, rates, weight: s.weight };
        } catch (e) {
          console.warn(`⚠️ ${s.name} failed: ${e.message}`);
          throw e;
        }
      })
    );
    for (const r of phase3) {
      if (r.status === 'fulfilled') successfulSources.push(r.value);
    }
  }

  console.log(`📊 ${successfulSources.length} sources returned data: ${successfulSources.map(s => s.name).join(', ')}`);

  if (successfulSources.length === 0) {
    throw new Error('All exchange rate APIs failed');
  }

  // Build final rates: Google Finance overrides for popular currencies, bulk API fills the rest
  const googleSource = successfulSources.find(s => s.name === 'Google Finance');
  const bulkSource = successfulSources.find(s => s.name === 'ExchangeRate-API v6');

  // Start with the richest bulk source
  const richestSource = successfulSources.reduce((best, s) =>
    Object.keys(s.rates).length > Object.keys(best.rates).length ? s : best
  );
  const finalRates = { INR: 1 };

  // Layer 1: Fill all currencies from bulk/richest source
  for (const source of successfulSources.sort((a, b) => a.weight - b.weight)) {
    for (const [key, value] of Object.entries(source.rates)) {
      if (typeof value === 'number' && value > 0) {
        finalRates[key] = value;
      }
    }
  }

  // Layer 2: Override popular currencies with Google Finance (highest accuracy)
  if (googleSource && Object.keys(googleSource.rates).length > 5) {
    console.log(`🎯 Google Finance overriding ${Object.keys(googleSource.rates).length - 1} popular currencies with real-time rates`);
    for (const [key, value] of Object.entries(googleSource.rates)) {
      if (typeof value === 'number' && value > 0) {
        finalRates[key] = value;
      }
    }
  }

  // Check coverage
  const covered = TARGET_CURRENCIES.filter(c => finalRates[c]);
  const missing = TARGET_CURRENCIES.filter(c => !finalRates[c]);
  console.log(`📊 Coverage: ${covered.length}/${TARGET_CURRENCIES.length} currencies`);
  if (missing.length > 0) {
    console.log(`⚠️ Missing currencies: ${missing.join(', ')}`);
  }

  return finalRates;
}

// GET /api/exchange-rates
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.force === 'true';

    // Return cached rates if still fresh (unless force refresh)
    if (!forceRefresh && cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        rates: cachedRates,
        cached: true,
        lastUpdated: new Date(cacheTimestamp).toISOString()
      });
    }

    // Fetch fresh rates
    const rates = await fetchLatestRates();
    cachedRates = rates;
    cacheTimestamp = now;

    res.json({
      success: true,
      rates,
      cached: false,
      lastUpdated: new Date(cacheTimestamp).toISOString()
    });
  } catch (error) {
    console.error('❌ Exchange rate fetch error:', error.message);
    // If fetch fails but we have cached data, return it
    if (cachedRates) {
      return res.json({
        success: true,
        rates: cachedRates,
        cached: true,
        stale: true,
        lastUpdated: new Date(cacheTimestamp).toISOString()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates'
    });
  }
});

module.exports = router;
