// database.js - SQLite database setup
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'the-social-bite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    createTables();
  }
});

// Create tables function
function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating users table:', err.message);
    });

    // Restaurants table
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      location TEXT NOT NULL,
      rating REAL DEFAULT 0,
      description TEXT,
      delivery_time TEXT,
      cost_for_two TEXT,
      offers TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating restaurants table:', err.message);
    });

    // Menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      category TEXT,
      is_available BOOLEAN DEFAULT 1,
      FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating menu_items table:', err.message);
    });

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      restaurant_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating reviews table:', err.message);
    });

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      restaurant_id INTEGER,
      items TEXT,
      total REAL,
      status TEXT DEFAULT 'pending',
      delivery_address TEXT,
      phone_number TEXT,
      special_instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
      } else {
        // Insert sample data after all tables are created
        setTimeout(insertSampleData, 100);
      }
    });
  });
}

function insertSampleData() {
  console.log("Inserting sample data...");

  // Insert sample users
  const users = [
    ['admin', 'admin@thesocialbite.com', '$2a$10$dummyhash1', 'admin'],
    ['customer1', 'customer1@example.com', '$2a$10$dummyhash2', 'customer'],
    ['customer2', 'customer2@example.com', '$2a$10$dummyhash3', 'customer']
  ];

  users.forEach(user => {
    db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`, 
      user, 
      function(err) {
        if (err) console.error('Error inserting user:', err.message);
      }
    );
  });

  // Insert sample restaurants
  const restaurants = [
    {
      name: "Spice Symphony",
      cuisine: "Fusion",
      location: "Downtown, Kolkata",
      rating: 4.5,
      description: "Creative fusion dishes in a vibrant atmosphere with global flavors",
      delivery_time: "35-45 mins",
      cost_for_two: "₹1200-1800",
      offers: "20% off on fusion thali",
      image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Urban Grill",
      cuisine: "Barbecue",
      location: "Central District, Kolkata",
      rating: 4.4,
      description: "Smoky grilled specialties and live music in urban setting",
      delivery_time: "30-40 mins",
      cost_for_two: "₹1500-2000",
      offers: "Free dessert with main course",
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Biryani Bliss",
      cuisine: "Mughlai",
      location: "Park Circus, Kolkata",
      rating: 4.6,
      description: "Authentic biryani with royal flavors and aromatic spices",
      delivery_time: "25-35 mins",
      cost_for_two: "₹800-1200",
      offers: "Buy 1 Get 1 Free on biryani",
      image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Continental Delights",
      cuisine: "Continental",
      location: "Park Street, Kolkata",
      rating: 4.3,
      description: "Classic European cuisine with modern twist and elegant ambiance",
      delivery_time: "40-50 mins",
      cost_for_two: "₹1600-2200",
      offers: "15% off on Italian dishes",
      image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Flame & Fork",
      cuisine: "Barbecue",
      location: "Salt Lake, Kolkata",
      rating: 4.2,
      description: "Live grills and unlimited gourmet barbecue experience",
      delivery_time: "45-55 mins",
      cost_for_two: "₹1800-2500",
      offers: "Free appetizer with barbecue platter",
      image_url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Crispy Crunch",
      cuisine: "Fast Food",
      location: "Multiple Locations, Kolkata",
      rating: 4.0,
      description: "Irresistible fried chicken, burgers and fast food favorites",
      delivery_time: "20-30 mins",
      cost_for_two: "₹500-800",
      offers: "Combo deals starting at ₹299",
      image_url: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Bengali Bites",
      cuisine: "Bengali",
      location: "Southern Avenue, Kolkata",
      rating: 4.4,
      description: "Traditional Bengali home-style cooking with authentic flavors",
      delivery_time: "30-40 mins",
      cost_for_two: "₹700-1000",
      offers: "Free mishti doi with thali",
      image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      name: "Pizza Palace",
      cuisine: "Pizza",
      location: "Multiple Locations, Kolkata",
      rating: 4.1,
      description: "Hot & fresh pizza with premium toppings and quick delivery",
      delivery_time: "25-35 mins",
      cost_for_two: "₹600-900",
      offers: "Buy 1 Get 1 on medium pizzas",
      image_url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    }
  ];

  restaurants.forEach(restaurant => {
    db.run(`INSERT OR IGNORE INTO restaurants (name, cuisine, location, rating, description, delivery_time, cost_for_two, offers, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.name, restaurant.cuisine, restaurant.location, restaurant.rating, restaurant.description, 
       restaurant.delivery_time, restaurant.cost_for_two, restaurant.offers, restaurant.image_url],
      function(err) {
        if (err) console.error('Error inserting restaurant:', err.message);
      }
    );
  });

  // Insert sample menu items with images
  const menuItems = [
    // Spice Symphony
    { restaurant_id: 1, name: "Fusion Platter", description: "Assorted fusion appetizers from around the world", price: 450, category: "Starters", image_url: "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 1, name: "Thai Curry Pizza", description: "Unique pizza with Thai green curry toppings", price: 550, category: "Main Course", image_url: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 1, name: "Sushi Tacos", description: "Creative fusion of Japanese and Mexican cuisine", price: 600, category: "Main Course", image_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 1, name: "Fusion Thali", description: "Complete fusion meal with global flavors", price: 800, category: "Thali", image_url: "https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    
    // Urban Grill
    { restaurant_id: 2, name: "Smoky BBQ Platter", description: "Signature grilled meats with barbecue sauce", price: 650, category: "Main Course", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 2, name: "Grilled Chicken Wings", description: "Spicy chicken wings with secret marinade", price: 550, category: "Starters", image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 2, name: "Ribeye Steak", description: "Premium steak grilled to perfection", price: 700, category: "Main Course", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 2, name: "Chocolate Lava Cake", description: "Warm chocolate dessert with ice cream", price: 180, category: "Dessert", image_url: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Biryani Bliss
    { restaurant_id: 3, name: "Hyderabadi Dum Biryani", description: "Authentic dum-cooked biryani with spices", price: 320, category: "Main Course", image_url: "https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 3, name: "Chicken Kebab", description: "Soft chicken kebabs in creamy marinade", price: 280, category: "Starters", image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 3, name: "Mutton Biryani", description: "Fragrant biryani with tender mutton pieces", price: 380, category: "Main Course", image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 3, name: "Phirni", description: "Traditional rice pudding dessert", price: 120, category: "Dessert", image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Continental Delights
    { restaurant_id: 4, name: "Creamy Pasta", description: "Italian pasta in rich cream sauce", price: 520, category: "Main Course", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 4, name: "Grilled Salmon", description: "Atlantic salmon with lemon butter sauce", price: 750, category: "Main Course", image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 4, name: "Caesar Salad", description: "Fresh salad with Caesar dressing", price: 350, category: "Starters", image_url: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 4, name: "Tiramisu", description: "Classic Italian coffee dessert", price: 220, category: "Dessert", image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Flame & Fork
    { restaurant_id: 5, name: "Barbecue Ribs", description: "Tender pork ribs with BBQ glaze", price: 680, category: "Main Course", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 5, name: "Grilled Prawns", description: "Jumbo prawns with garlic butter", price: 720, category: "Main Course", image_url: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Crispy Crunch
    { restaurant_id: 6, name: "Crispy Chicken Burger", description: "Crispy fried chicken burger with special sauce", price: 280, category: "Main Course", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 6, name: "French Fries", description: "Golden crispy fries with seasoning", price: 120, category: "Sides", image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Bengali Bites
    { restaurant_id: 7, name: "Kosha Mangsho", description: "Slow-cooked mutton in spicy gravy", price: 450, category: "Main Course", image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 7, name: "Chingri Malai Curry", description: "Prawns in coconut milk curry", price: 550, category: "Main Course", image_url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },

    // Pizza Palace
    { restaurant_id: 8, name: "Margherita Pizza", description: "Classic pizza with tomato and mozzarella", price: 350, category: "Main Course", image_url: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" },
    { restaurant_id: 8, name: "Pepperoni Pizza", description: "Pizza with spicy pepperoni and cheese", price: 420, category: "Main Course", image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" }
  ];

  // Use a counter to track completion
  let itemsInserted = 0;
  menuItems.forEach(item => {
    db.run(`INSERT OR IGNORE INTO menu_items (restaurant_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [item.restaurant_id, item.name, item.description, item.price, item.category, item.image_url],
      function(err) {
        if (err) {
          console.error('Error inserting menu item:', err.message);
        }
        itemsInserted++;
        if (itemsInserted === menuItems.length) {
          console.log("Sample data with menu images inserted successfully");
        }
      }
    );
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = db;