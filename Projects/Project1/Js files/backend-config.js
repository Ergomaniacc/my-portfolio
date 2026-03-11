/**
 * Backend Configuration & API Manager
 * Handles all backend connections and API calls
 */

const BackendConfig = {
    // Backend server URL (change this to your actual backend server)
    // For local development: http://localhost:3000
    // For production: https://your-api-domain.com
    BASE_URL: 'http://localhost:3000', // Change this!
    
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            SIGNUP: '/api/auth/signup',
            LOGOUT: '/api/auth/logout',
            VERIFY: '/api/auth/verify',
        },
        USER: {
            PROFILE: '/api/user/profile',
            UPDATE: '/api/user/update',
            GET_ORDERS: '/api/user/orders',
        },
        CART: {
            GET: '/api/cart/get',
            ADD_ITEM: '/api/cart/add',
            REMOVE_ITEM: '/api/cart/remove',
            CLEAR: '/api/cart/clear',
            CHECKOUT: '/api/cart/checkout',
        },
        ORDERS: {
            CREATE: '/api/orders/create',
            GET_ALL: '/api/orders',
            GET_BY_ID: '/api/orders/:id',
            CANCEL: '/api/orders/:id/cancel',
        },
        MENU: {
            GET_ALL: '/api/menu/all',
            GET_BY_CATEGORY: '/api/menu/category/:category',
        }
    },

    // API Configuration
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
    },

    // Request timeout (in ms)
    TIMEOUT: 30000,
};

/**
 * API Manager Class
 * Handles all API requests
 */
class APIManager {
    constructor() {
        this.baseUrl = BackendConfig.BASE_URL;
        this.token = this.getAuthToken();
    }

    /**
     * Get auth token from session/local storage
     */
    getAuthToken() {
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    }

    /**
     * Set auth token
     */
    setAuthToken(token, persist = false) {
        if (persist) {
            localStorage.setItem('authToken', token);
        } else {
            sessionStorage.setItem('authToken', token);
        }
        this.token = token;
    }

    /**
     * Clear auth token
     */
    clearAuthToken() {
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        this.token = null;
    }

    /**
     * Make API request
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            ...BackendConfig.DEFAULT_HEADERS,
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
            ...options,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await Promise.race([
                fetch(url, config),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), BackendConfig.TIMEOUT)
                )
            ]);

            // Handle authentication errors
            if (response.status === 401) {
                this.clearAuthToken();
                if (typeof AuthManager !== 'undefined') {
                    AuthManager.logout();
                }
                throw new Error('Session expired. Please login again.');
            }

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(responseData.message || `API Error: ${response.status}`);
            }

            return {
                success: true,
                data: responseData,
                status: response.status,
            };
        } catch (error) {
            console.error(`API Request Error (${method} ${endpoint}):`, error);
            
            // Check if backend is available
            if (error.message.includes('Failed to fetch')) {
                console.warn('Backend not available. Using local data.');
                return {
                    success: false,
                    error: 'Backend not available',
                    offline: true,
                };
            }

            return {
                success: false,
                error: error.message,
                status: null,
            };
        }
    }

    /**
     * GET request
     */
    get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    /**
     * POST request
     */
    post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    /**
     * PUT request
     */
    put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    /**
     * DELETE request
     */
    delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    /**
     * Login user
     */
    async login(email, password) {
        return this.post(BackendConfig.API_ENDPOINTS.AUTH.LOGIN, {
            email,
            password,
        });
    }

    /**
     * Signup user
     */
    async signup(name, email, password) {
        return this.post(BackendConfig.API_ENDPOINTS.AUTH.SIGNUP, {
            name,
            email,
            password,
        });
    }

    /**
     * Get user profile
     */
    async getProfile() {
        return this.get(BackendConfig.API_ENDPOINTS.USER.PROFILE);
    }

    /**
     * Get user orders
     */
    async getUserOrders() {
        return this.get(BackendConfig.API_ENDPOINTS.USER.GET_ORDERS);
    }

    /**
     * Create order
     */
    async createOrder(cartItems) {
        return this.post(BackendConfig.API_ENDPOINTS.ORDERS.CREATE, {
            items: cartItems,
        });
    }

    /**
     * Get all menu items
     */
    async getMenuItems() {
        return this.get(BackendConfig.API_ENDPOINTS.MENU.GET_ALL);
    }

    /**
     * Get menu by category
     */
    async getMenuByCategory(category) {
        const endpoint = BackendConfig.API_ENDPOINTS.MENU.GET_BY_CATEGORY.replace(':category', category);
        return this.get(endpoint);
    }
}

// Initialize API Manager globally
let apiManager;
document.addEventListener('DOMContentLoaded', () => {
    apiManager = new APIManager();
});

/**
 * Helper function to handle offline mode
 */
function isOfflineMode() {
    return !navigator.onLine || localStorage.getItem('forceOfflineMode') === 'true';
}

/**
 * Use local data when backend is unavailable
 */
function useLocalFallback(dataKey, defaultValue = null) {
    const localData = localStorage.getItem(`fallback_${dataKey}`);
    return localData ? JSON.parse(localData) : defaultValue;
}

/**
 * Cache data for offline use
 */
function cacheDataOffline(key, data) {
    try {
        localStorage.setItem(`fallback_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('Could not cache data:', e);
    }
}
