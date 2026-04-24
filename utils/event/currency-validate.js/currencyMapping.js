const currencyMapping = {
    'Ghana': { code: 'GHS', symbol: '₵', country: 'GH', name: 'Ghanaian Cedi' },
    'Nigeria': { code: 'NGN', symbol: '₦', country: 'NG', name: 'Nigerian Naira' },
    'India': { code: 'INR', symbol: '₹', country: 'IN', name: 'Indian Rupee' },
    'United States': { code: 'USD', symbol: '$', country: 'US', name: 'US Dollar' },
    'United Kingdom': { code: 'GBP', symbol: '£', country: 'GB', name: 'British Pound' },
    'United Arab Emirates': { code: 'AED', symbol: 'د.إ', country: 'AE', name: 'UAE Dirham' },
    // ... add more
};

const getCurrencyFromRegion = (region) => {
    if (!region) return null;
    const parts = region.split(',').map(p => p.trim());
    const country = parts[parts.length - 1];
    return currencyMapping[country] || null;
};

const verifyCurrencyMatchesRegion = (region, userSelectedCurrency) => {
    const regionCurrency = getCurrencyFromRegion(region);

    if (!regionCurrency) {
        return {
            valid: false,
            message: `Country not supported. Please select a valid region.`
        };
    }

    if (regionCurrency.code !== userSelectedCurrency && regionCurrency.symbol !== userSelectedCurrency) {
        return {
            valid: false,
            message: `Currency mismatch: Event in ${region.split(',').pop().trim()} should use ${regionCurrency.symbol} (${regionCurrency.code}), but you selected ${userSelectedCurrency}`
        };
    }

    return { valid: true, currencyInfo: regionCurrency };
};

module.exports = {
    currencyMapping,
    getCurrencyFromRegion,
    verifyCurrencyMatchesRegion
};
