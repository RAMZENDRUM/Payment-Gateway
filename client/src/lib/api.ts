export const getApiUrl = () => {
    // FORCE Localhost API if we are running in the browser on localhost
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5000/api';
    }

    // DIRECTLY return the Railway URL to override any incorrect Vercel Environment Variables
    return 'https://payment-gateway-production-2f82.up.railway.app/api';
};

export const API_URL = getApiUrl();
