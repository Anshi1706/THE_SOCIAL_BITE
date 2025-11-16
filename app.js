// app.js - Main application logic (Complete Version)
class App {
  constructor() {
    this.cart = new Cart();
    this.order = new Order();
    this.trackOrder = new TrackOrder();
    this.orderHistory = new OrderHistory();
    this.auth = new Auth();
    this.init();
  }

  init() {
    console.log('The Social Bite App Initialized');
    this.auth.checkLoginStatus();
    this.bindEvents();
    this.loadRestaurants();
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        const item = e.target.dataset.item;
        const price = parseFloat(e.target.dataset.price);
        const image = e.target.dataset.image || '';
        const restaurant = e.target.dataset.restaurant || '';
        this.cart.addItem(item, price, image, restaurant);
      }
      
      if (e.target.classList.contains('view-cart')) {
        this.cart.showCart();
      }
      
      if (e.target.id === 'checkout-btn') {
        this.order.checkout();
      }
      
      if (e.target.id === 'login-btn') {
        this.auth.showLoginModal();
      }
      
      if (e.target.id === 'register-btn') {
        this.auth.showRegisterModal();
      }
      
      if (e.target.id === 'logout-btn') {
        this.auth.logout();
      }
    });
  }

  loadRestaurants() {
    const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    const restaurantGrid = document.getElementById('restaurantGrid');
    
    if (restaurantGrid) {
      restaurantGrid.innerHTML = restaurants.map(restaurant => `
        <div class="col-md-4 mb-4">
          <div class="card restaurant-card h-100">
            <img src="${restaurant.image}" class="card-img-top" alt="${restaurant.name}" style="height: 200px; object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${restaurant.name}</h5>
              <p class="card-text">${restaurant.cuisine} • ${restaurant.location}</p>
              <p class="card-text">${'★'.repeat(restaurant.rating)}${'☆'.repeat(5-restaurant.rating)}</p>
              <p class="card-text">${restaurant.description}</p>
              ${restaurant.featured ? '<span class="badge bg-warning">Featured</span>' : ''}
            </div>
            <div class="card-footer">
              <button class="btn btn-primary view-menu" data-restaurant="${restaurant.name}">
                View Menu
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// Authentication System
class Auth {
  constructor() {
    this.currentUser = null;
  }

  checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      this.currentUser = user;
      this.updateNavigation();
    }
  }

  updateNavigation() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const adminLink = document.getElementById('admin-link');

    if (this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (userName) userName.textContent = this.currentUser.username;
      
      // Show admin link if user is admin
      if (adminLink && this.currentUser.role === 'admin') {
        adminLink.style.display = 'block';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (registerBtn) registerBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  }

  showLoginModal() {
    // Simple login implementation - in real app, use proper modal
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');
    
    if (username && password) {
      this.login(username, password);
    }
  }

  showRegisterModal() {
    const username = prompt('Choose username:');
    const email = prompt('Enter email:');
    const password = prompt('Choose password:');
    
    if (username && email && password) {
      this.register(username, email, password);
    }
  }

  login(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.updateNavigation();
      alert('Login successful!');
    } else {
      alert('Invalid credentials!');
    }
  }

  register(username, email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.find(u => u.username === username)) {
      alert('Username already exists!');
      return;
    }
    
    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      role: 'customer',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    this.currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    this.updateNavigation();
    
    alert('Registration successful!');
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.updateNavigation();
    alert('Logged out successfully!');
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }
}

// Cart Management
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
  }

  addItem(name, price, image, restaurant) {
    const existingItem = this.items.find(item => item.name === name);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        name,
        price,
        image,
        restaurant,
        quantity: 1
      });
    }
    
    this.saveCart();
    this.updateCartBadge();
    this.showToast(`${name} added to cart!`, 'success');
  }

  removeItem(name) {
    this.items = this.items.filter(item => item.name !== name);
    this.saveCart();
    this.updateCartBadge();
  }

  updateQuantity(name, quantity) {
    const item = this.items.find(item => item.name === name);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(name);
      } else {
        item.quantity = quantity;
      }
      this.saveCart();
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartBadge();
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
      const count = this.getItemCount();
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  showCart() {
    if (this.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const cartItems = this.items.map(item => `
      <div class="cart-item">
        <strong>${item.name}</strong> - ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}
        <button onclick="app.cart.removeItem('${item.name}')" class="btn btn-sm btn-danger">Remove</button>
      </div>
    `).join('');

    const cartHTML = `
      <div class="cart-modal">
        <h3>Your Cart</h3>
        ${cartItems}
        <hr>
        <h4>Total: ₹${this.getTotal()}</h4>
        <button class="btn btn-primary" onclick="app.order.checkout()">Checkout</button>
        <button class="btn btn-secondary" onclick="this.parentElement.remove()">Close</button>
      </div>
    `;

    // Remove existing cart modal
    const existingModal = document.querySelector('.cart-modal');
    if (existingModal) existingModal.remove();

    // Add new cart modal
    const modal = document.createElement('div');
    modal.innerHTML = cartHTML;
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 400px;
      width: 90%;
    `;
    
    document.body.appendChild(modal);
  }

  showToast(message, type) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Order Management
class Order {
  checkout() {
    if (!window.app.auth.currentUser) {
      alert('Please login to place an order!');
      window.app.auth.showLoginModal();
      return;
    }

    if (window.app.cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const order = {
      id: Date.now(),
      username: window.app.auth.currentUser.username,
      customerName: window.app.auth.currentUser.username,
      items: [...window.app.cart.items],
      total: window.app.cart.getTotal(),
      date: new Date().toLocaleDateString(),
      status: 'confirmed',
      restaurant: window.app.cart.items[0]?.restaurant || 'Unknown Restaurant'
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    window.app.cart.clearCart();

    alert(`Order placed successfully! Order ID: #${order.id}`);
  }
}

// Track Order (Simplified)
class TrackOrder {
  // Basic tracking functionality
  track(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id == orderId);
    
    if (order) {
      return `Order #${order.id} - Status: ${order.status}`;
    }
    return 'Order not found!';
  }
}

// Order History
class OrderHistory {
  getHistory(username) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    return orders.filter(order => order.username === username);
  }

  showHistory() {
    if (!window.app.auth.currentUser) {
      alert('Please login to view order history!');
      return;
    }

    const orders = this.getHistory(window.app.auth.currentUser.username);
    
    if (orders.length === 0) {
      alert('No order history found!');
      return;
    }

    const historyHTML = orders.map(order => `
      <div class="order-item">
        <strong>Order #${order.id}</strong><br>
        Date: ${order.date}<br>
        Total: ₹${order.total}<br>
        Status: ${order.status}<br>
        Items: ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
      </div>
    `).join('');

    alert(`Your Order History:\n\n${historyHTML}`);
  }
}

// Initialize sample data if not exists
function initializeSampleData() {
  if (!localStorage.getItem('restaurants')) {
    const sampleRestaurants = [
      {
        id: 1,
        name: "Tasty Bites",
        cuisine: "Indian",
        location: "Downtown",
        rating: 4,
        description: "Authentic Indian cuisine with a modern twist",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        featured: true
      },
      {
        id: 2,
        name: "Spice Garden",
        cuisine: "Indian",
        location: "City Center",
        rating: 5,
        description: "Traditional Indian dishes in a cozy atmosphere",
        image: "https://images.unsplash.com/photo-1565299585323-38174c13fae8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        featured: true
      }
    ];
    localStorage.setItem('restaurants', JSON.stringify(sampleRestaurants));
  }

  if (!localStorage.getItem('users')) {
    const sampleUsers = [
      {
        id: 1,
        username: "admin",
        email: "admin@socialbite.com",
        password: "admin123",
        role: "admin",
        createdAt: new Date().toISOString(),
        status: "active"
      },
      {
        id: 2,
        username: "customer",
        email: "customer@example.com",
        password: "customer123",
        role: "customer",
        createdAt: new Date().toISOString(),
        status: "active"
      }
    ];
    localStorage.setItem('users', JSON.stringify(sampleUsers));
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeSampleData();
  window.app = new App();
});

// Global functions for HTML onclick handlers
function showAdminPanel() {
  if (window.app.auth.isAdmin()) {
    window.location.href = 'admin.html';
  } else {
    alert('Access denied! Admin privileges required.');
  }
}

function viewCart() {
  window.app.cart.showCart();
}

function viewOrderHistory() {
  window.app.orderHistory.showHistory();
}