require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors());

// Body parser middleware
app.use(express.json());    

// Serve static files from Frontend directory
app.use(express.static(path.join(__dirname, '../Frontend')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI , {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Auth Middleware
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            throw new Error('No Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            throw new Error('No token provided');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findOne({ _id: decoded._id });
            
            if (!user) {
                throw new Error('User not found');
            }
            
            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            console.error('Token verification error:', error.message);
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ error: 'Please authenticate' });
        return;
    }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create user
        const user = new User({ username, email, password });
        await user.save();
        
        // Generate token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
        
        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
        
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// User Routes
app.get('/api/user/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

app.patch('/api/user/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'profilePicture', 'preferences'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }
    
    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ message: 'Error updating profile' });
    }
});

// Playlist Routes
app.post('/api/playlists', auth, async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        req.user.playlists.push({ name, description, isPublic });
        await req.user.save();
        res.status(201).json(req.user.playlists[req.user.playlists.length - 1]);
    } catch (error) {
        res.status(500).json({ message: 'Error creating playlist' });
    }
});

// Admin Routes - Get all users
app.get('/api/admin/users', auth, async (req, res) => {
    try {
        // Check if the requesting user has admin privileges
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        
        // Get all users, excluding password field
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Liked Songs Routes
app.post('/api/songs/like', auth, async (req, res) => {
    try {
        const { songId } = req.body;
        
        // Check if song is already liked
        if (req.user.favoriteSongs.includes(songId)) {
            return res.status(400).json({ message: 'Song already in favorites' });
        }
        
        // Add song to favorites
        req.user.favoriteSongs.push(songId);
        await req.user.save();
        
        res.status(200).json({ message: 'Song added to favorites', songId });
    } catch (error) {
        res.status(500).json({ message: 'Error adding song to favorites' });
    }
});

app.delete('/api/songs/unlike', auth, async (req, res) => {
    try {
        const { songId } = req.body;
        
        // Remove song from favorites
        req.user.favoriteSongs = req.user.favoriteSongs.filter(id => id !== songId);
        await req.user.save();
        
        res.status(200).json({ message: 'Song removed from favorites', songId });
    } catch (error) {
        res.status(500).json({ message: 'Error removing song from favorites' });
    }
});

app.get('/api/songs/liked', auth, async (req, res) => {
    try {
        // Return the list of liked songs
        res.json({ likedSongs: req.user.favoriteSongs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching liked songs' });
    }
});

// Existing file serving routes
app.get('/Songs/*', (req, res) => {
    const requestedPath = path.join(__dirname, '../Frontend', req.path);
    console.log('Requested path:', requestedPath);
    
    try {
        if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
            console.log('Serving file:', requestedPath);
            return res.sendFile(requestedPath);
        }

        if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
            console.log('Listing directory:', requestedPath);
            const files = fs.readdirSync(requestedPath);
            const html = files.map(file => {
                const fullPath = path.join(requestedPath, file);
                const stats = fs.statSync(fullPath);
                const isDirectory = stats.isDirectory();
                const href = path.join(req.path, file).replace(/\\/g, '/');
                return `<a href="${href}">${file}</a>`;
            }).join('<br>');
            
            return res.send(html);
        }

        console.error('Path not found:', requestedPath);
        res.status(404).send('Not found');
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal server error');
    }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.listen(port, () => {
    console.log(`VibeTune Music Player server is running at http://localhost:${port}`);
}); 