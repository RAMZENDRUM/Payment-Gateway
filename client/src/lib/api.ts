export const getApiUrl = () => {
    if (import.meta.env.MODE === 'development') {
        return 'http://localhost:5000/api';
    }
    // Return the Vercel Serverless production URL
    return 'https://payment-via-zenwallet.vercel.app/api';
};

export const API_URL = getApiUrl();
