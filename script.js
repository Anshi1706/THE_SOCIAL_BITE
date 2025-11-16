// script.js - Complete and corrected version
let currentFilters = {};

// Cart System Implementation
const cart = {
    addItem: function(itemName, price, image) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.name === itemName);
            
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                cart.push({
                    name: itemName,
                    price: price,
                    image: image,
                    quantity: 1
                });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            showNotification(`${itemName} added to cart!`, 'success');
            return true;
        } catch (error) {
            console.error('Error adding item to cart:', error);
            showNotification('Failed to add item to cart', 'error');
            return false;
        }
    },

    updateCartCount: function() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            try {
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
            } catch (error) {
                console.error('Error updating cart count:', error);
                cartCount.style.display = 'none';
            }
        }
    },

    displayCartModal: function() {
        // Simple cart modal implementation
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const cartItems = cart.map(item => 
            `${item.name} x${item.quantity} - ₹${item.price * item.quantity}`
        ).join('\n');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        alert(`Cart Items:\n${cartItems}\n\nTotal: ₹${total}\n\nProceed to checkout?`);
    },

    getCartCount: function() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        } catch (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
    }
};

// Auth System Implementation (Simplified)
const auth = {
    isLoggedIn: function() {
        return localStorage.getItem('currentUser') !== null;
    },

    getCurrentUser: function() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    updateNavigation: function() {
        // Update navigation based on auth status
        const user = this.getCurrentUser();
        const authElements = document.querySelectorAll('.auth-element');
        
        authElements.forEach(element => {
            if (this.isLoggedIn()) {
                if (element.classList.contains('logged-out')) {
                    element.style.display = 'none';
                } else if (element.classList.contains('logged-in')) {
                    element.style.display = 'block';
                    const usernameSpan = element.querySelector('.username');
                    if (usernameSpan && user) {
                        usernameSpan.textContent = user.username;
                    }
                }
            } else {
                if (element.classList.contains('logged-out')) {
                    element.style.display = 'block';
                } else if (element.classList.contains('logged-in')) {
                    element.style.display = 'none';
                }
            }
        });
    },

    // Demo login function
    demoLogin: function() {
        const user = {
            username: 'DemoUser',
            email: 'demo@example.com'
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.updateNavigation();
        showNotification('Demo login successful!', 'success');
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRestaurants();
    setupEventListeners();
    
    // Update navigation based on auth status
    auth.updateNavigation();
    cart.updateCartCount();

    // Load specific page content
    if (window.location.pathname.includes('restaurant-detail.html')) {
        loadRestaurantDetail();
    }
    if (window.location.pathname.includes('menu.html') || window.location.pathname.includes('restaurants.html')) {
        loadAllRestaurants();
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('search');
    const searchRestaurantsInput = document.getElementById('searchRestaurants');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', loadRestaurants);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadRestaurants();
            }
        });
    }

    if (searchRestaurantsInput) {
        searchRestaurantsInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchRestaurants();
            }
        });
    }

    // Filter functionality
    const cuisineFilter = document.getElementById('cuisineFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const deliveryFilter = document.getElementById('deliveryFilter');
    
    if (cuisineFilter) {
        cuisineFilter.addEventListener('change', applyFilters);
    }
    if (ratingFilter) {
        ratingFilter.addEventListener('change', applyFilters);
    }
    if (deliveryFilter) {
        deliveryFilter.addEventListener('change', applyFilters);
    }
}

// Load restaurants with sample data
function loadRestaurants() {
    const searchValue = document.getElementById('search')?.value.trim() || '';
    const container = document.getElementById('restaurantsList') || document.getElementById('restaurants');
    
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Loading delicious restaurants...</p>
        </div>
    `;

    // Simulate API delay
    setTimeout(() => {
        const sampleRestaurants = getSampleRestaurants(searchValue);
        
        if (!sampleRestaurants.length) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                    <h4>No restaurants found</h4>
                    <p class="text-muted">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        // Apply additional filters if any
        let filteredRestaurants = sampleRestaurants;
        if (currentFilters.cuisine) {
            filteredRestaurants = filteredRestaurants.filter(r => 
                r.cuisine.toLowerCase() === currentFilters.cuisine.toLowerCase()
            );
        }
        if (currentFilters.rating) {
            filteredRestaurants = filteredRestaurants.filter(r => 
                parseFloat(r.rating) >= parseFloat(currentFilters.rating)
            );
        }
        if (currentFilters.delivery) {
            const maxTime = parseInt(currentFilters.delivery);
            filteredRestaurants = filteredRestaurants.filter(r => {
                const deliveryTime = parseInt(r.deliveryTime);
                return deliveryTime <= maxTime;
            });
        }

        // Render restaurants
        container.innerHTML = filteredRestaurants.map(restaurant => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card restaurant-card h-100">
                    <img src="${restaurant.image}" 
                         alt="${restaurant.name}" 
                         class="card-img-top">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${restaurant.name}</h5>
                            <span class="badge bg-primary">${restaurant.cuisine}</span>
                        </div>
                        <p class="card-text text-muted small mb-2">${restaurant.description}</p>
                        <div class="restaurant-info mb-3">
                            <div class="d-flex justify-content-between text-sm">
                                <span><i class="fas fa-star text-warning"></i> ${restaurant.rating}</span>
                                <span><i class="fas fa-clock text-info"></i> ${restaurant.deliveryTime}</span>
                                <span><i class="fas fa-rupee-sign text-success"></i> ${restaurant.costForTwo}</span>
                            </div>
                        </div>
                        ${restaurant.offers ? `<div class="mb-3"><span class="badge bg-success">${restaurant.offers}</span></div>` : ''}
                        <a href="restaurant-detail.html?id=${restaurant.id}" class="btn btn-primary btn-sm mt-auto">
                            <i class="fas fa-utensils me-2"></i>View Menu & Order
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }, 1000);
}

// Load all restaurants for menu and restaurants pages
function loadAllRestaurants() {
    const container = document.getElementById('restaurantsList') || document.getElementById('restaurants');
    if (!container) return;

    const restaurants = getSampleRestaurants();
    container.innerHTML = restaurants.map(restaurant => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card restaurant-card h-100">
                <img src="${restaurant.image}" 
                     alt="${restaurant.name}" 
                     class="card-img-top">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${restaurant.name}</h5>
                        <span class="badge bg-primary">${restaurant.cuisine}</span>
                    </div>
                    <p class="card-text text-muted small mb-2">${restaurant.description}</p>
                    <div class="restaurant-info mb-3">
                        <div class="d-flex justify-content-between text-sm">
                            <span><i class="fas fa-star text-warning"></i> ${restaurant.rating}</span>
                            <span><i class="fas fa-clock text-info"></i> ${restaurant.deliveryTime}</span>
                            <span><i class="fas fa-rupee-sign text-success"></i> ${restaurant.costForTwo}</span>
                        </div>
                    </div>
                    ${restaurant.offers ? `<div class="mb-3"><span class="badge bg-success">${restaurant.offers}</span></div>` : ''}
                    <a href="restaurant-detail.html?id=${restaurant.id}" class="btn btn-primary btn-sm mt-auto">
                        <i class="fas fa-utensils me-2"></i>View Menu & Order
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Search restaurants
function searchRestaurants() {
    const searchValue = document.getElementById('searchRestaurants')?.value.trim() || '';
    const container = document.getElementById('restaurants');
    if (!container) return;

    const filteredRestaurants = getSampleRestaurants(searchValue);
    
    if (filteredRestaurants.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No restaurants found</h4>
                <p class="text-muted">Try different search terms</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredRestaurants.map(restaurant => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card restaurant-card h-100">
                <img src="${restaurant.image}" 
                     alt="${restaurant.name}" 
                     class="card-img-top">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${restaurant.name}</h5>
                    <span class="badge bg-primary mb-2">${restaurant.cuisine}</span>
                    <p class="card-text text-muted small mb-2">${restaurant.description}</p>
                    <div class="restaurant-info mb-3">
                        <div class="d-flex justify-content-between text-sm">
                            <span><i class="fas fa-star text-warning"></i> ${restaurant.rating}</span>
                            <span><i class="fas fa-clock text-info"></i> ${restaurant.deliveryTime}</span>
                            <span><i class="fas fa-rupee-sign text-success"></i> ${restaurant.costForTwo}</span>
                        </div>
                    </div>
                    <a href="restaurant-detail.html?id=${restaurant.id}" class="btn btn-primary btn-sm mt-auto">
                        <i class="fas fa-utensils me-2"></i>View Menu
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Sample restaurant data - Kolkata specific
function getSampleRestaurants(search = '') {
    const allRestaurants = [
        {
            id: 1,
            name: "Oh! Calcutta",
            cuisine: "Bengali",
            description: "Authentic Bengali cuisine with traditional recipes and elegant ambiance",
            rating: "4.5",
            deliveryTime: "35-45 mins",
            costForTwo: "₹1200-1800",
            offers: "20% off on thali",
            image: "https://source.unsplash.com/400x250/?bengali,food,restaurant",
            location: "Park Street"
        },
        {
            id: 2,
            name: "Peter Cat",
            cuisine: "Mughlai",
            description: "Legendary restaurant famous for Chelo Kebabs and live music ambiance",
            rating: "4.4",
            deliveryTime: "30-40 mins",
            costForTwo: "₹1500-2000",
            offers: "Free dessert with main course",
            image: "https://source.unsplash.com/400x250/?chelo,kebab,restaurant",
            location: "Park Street"
        },
        {
            id: 3,
            name: "Arsalan",
            cuisine: "Mughlai",
            description: "The most famous biryani destination in Kolkata with authentic flavors",
            rating: "4.6",
            deliveryTime: "25-35 mins",
            costForTwo: "₹800-1200",
            offers: "Buy 1 Get 1 Free on biryani",
            image: "https://source.unsplash.com/400x250/?biryani,restaurant",
            location: "Park Circus"
        },
        {
            id: 4,
            name: "Mocambo",
            cuisine: "Continental",
            description: "Classic Continental and Chinese restaurant with retro ambiance",
            rating: "4.3",
            deliveryTime: "40-50 mins",
            costForTwo: "₹1600-2200",
            offers: "15% off on Chinese dishes",
            image: "https://source.unsplash.com/400x250/?continental,restaurant",
            location: "Park Street"
        },
        {
            id: 5,
            name: "6 Ballygunge Place",
            cuisine: "Bengali",
            description: "Heritage Bengali restaurant in a traditional Kolkata house setting",
            rating: "4.4",
            deliveryTime: "35-45 mins",
            costForTwo: "₹1000-1500",
            offers: "Free home delivery",
            image: "https://source.unsplash.com/400x250/?traditional,bengali,food",
            location: "Ballygunge"
        },
        {
            id: 6,
            name: "Kewpie's Kitchen",
            cuisine: "Bengali",
            description: "Homestyle Bengali food served in traditional Bengali thali",
            rating: "4.5",
            deliveryTime: "30-40 mins",
            costForTwo: "₹900-1300",
            offers: "Traditional thali special",
            image: "https://source.unsplash.com/400x250/?thali,bengali,food",
            location: "Ekta Apartments"
        }
    ];

    if (!search) return allRestaurants;

    const searchLower = search.toLowerCase();
    return allRestaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.cuisine.toLowerCase().includes(searchLower) ||
        restaurant.description.toLowerCase().includes(searchLower) ||
        restaurant.location.toLowerCase().includes(searchLower)
    );
}

// Filter functions
function filterByCuisine(cuisine) {
    currentFilters.cuisine = cuisine;
    loadRestaurants();
}

function applyFilters() {
    const cuisineFilter = document.getElementById('cuisineFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const deliveryFilter = document.getElementById('deliveryFilter');
    
    currentFilters.cuisine = cuisineFilter?.value || '';
    currentFilters.rating = ratingFilter?.value || '';
    currentFilters.delivery = deliveryFilter?.value || '';
    
    loadRestaurants();
}

// Restaurant detail page functionality
function loadRestaurantDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = parseInt(urlParams.get('id'));

    if (!restaurantId) {
        window.location.href = 'index.html';
        return;
    }

    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant) {
        const restaurantContainer = document.getElementById('restaurant');
        if (restaurantContainer) {
            restaurantContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Restaurant not found. <a href="index.html">Return to home</a>
                </div>
            `;
        }
        return;
    }

    renderRestaurantDetail(restaurant);
}

function getRestaurantById(id) {
    const restaurants = getSampleRestaurants();
    return restaurants.find(r => r.id === id);
}

function renderRestaurantDetail(restaurant) {
    const menu = getRestaurantMenu(restaurant.id);
    const reviews = getRestaurantReviews(restaurant.id);

    // Render restaurant info
    const restaurantContainer = document.getElementById('restaurant');
    if (restaurantContainer) {
        restaurantContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${restaurant.image}" 
                         alt="${restaurant.name}" 
                         class="img-fluid rounded-3 shadow">
                </div>
                <div class="col-md-6">
                    <h1 class="display-5 fw-bold text-primary">${restaurant.name}</h1>
                    <p class="lead">${restaurant.description}</p>
                    <div class="restaurant-meta mb-4">
                        <div class="d-flex flex-wrap gap-3">
                            <span class="badge bg-primary fs-6">${restaurant.cuisine}</span>
                            <span class="badge bg-success fs-6"><i class="fas fa-star me-1"></i>${restaurant.rating}</span>
                            <span class="badge bg-info fs-6"><i class="fas fa-clock me-1"></i>${restaurant.deliveryTime}</span>
                            <span class="badge bg-warning fs-6"><i class="fas fa-rupee-sign me-1"></i>${restaurant.costForTwo}</span>
                        </div>
                    </div>
                    ${restaurant.offers ? `<div class="alert alert-success"><strong>Special Offer:</strong> ${restaurant.offers}</div>` : ''}
                    <p class="text-muted"><i class="fas fa-map-marker-alt me-2"></i>${restaurant.location}, Kolkata</p>
                </div>
            </div>
        `;
    }

    // Render menu
    const menuContainer = document.getElementById('menu');
    if (menuContainer) {
        if (menu.length) {
            menuContainer.innerHTML = menu.map(item => `
                <div class="col-lg-6 mb-4">
                    <div class="card menu-item h-100">
                        <div class="row g-0">
                            <div class="col-4">
                                <img src="${item.image}" alt="${item.name}" class="img-fluid h-100 w-100" style="object-fit: cover;">
                            </div>
                            <div class="col-8">
                                <div class="card-body d-flex flex-column h-100">
                                    <h5 class="card-title">${item.name}</h5>
                                    <p class="card-text text-muted small flex-grow-1">${item.description}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="h5 text-success mb-0">₹${item.price}</span>
                                        <button class="btn btn-primary btn-sm" onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.image}')">
                                            <i class="fas fa-plus me-1"></i>Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            menuContainer.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                    <h4>Menu Coming Soon</h4>
                    <p class="text-muted">We're working on adding the menu items.</p>
                </div>
            `;
        }
    }

    // Render reviews
    const reviewsContainer = document.getElementById('reviews');
    if (reviewsContainer) {
        if (reviews.length) {
            reviewsContainer.innerHTML = reviews.map(review => `
                <div class="card mb-3 review-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${review.user}</h6>
                            <span class="badge bg-warning">
                                <i class="fas fa-star me-1"></i>${review.rating}/5
                            </span>
                        </div>
                        <p class="card-text">${review.comment}</p>
                        <small class="text-muted">${review.date}</small>
                    </div>
                </div>
            `).join('');
        } else {
            reviewsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h4>No Reviews Yet</h4>
                    <p class="text-muted">Be the first to review this restaurant!</p>
                </div>
            `;
        }
    }

    // Setup review form
    setupReviewForm(restaurant.id);
}

// Enhanced Menu Data
function getRestaurantMenu(restaurantId) {
    const menus = {
        1: [ // Oh! Calcutta - Bengali Cuisine
            { name: 'Kosha Mangsho', price: 450, description: 'Slow-cooked mutton in spicy gravy with traditional Bengali spices', image: 'https://source.unsplash.com/300x200/?kosha,mangsho' },
            { name: 'Chingri Malai Curry', price: 550, description: 'Prawns in rich coconut milk curry with subtle spices', image: 'https://source.unsplash.com/300x200/?prawn,curry' },
            { name: 'Shorshe Ilish', price: 600, description: 'Hilsa fish in pungent mustard sauce, Bengali delicacy', image: 'https://source.unsplash.com/300x200/?hilsa,fish' }
        ],
        2: [ // Peter Cat - Mughlai & Continental
            { name: 'Chelo Kebab', price: 650, description: 'Signature dish with kebabs and buttered rice', image: 'https://source.unsplash.com/300x200/?chelo,kebab' },
            { name: 'Chicken Reshmi Kebab', price: 550, description: 'Soft chicken kebabs in creamy marinade', image: 'https://source.unsplash.com/300x200/?reshmi,kebab' },
            { name: 'Mutton Burrah', price: 700, description: 'Grilled mutton chops with spices', image: 'https://source.unsplash.com/300x200/?mutton,burrah' }
        ],
        3: [ // Arsalan - Mughlai & Biryani Specialists
            { name: 'Chicken Biryani', price: 320, description: 'Famous Arsalan biryani with tender chicken', image: 'https://source.unsplash.com/300x200/?chicken,biryani' },
            { name: 'Mutton Biryani', price: 380, description: 'Aromatic mutton biryani with spices', image: 'https://source.unsplash.com/300x200/?mutton,biryani' },
            { name: 'Chicken Rezala', price: 280, description: 'Mild yogurt-based chicken curry', image: 'https://source.unsplash.com/300x200/?chicken,rezala' }
        ]
    };
    return menus[restaurantId] || [];
}

// Enhanced Reviews Data
function getRestaurantReviews(restaurantId) {
    const reviews = {
        1: [ // Oh! Calcutta
            { user: 'BengaliFoodie', rating: 5, comment: 'Authentic Kosha Mangsho just like my grandmother makes! The flavors took me back to my childhood.', date: '2024-01-15' },
            { user: 'FoodExplorer', rating: 4, comment: 'Great ambiance and traditional Bengali experience. The Shorshe Ilish was perfectly cooked.', date: '2024-01-10' }
        ],
        2: [ // Peter Cat
            { user: 'KebabLover', rating: 5, comment: 'The Chelo Kebab is legendary! Must try in Kolkata. Been coming here for 20 years.', date: '2024-01-12' },
            { user: 'FoodieAdventurer', rating: 4, comment: 'Great ambiance with live music. The Mutton Burrah was perfectly grilled and flavorful.', date: '2024-01-09' }
        ]
    };
    
    // Also load reviews from localStorage if available
    const storedReviews = JSON.parse(localStorage.getItem(`reviews_${restaurantId}`)) || [];
    return [...(reviews[restaurantId] || []), ...storedReviews];
}

function setupReviewForm(restaurantId) {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!auth.isLoggedIn()) {
                showNotification('Please login to add a review', 'error');
                return;
            }

            const rating = parseInt(document.getElementById('rating').value);
            const comment = document.getElementById('comment').value.trim();

            if (!rating || !comment) {
                showNotification('Please provide both rating and comment', 'error');
                return;
            }

            // Save review to localStorage
            const reviews = JSON.parse(localStorage.getItem(`reviews_${restaurantId}`)) || [];
            const newReview = {
                user: auth.getCurrentUser().username,
                rating: rating,
                comment: comment,
                date: new Date().toLocaleDateString()
            };
            
            reviews.unshift(newReview);
            localStorage.setItem(`reviews_${restaurantId}`, JSON.stringify(reviews));
            
            showNotification('Review added successfully!', 'success');
            reviewForm.reset();
            
            // Reload reviews
            setTimeout(() => {
                const updatedReviews = JSON.parse(localStorage.getItem(`reviews_${restaurantId}`)) || [];
                const reviewsContainer = document.getElementById('reviews');
                if (reviewsContainer && updatedReviews.length) {
                    reviewsContainer.innerHTML = updatedReviews.map(review => `
                        <div class="card mb-3 review-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">${review.user}</h6>
                                    <span class="badge bg-warning">
                                        <i class="fas fa-star me-1"></i>${review.rating}/5
                                    </span>
                                </div>
                                <p class="card-text">${review.comment}</p>
                                <small class="text-muted">${review.date}</small>
                            </div>
                        </div>
                    `).join('');
                }
            }, 500);
        });
    }
}

// Add to cart function
window.addToCart = function(itemName, price, image) {
    cart.addItem(itemName, price, image);
};

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Make functions available globally
window.loadRestaurants = loadRestaurants;
window.loadAllRestaurants = loadAllRestaurants;
window.searchRestaurants = searchRestaurants;
window.filterByCuisine = filterByCuisine;
window.applyFilters = applyFilters;
window.loadRestaurantDetail = loadRestaurantDetail;
window.cart = cart;
window.auth = auth;

// Demo login function for testing
window.demoLogin = function() {
    auth.demoLogin();
};