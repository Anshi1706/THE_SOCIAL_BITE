// server.js - Express server for The Social Bite
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialize database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating users table:', err);
    });

    // Restaurants table
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        delivery_time TEXT,
        cost_for_two TEXT,
        offers TEXT,
        image_url TEXT,
        rating REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating restaurants table:', err);
    });

    // Menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        image_url TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
    )`, (err) => {
        if (err) console.error('Error creating menu_items table:', err);
    });

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
    )`, (err) => {
        if (err) console.error('Error creating reviews table:', err);
    });

    // Orders table (added for order tracking)
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'confirmed',
        delivery_address TEXT NOT NULL,
        special_instructions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
    )`, (err) => {
        if (err) console.error('Error creating orders table:', err);
    });

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
    )`, (err) => {
        if (err) console.error('Error creating order_items table:', err);
    });

    // Insert sample data if tables are empty
    setTimeout(() => {
        insertSampleData();
    }, 1000);
}

function insertSampleData() {
    // Check if restaurants table is empty
    db.get("SELECT COUNT(*) as count FROM restaurants", (err, row) => {
        if (err) {
            console.error('Error checking restaurants count:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Inserting sample data...');
            
            // Insert sample restaurants
            const restaurants = [
                {
                    name: "Oh! Calcutta",
                    cuisine: "Bengali",
                    location: "Park Street, Kolkata",
                    description: "Authentic Bengali cuisine with traditional recipes and elegant ambiance",
                    delivery_time: "35-45 mins",
                    cost_for_two: "₹1200-1800",
                    offers: "20% off on thali",
                    image_url: "https://source.unsplash.com/400x250/?bengali,food,restaurant",
                    rating: 4.5
                },
                {
                    name: "Peter Cat",
                    cuisine: "Mughlai",
                    location: "Park Street, Kolkata",
                    description: "Legendary restaurant famous for Chelo Kebabs and live music ambiance",
                    delivery_time: "30-40 mins",
                    cost_for_two: "₹1500-2000",
                    offers: "Free dessert with main course",
                    image_url: "https://source.unsplash.com/400x250/?chelo,kebab,restaurant",
                    rating: 4.4
                },
                {
                    name: "Arsalan",
                    cuisine: "Mughlai",
                    location: "Park Circus, Kolkata",
                    description: "The most famous biryani destination in Kolkata with authentic flavors",
                    delivery_time: "25-35 mins",
                    cost_for_two: "₹800-1200",
                    offers: "Buy 1 Get 1 Free on biryani",
                    image_url: "https://source.unsplash.com/400x250/?biryani,restaurant",
                    rating: 4.6
                },
                {
                    name: "6 Ballygunge Place",
                    cuisine: "Bengali",
                    location: "Ballygunge, Kolkata",
                    description: "Heritage Bengali restaurant in a traditional Kolkata house setting",
                    delivery_time: "35-45 mins",
                    cost_for_two: "₹1000-1500",
                    offers: "Free home delivery",
                    image_url: "https://source.unsplash.com/400x250/?traditional,bengali,food",
                    rating: 4.4
                },
                {
                    name: "Kewpie's Kitchen",
                    cuisine: "Bengali",
                    location: "Ekta Apartments, Kolkata",
                    description: "Homestyle Bengali food served in traditional Bengali thali",
                    delivery_time: "30-40 mins",
                    cost_for_two: "₹900-1300",
                    offers: "Traditional thali special",
                    image_url: "https://source.unsplash.com/400x250/?thali,bengali,food",
                    rating: 4.5
                }
            ];

            let restaurantsInserted = 0;
            restaurants.forEach((restaurant, index) => {
                db.run(`INSERT INTO restaurants (name, cuisine, location, description, delivery_time, cost_for_two, offers, image_url, rating) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [restaurant.name, restaurant.cuisine, restaurant.location, restaurant.description, 
                     restaurant.delivery_time, restaurant.cost_for_two, restaurant.offers, restaurant.image_url, restaurant.rating],
                    function(err) {
                        if (err) {
                            console.error('Error inserting restaurant:', err);
                        } else {
                            restaurantsInserted++;
                            console.log(`Inserted restaurant: ${restaurant.name} with ID: ${this.lastID}`);
                            
                            // Insert menu items for this restaurant
                            insertMenuItemsForRestaurant(this.lastID, restaurant.cuisine);
                        }
                        
                        if (restaurantsInserted === restaurants.length) {
                            console.log('All sample data inserted successfully');
                        }
                    }
                );
            });
        } else {
            console.log('Sample data already exists');
        }
    });
}

function insertMenuItemsForRestaurant(restaurantId, cuisine) {
    let menuItems = [];
    
    if (cuisine === 'Bengali') {
        menuItems = [
            { name: "Kosha Mangsho", description: "Slow-cooked mutton in spicy gravy", price: 450, category: "Main Course" },
            { name: "Chingri Malai Curry", description: "Prawns in rich coconut milk curry", price: 550, category: "Main Course" },
            { name: "Shorshe Ilish", description: "Hilsa fish in pungent mustard sauce", price: 600, category: "Main Course" },
            { name: "Bengali Thali", description: "Complete traditional meal", price: 800, category: "Thali" },
            { name: "Cholar Dal", description: "Bengal gram lentils with coconut", price: 280, category: "Main Course" },
            { name: "Mishti Doi", description: "Sweet yogurt dessert", price: 120, category: "Dessert" }
        ];
    } else if (cuisine === 'Mughlai') {
        menuItems = [
            { name: "Chicken Biryani", description: "Aromatic biryani with tender chicken", price: 320, category: "Main Course" },
            { name: "Mutton Biryani", description: "Flavorful biryani with mutton", price: 380, category: "Main Course" },
            { name: "Butter Chicken", description: "Creamy tomato butter chicken", price: 520, category: "Main Course" },
            { name: "Chicken Tikka", description: "Grilled chicken pieces", price: 480, category: "Appetizer" },
            { name: "Garlic Naan", description: "Soft bread with garlic butter", price: 90, category: "Bread" },
            { name: "Firni", description: "Traditional rice pudding", price: 180, category: "Dessert" }
        ];
    }

    menuItems.forEach(item => {
        db.run(`INSERT INTO menu_items (restaurant_id, name, description, price, category) 
                VALUES (?, ?, ?, ?, ?)`,
            [restaurantId, item.name, item.description, item.price, item.category],
            function(err) {
                if (err) {
                    console.error('Error inserting menu item:', err);
                }
            }
        );
    });
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve all files from root
app.use(session({ 
    secret: 'social-bite-secret-key-2024', 
    resave: false, 
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/restaurant-detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'restaurant-detail.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/restaurants', (req, res) => {
    res.sendFile(path.join(__dirname, 'restaurants.html'));
});

// API Routes

// Register user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
            [username, email, hash, 'customer'], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('users.email')) {
                            return res.status(400).json({ error: 'User with this email already exists' });
                        } else if (err.message.includes('users.username')) {
                            return res.status(400).json({ error: 'Username already taken' });
                        }
                    }
                    console.error('Registration error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ 
                    message: 'Registration successful!', 
                    userId: this.lastID 
                });
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Check role if specified
            if (role && user.role !== role) {
                return res.status(401).json({ error: `Invalid role. Your role is ${user.role}` });
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.email = user.email;
            req.session.role = user.role;

            res.json({ 
                message: 'Login successful!', 
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({ error: 'Server error during login' });
        }
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get restaurants with filters
app.get('/api/restaurants', (req, res) => {
    const { search, cuisine, minRating } = req.query;
    
    let query = `
        SELECT r.*, 
               COALESCE(AVG(rev.rating), 0) as avg_rating,
               COUNT(rev.id) as review_count
        FROM restaurants r
        LEFT JOIN reviews rev ON r.id = rev.restaurant_id
        WHERE 1=1
    `;
    let params = [];

    if (search) {
        query += ' AND (r.name LIKE ? OR r.description LIKE ? OR r.cuisine LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    if (cuisine) {
        query += ' AND r.cuisine = ?';
        params.push(cuisine);
    }
    if (minRating) {
        query += ' AND r.rating >= ?';
        params.push(parseFloat(minRating));
    }

    query += ' GROUP BY r.id ORDER BY avg_rating DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch restaurants' });
        }
        
        // Format the response
        const restaurants = rows.map(row => ({
            id: row.id,
            name: row.name,
            cuisine: row.cuisine,
            location: row.location,
            rating: row.avg_rating ? parseFloat(row.avg_rating.toFixed(1)) : row.rating || 0,
            review_count: row.review_count,
            description: row.description,
            delivery_time: row.delivery_time,
            cost_for_two: row.cost_for_two,
            offers: row.offers,
            image_url: row.image_url
        }));
        
        res.json(restaurants);
    });
});

// Get restaurant details with menu and reviews
app.get('/api/restaurants/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid restaurant ID' });
    }
    
    // Get restaurant details
    db.get('SELECT * FROM restaurants WHERE id = ?', [id], (err, restaurant) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Get reviews
        db.all(`
            SELECT reviews.*, users.username 
            FROM reviews 
            JOIN users ON reviews.user_id = users.id 
            WHERE restaurant_id = ? 
            ORDER BY reviews.date DESC
        `, [id], (err, reviews) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get menu items
            db.all('SELECT * FROM menu_items WHERE restaurant_id = ?', [id], (err, menu) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    restaurant: {
                        ...restaurant,
                        rating: restaurant.rating || 0
                    },
                    reviews: reviews || [],
                    menu: menu || []
                });
            });
        });
    });
});

// Add review
app.post('/api/reviews', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please login to add a review' });
    }

    const { restaurant_id, rating, comment } = req.body;
    
    if (!restaurant_id || !rating || !comment) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    db.run(
        'INSERT INTO reviews (user_id, restaurant_id, rating, comment, date) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, restaurant_id, rating, comment, new Date().toISOString()],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to add review' });
            }

            // Update restaurant rating
            db.get(
                'SELECT AVG(rating) as avg_rating FROM reviews WHERE restaurant_id = ?',
                [restaurant_id],
                (err, result) => {
                    if (err) {
                        console.error('Error calculating average rating:', err);
                    } else if (result && result.avg_rating) {
                        db.run(
                            'UPDATE restaurants SET rating = ? WHERE id = ?',
                            [parseFloat(result.avg_rating.toFixed(1)), restaurant_id],
                            (err) => {
                                if (err) {
                                    console.error('Error updating restaurant rating:', err);
                                }
                            }
                        );
                    }
                }
            );

            res.json({ 
                message: 'Review added successfully!',
                reviewId: this.lastID 
            });
        }
    );
});

// Order management APIs
app.post('/api/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please login to place an order' });
    }

    const { restaurant_id, items, total_amount, delivery_address, special_instructions } = req.body;
    
    if (!restaurant_id || !items || !total_amount || !delivery_address) {
        return res.status(400).json({ error: 'Missing required order fields' });
    }

    db.run(
        'INSERT INTO orders (user_id, restaurant_id, total_amount, delivery_address, special_instructions) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, restaurant_id, total_amount, delivery_address, special_instructions || ''],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create order' });
            }

            const orderId = this.lastID;

            // Insert order items
            let itemsInserted = 0;
            items.forEach(item => {
                db.run(
                    'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.menu_item_id, item.quantity, item.price],
                    function(err) {
                        if (err) {
                            console.error('Error inserting order item:', err);
                        }
                        itemsInserted++;
                    }
                );
            });

            res.json({ 
                message: 'Order placed successfully!',
                orderId: orderId
            });
        }
    );
});

app.get('/api/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please login to view orders' });
    }

    db.all(`
        SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `, [req.session.userId], (err, orders) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch orders' });
        }

        res.json(orders);
    });
});

app.get('/api/orders/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please login to view order details' });
    }

    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get order details
    db.get(`
        SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image, 
               r.location as restaurant_location
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.id = ? AND o.user_id = ?
    `, [orderId, req.session.userId], (err, order) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        db.all(`
            SELECT oi.*, mi.name, mi.description, mi.image_url
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?
        `, [orderId], (err, items) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                ...order,
                items: items || []
            });
        });
    });
});

// Check authentication
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                email: req.session.email,
                role: req.session.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Get user profile
app.get('/api/user/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', 
        [req.session.userId], 
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 The Social Bite server running on http://localhost:${PORT}`);
    console.log(`📍 Serving food delivery in Kolkata!`);
    console.log(`📊 Database: SQLite (database.sqlite)`);
    console.log(`📁 Serving static files from: ${__dirname}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});