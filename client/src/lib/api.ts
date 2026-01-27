export const getApiUrl = () => {
    // FORCE Localhost API if we are running in the browser on localhost
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5000/api';
    }

    // Otherwise use environment variable or fallback to production
    return (import.meta as any).env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';
};

export const API_URL = getApiUrl();
