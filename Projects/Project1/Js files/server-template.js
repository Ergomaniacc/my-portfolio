/**
 * Bola2bolas Catering Backend Server - Express.js Template
 * 
 * This is a template for setting up the backend server.
 * Install dependencies: npm install express cors jsonwebtoken bcryptjs dotenv
 * 
 * Usage:
 * 1. Create a .env file with:
 *    - JWT_SECRET=your_secret_key
 *    - PORT=3000
 *    - DATABASE_URL=your_database_url
 * 
 * 2. Run: node server.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (replace with actual database)
let users = [];
let orders = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// ========== AUTHENTICATION MIDDLEWARE ==========

/**
 * Verify JWT Token
 */
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// ========== AUTHENTICATION ENDPOINTS ==========

/**
 * Sign Up - Create new account
 * POST /api/auth/signup
 */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Check if user exists
        const userExists = users.find(u => u.email === email);
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);
        
        // Create user
        const user = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            isAdmin: false,
            createdAt: new Date()
        };
        
        users.push(user);
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Sign In - Authenticate user
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing email or password'
            });
        }
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check password
        const isValid = await bcryptjs.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Verify Token
 * GET /api/auth/verify
 */
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

/**
 * Logout
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ========== USER ENDPOINTS ==========

/**
 * Get User Profile
 * GET /api/user/profile
 */
app.get('/api/user/profile', verifyToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Update User Profile
 * PUT /api/user/update
 */
app.put('/api/user/update', verifyToken, (req, res) => {
    try {
        const { name, email } = req.body;
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (name) user.name = name;
        if (email) user.email = email;
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Get User Orders
 * GET /api/user/orders
 */
app.get('/api/user/orders', verifyToken, (req, res) => {
    try {
        const userOrders = orders.filter(o => o.userId === req.user.id);
        res.json({
            success: true,
            data: {
                orders: userOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== ORDER ENDPOINTS ==========

/**
 * Create Order
 * POST /api/orders/create
 */
app.post('/api/orders/create', verifyToken, (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }
        
        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Create order
        const order = {
            id: Date.now().toString(),
            userId: req.user.id,
            items,
            total,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        orders.push(order);
        
        res.status(201).json({
            success: true,
            data: {
                order
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Get All Orders (for user)
 * GET /api/orders
 */
app.get('/api/orders', verifyToken, (req, res) => {
    try {
        const userOrders = orders.filter(o => o.userId === req.user.id);
        res.json({
            success: true,
            data: {
                orders: userOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Get Order by ID
 * GET /api/orders/:id
 */
app.get('/api/orders/:id', verifyToken, (req, res) => {
    try {
        const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * Cancel Order
 * PUT /api/orders/:id/cancel
 */
app.put('/api/orders/:id/cancel', verifyToken, (req, res) => {
    try {
        const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel this order'
            });
        }
        
        order.status = 'cancelled';
        order.updatedAt = new Date();
        
        res.json({
            success: true,
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== MENU ENDPOINTS ==========

/**
 * Get All Menu Items
 * GET /api/menu/all
 */
app.get('/api/menu/all', (req, res) => {
    res.json({
        success: true,
        data: {
            items: [
                // Add your menu items here
                // Example:
                // { id: 1, name: 'Jollof Rice', category: 'dishes', price: 3500, emoji: '🍛' }
            ]
        }
    });
});

/**
 * Get Menu by Category
 * GET /api/menu/category/:category
 */
app.get('/api/menu/category/:category', (req, res) => {
    const { category } = req.params;
    res.json({
        success: true,
        data: {
            category,
            items: []
        }
    });
});

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running'
    });
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: 'Server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Bola2bolas server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('- POST /api/auth/signup');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/logout');
    console.log('- GET /api/auth/verify');
    console.log('- GET /api/user/profile');
    console.log('- PUT /api/user/update');
    console.log('- GET /api/user/orders');
    console.log('- POST /api/orders/create');
    console.log('- GET /api/orders');
    console.log('- GET /api/orders/:id');
    console.log('- PUT /api/orders/:id/cancel');
    console.log('- GET /api/menu/all');
    console.log('- GET /api/menu/category/:category');
});
