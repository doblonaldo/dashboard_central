export const getApiUrl = () => {
    if (typeof window === 'undefined') {
        return "http://localhost:3001/api"; // Server-side fallback
    }
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001/api`;
};

export const API_URL = getApiUrl();
