// auth.js - Complete frontend authentication system
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Load user from localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateNavigation();
            } catch (e) {
                console.error('Error parsing user data:', e);
                localStorage.removeItem('currentUser');
            }
        }
        
        // Initialize users array if not exists
        this.initializeDefaultUsers();
        
        // Update navigation when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateNavigation();
                this.checkAuthRedirect();
            });
        } else {
            this.updateNavigation();
            this.checkAuthRedirect();
        }
    }

    initializeDefaultUsers() {
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@thesocialbite.com',
                    password: 'admin123',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    status: 'active'
                },
                {
                    id: 2,
                    username: 'customer1',
                    email: 'customer1@example.com',
                    password: 'customer123',
                    role: 'customer',
                    createdAt: new Date().toISOString(),
                    status: 'active'
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }

    // Register new user
    register(username, email, password, role = 'customer') {
        // Basic validation
        if (!username || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (username.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        if (!this.isValidEmail(email)) {
            return { success: false, error: 'Please enter a valid email address' };
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'User with this email already exists' };
        }

        // Check if username already exists
        if (users.find(u => u.username === username)) {
            return { success: false, error: 'Username already taken' };
        }

        // Create new user
        const user = {
            id: Date.now(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: password, // In production, this should be hashed
            role: role,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        // Save user
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto login after registration
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateNavigation();

        this.showNotification('Registration successful! Welcome to The Social Bite!', 'success');

        return { success: true, user: user };
    }

    // Login user
    login(email, password, role = null) {
        // Basic validation
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );
        
        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }

        // Check if user is active
        if (user.status !== 'active') {
            return { success: false, error: 'Your account has been deactivated' };
        }

        // Check role if specified
        if (role && user.role !== role) {
            return { success: false, error: `Invalid role. Please login as ${user.role}` };
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateNavigation();

        // Dispatch login event for other systems
        document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));

        this.showNotification(`Welcome back, ${user.username}!`, 'success');

        return { success: true, user: user };
    }

    logout() {
        if (!this.currentUser) return;
        
        const username = this.currentUser.username;
        
        // Dispatch logout event for other systems
        document.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateNavigation();
        
        this.showNotification(`Goodbye, ${username}! You have been logged out successfully.`, 'info');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }, 1500);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateNavigation() {
        const navContainer = document.getElementById('mainNavigation');
        if (!navContainer) {
            // Try alternative selectors for different page layouts
            const altNavContainer = document.querySelector('.navbar-nav, nav ul, [role="navigation"]');
            if (!altNavContainer) {
                console.log('Navigation container not found');
                return;
            }
        }

        const targetContainer = navContainer || document.querySelector('.navbar-nav');

        if (this.currentUser) {
            let adminLink = '';
            if (this.isAdmin()) {
                adminLink = `
                    <li class="nav-item">
                        <a class="nav-link" href="admin.html" onclick="return auth.checkAdminAccess()">
                            <i class="fas fa-cog"></i> Admin Panel
                        </a>
                    </li>`;
            }
            
            targetContainer.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="index.html">
                        <i class="fas fa-home"></i> Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="restaurants.html">
                        <i class="fas fa-utensils"></i> Restaurants
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="auth.showNotification('Menu feature coming soon!', 'info'); return false;">
                        <i class="fas fa-book"></i> Menu
                    </a>
                </li>
                <li class="nav-item">
                    <span class="nav-link"><i class="fas fa-map-marker-alt text-primary"></i> Kolkata</span>
                </li>
                ${adminLink}
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user text-success"></i> ${this.currentUser.username}
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <li><a class="dropdown-item" href="#" onclick="auth.showNotification('Profile feature coming soon!', 'info'); return false;"><i class="fas fa-user-circle"></i> Profile</a></li>
                        <li><a class="dropdown-item" href="#" onclick="orderHistory.displayHistory(); return false;"><i class="fas fa-history"></i> Order History</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="auth.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </li>
                <li class="nav-item">
                    <a class="nav-link cart-link" href="#" onclick="cart.displayCartModal(); return false;">
                        <i class="fas fa-shopping-cart"></i> Cart 
                        <span class="badge bg-danger cart-badge" id="cartBadge">${this.getCartItemCount()}</span>
                    </a>
                </li>
            `;
        } else {
            targetContainer.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="index.html">
                        <i class="fas fa-home"></i> Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="restaurants.html">
                        <i class="fas fa-utensils"></i> Restaurants
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="auth.showNotification('Menu feature coming soon!', 'info'); return false;">
                        <i class="fas fa-book"></i> Menu
                    </a>
                </li>
                <li class="nav-item">
                    <span class="nav-link"><i class="fas fa-map-marker-alt text-primary"></i> Kolkata</span>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="auth.showLoginModal(); return false;"><i class="fas fa-sign-in-alt"></i> Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="auth.showRegisterModal(); return false;"><i class="fas fa-user-plus"></i> Sign Up</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link cart-link" href="#" onclick="cart.displayCartModal(); return false;">
                        <i class="fas fa-shopping-cart"></i> Cart 
                        <span class="badge bg-danger cart-badge" id="cartBadge">${this.getCartItemCount()}</span>
                    </a>
                </li>
            `;
        }
        
        // Update cart badge
        this.updateCartBadge();
        
        // Initialize Bootstrap dropdowns if they exist
        if (typeof bootstrap !== 'undefined') {
            const dropdowns = document.querySelectorAll('.dropdown-toggle');
            dropdowns.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        }
    }

    showLoginModal() {
        const email = prompt('Enter your email:');
        if (!email) return;
        
        const password = prompt('Enter your password:');
        if (!password) return;
        
        const result = this.login(email, password);
        if (!result.success) {
            this.showNotification(result.error, 'error');
        }
    }

    showRegisterModal() {
        const username = prompt('Choose a username (min. 3 characters):');
        if (!username) return;
        
        const email = prompt('Enter your email:');
        if (!email) return;
        
        const password = prompt('Choose a password (min. 6 characters):');
        if (!password) return;
        
        const result = this.register(username, email, password);
        if (!result.success) {
            this.showNotification(result.error, 'error');
        }
    }

    checkAdminAccess() {
        if (!this.isAdmin()) {
            this.showNotification('Access denied! Admin privileges required.', 'error');
            return false;
        }
        return true;
    }

    getCartItemCount() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        } catch (e) {
            console.error('Error reading cart:', e);
            return 0;
        }
    }

    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const count = this.getCartItemCount();
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            background: ${this.getAlertColor(type)};
            color: white;
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        const icon = this.getAlertIcon(type);
        
        alertDiv.innerHTML = `
            <i class="fas fa-${icon} me-2" style="font-size: 1.1em;"></i>
            <span style="flex: 1;">${message}</span>
            <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.remove()" style="border: none; background: none; font-size: 1.2em; cursor: pointer; opacity: 0.8;">×</button>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (alertDiv.parentElement) {
                        alertDiv.remove();
                    }
                }, 300);
            }
        }, 5000);

        // Add CSS animations if not already added
        this.addNotificationStyles();
    }

    getAlertColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = `
            <style id="notification-styles">
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                .cart-badge {
                    font-size: 0.7em;
                    padding: 0.25em 0.5em;
                    margin-left: 0.25em;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    checkAuthRedirect() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // If user is logged in and trying to access login/register pages, redirect to home
        if (this.isLoggedIn() && (currentPage === 'login.html' || currentPage === 'register.html')) {
            this.showNotification('You are already logged in', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return true;
        }
        
        // If user is not logged in and trying to access protected pages, redirect to login
        if (!this.isLoggedIn() && this.isProtectedPage(currentPage)) {
            this.showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return true;
        }
        
        return false;
    }

    isProtectedPage(page) {
        const protectedPages = ['profile.html', 'admin.html', 'checkout.html', 'cart.html', 'orders.html'];
        return protectedPages.includes(page);
    }
}

// Cart Management
const cart = {
    addToCart(item) {
        if (!auth.isLoggedIn()) {
            auth.showNotification('Please login to add items to cart', 'warning');
            return false;
        }

        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(cartItem => cartItem.id === item.id);
            
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                item.quantity = 1;
                cart.push(item);
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            auth.updateCartBadge();
            auth.showNotification(`${item.name} added to cart!`, 'success');
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            auth.showNotification('Error adding item to cart', 'error');
            return false;
        }
    },

    removeFromCart(itemId) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart = cart.filter(item => item.id !== itemId);
            localStorage.setItem('cart', JSON.stringify(cart));
            auth.updateCartBadge();
            auth.showNotification('Item removed from cart', 'info');
            return cart;
        } catch (error) {
            console.error('Error removing from cart:', error);
            return JSON.parse(localStorage.getItem('cart')) || [];
        }
    },

    updateQuantity(itemId, quantity) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const item = cart.find(item => item.id === itemId);
            if (item) {
                if (quantity <= 0) {
                    return this.removeFromCart(itemId);
                }
                item.quantity = quantity;
                localStorage.setItem('cart', JSON.stringify(cart));
                auth.updateCartBadge();
            }
            return cart;
        } catch (error) {
            console.error('Error updating quantity:', error);
            return JSON.parse(localStorage.getItem('cart')) || [];
        }
    },

    clearCart() {
        localStorage.removeItem('cart');
        auth.updateCartBadge();
        auth.showNotification('Cart cleared', 'info');
    },

    getCartItems() {
        try {
            return JSON.parse(localStorage.getItem('cart')) || [];
        } catch (error) {
            console.error('Error reading cart:', error);
            return [];
        }
    },

    getTotalPrice() {
        const cart = this.getCartItems();
        return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    },

    displayCartModal() {
        if (!auth.isLoggedIn()) {
            auth.showNotification('Please login to view your cart', 'warning');
            return;
        }

        const cart = this.getCartItems();
        if (cart.length === 0) {
            auth.showNotification('Your cart is empty', 'info');
            return;
        }

        // Remove existing modal
        const existingModal = document.querySelector('.cart-modal-overlay');
        if (existingModal) existingModal.remove();

        const total = this.getTotalPrice();
        const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'cart-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9998;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        let cartHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0"><i class="fas fa-shopping-cart me-2"></i>Your Cart (${itemCount} items)</h5>
                <button type="button" class="btn-close" onclick="this.closest('.cart-modal-overlay').remove()"></button>
            </div>
            <div class="cart-items mb-3">
        `;

        cart.forEach(item => {
            cartHTML += `
                <div class="cart-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div class="flex-grow-1">
                        <strong>${item.name}</strong>
                        <br>
                        <small class="text-muted">₹${item.price} × ${item.quantity || 1}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="fw-bold me-3">₹${item.price * (item.quantity || 1)}</span>
                        <button class="btn btn-sm btn-outline-danger" onclick="cart.removeFromCart('${item.id}'); this.closest('.cart-modal-overlay').remove(); setTimeout(() => cart.displayCartModal(), 100);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        cartHTML += `
            </div>
            <div class="cart-total border-top pt-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Total: ₹${total}</h5>
                </div>
                <div class="d-grid gap-2">
                    <button class="btn btn-success" onclick="checkout()">
                        <i class="fas fa-credit-card me-2"></i>Proceed to Checkout
                    </button>
                    <button class="btn btn-outline-secondary" onclick="cart.clearCart(); this.closest('.cart-modal-overlay').remove();">
                        <i class="fas fa-trash me-2"></i>Clear Cart
                    </button>
                </div>
            </div>
        `;

        modal.innerHTML = cartHTML;
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    }
};

// Order History
const orderHistory = {
    displayHistory() {
        if (!auth.isLoggedIn()) {
            auth.showNotification('Please login to view your order history', 'warning');
            return;
        }
        
        auth.showNotification('Order history feature coming soon!', 'info');
    }
};

// Checkout function
function checkout() {
    if (!auth.isLoggedIn()) {
        auth.showNotification('Please login to checkout', 'warning');
        return;
    }

    const cartItems = cart.getCartItems();
    if (cartItems.length === 0) {
        auth.showNotification('Your cart is empty', 'info');
        return;
    }

    auth.showNotification('Redirecting to checkout...', 'success');
    // In a real app, this would redirect to checkout page
    setTimeout(() => {
        const modal = document.querySelector('.cart-modal-overlay');
        if (modal) modal.remove();
    }, 1000);
}

// Initialize auth system
const auth = new AuthSystem();

// Make globally available
window.auth = auth;
window.cart = cart;
window.orderHistory = orderHistory;
window.checkout = checkout;

// Demo login function (remove in production)
window.demoLogin = function(role) {
    if (role === 'admin') {
        auth.login('admin@thesocialbite.com', 'admin123');
    } else {
        auth.login('customer1@example.com', 'customer123');
    }
};