// Centralized API configuration for ArtGuard
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export default API_BASE_URL;
