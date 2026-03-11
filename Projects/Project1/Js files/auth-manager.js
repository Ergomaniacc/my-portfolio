/**
 * Authentication Manager
 * Handles user session, authentication checks, and UI updates
 * 
 * SECURITY NOTE: This is a demo implementation using localStorage.
 * For production, use secure backend with:
 * - JWT tokens
 * - Secure HTTP-only cookies
 * - Password hashing
 * - HTTPS only
 */

class AuthManager {
    constructor() {
        this.isLoggedIn = this.checkLoginStatus();
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    /**
     * Check if user is logged in
     */
    checkLoginStatus() {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    }

    /**
     * Get current logged-in user
     */
    getCurrentUser() {
        if (!this.isLoggedIn) return null;
        
        const userEmail = sessionStorage.getItem('userEmail');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === userEmail) || { email: userEmail };
    }

    /**
     * Initialize authentication UI
     */
    init() {
        this.updateHeaderButtons();
        this.setupLogoutListener();
    }

    /**
     * Update header buttons based on auth status
     */
    updateHeaderButtons() {
        const headerAuth = document.getElementById('headerAuth');
        const mobileAuth = document.getElementById('mobileAuth');
        if (!headerAuth || !mobileAuth) return;

        if (this.isLoggedIn && this.currentUser) {
            // Logged in - show user menu and cart
            const userName = this.currentUser.name || this.currentUser.email.split('@')[0];
            
            // Desktop buttons (shown on larger screens)
            const desktopHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0; position: relative;">
                    <button class="cart-btn" onclick="openCart()">
                        🛒 Cart
                        <span class="cart-count" id="cartCount">0</span>
                    </button>
                    <button class="user-menu-btn" id="userMenuBtn" onclick="toggleUserMenu(event)">
                        👤 ${userName}
                    </button>
                    <div class="user-dropdown" id="userDropdownMenu">
                        <a href="profile.html" onclick="viewProfile(event)">👤 Profile</a>
                        <a href="#" onclick="viewOrders(event)">📦 My Orders</a>
                        <a href="#" onclick="logout(event)">🚪 Logout</a>
                    </div>
                </div>
            `;
            
            // Mobile buttons (shown in hamburger menu)
            const mobileHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                    <button class="cart-btn" onclick="openCart()" style="width: 100%;">
                        🛒 Cart
                        <span class="cart-count" id="cartCountMobile">0</span>
                    </button>
                    <button class="user-menu-btn" id="userMenuBtnMobile" onclick="toggleUserMenu(event)" style="width: 100%; text-align: center;">
                        👤 ${userName}
                    </button>
                </div>
                <div class="user-dropdown" id="userDropdownMenuMobile" style="position: static; border: none; box-shadow: none; margin-top: 0.5rem;">
                    <a href="profile.html" onclick="viewProfile(event)">👤 Profile</a>
                    <a href="#" onclick="viewOrders(event)">📦 My Orders</a>
                    <a href="#" onclick="logout(event)">🚪 Logout</a>
                </div>
            `;

            headerAuth.innerHTML = desktopHTML;
            mobileAuth.innerHTML = mobileHTML;
        } else {
            // Not logged in - show sign in button
            const desktopHTML = `
                <a href="auth.html" style="text-decoration: none; color: var(--dark); font-weight: 600; padding: 0.7rem 1rem; border-radius: 20px; transition: background 0.3s; display: flex; align-items: center;" onmouseover="this.style.background='var(--light)'" onmouseout="this.style.background='transparent'">Sign In</a>
            `;
            
            const mobileHTML = `
                <a href="auth.html" style="text-decoration: none; color: var(--dark); font-weight: 600; padding: 0.7rem 1rem; border-radius: 20px; transition: background 0.3s; display: block; text-align: center; background: var(--light);">Sign In</a>
            `;

            headerAuth.innerHTML = desktopHTML;
            mobileAuth.innerHTML = mobileHTML;
        }
    }

    /**
     * Set up logout listener
     */
    setupLogoutListener() {
        // Listen for logout events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' && e.newValue === null) {
                this.isLoggedIn = false;
                this.currentUser = null;
                this.updateHeaderButtons();
            }
        });
    }

    /**
     * Login user
     */
    static login(email, name = null) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
        
        if (name) {
            sessionStorage.setItem('userName', name);
        }

        // Create or update user record
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = users.find(u => u.email === email);
        
        if (!userExists) {
            users.push({
                name: name || email.split('@')[0],
                email: email,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('users', JSON.stringify(users));
        }

        // Trigger auth update
        if (window.authManager) {
            window.authManager.isLoggedIn = true;
            window.authManager.currentUser = { name: name || email.split('@')[0], email };
            window.authManager.updateHeaderButtons();
        }
    }

    /**
     * Logout user
     */
    static logout() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('isAdmin');

        if (window.authManager) {
            window.authManager.isLoggedIn = false;
            window.authManager.currentUser = null;
            window.authManager.updateHeaderButtons();
        }

        // Clear cart
        localStorage.removeItem('cart');
        
        window.location.href = 'index.html';
    }
}

// Initialize on page load
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

/**
 * Toggle user menu dropdown
 */
function toggleUserMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if it's mobile or desktop button
    const isMobile = event.target.id === 'userMenuBtnMobile';
    const dropdownId = isMobile ? 'userDropdownMenuMobile' : 'userDropdownMenu';
    const dropdown = document.getElementById(dropdownId);
    
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
    
    // Close other dropdowns
    const otherDropdownId = isMobile ? 'userDropdownMenu' : 'userDropdownMenuMobile';
    const otherDropdown = document.getElementById(otherDropdownId);
    if (otherDropdown) {
        otherDropdown.style.display = 'none';
    }
}

/**
 * View user profile
 */
function viewProfile(event) {
    event.preventDefault();
    window.location.href = 'profile.html';
}

/**
 * View user orders
 */
function viewOrders(event) {
    event.preventDefault();
    // Store which tab to open, then navigate to profile page
    sessionStorage.setItem('profileTabToOpen', 'orders');
    window.location.href = 'profile.html';
}

/**
 * Logout user
 */
function logout(event) {
    event.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        AuthManager.logout();
    }
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu-btn')) {
        const dropdowns = document.querySelectorAll('.user-dropdown');
        dropdowns.forEach(d => d.style.display = 'none');
    }
});
