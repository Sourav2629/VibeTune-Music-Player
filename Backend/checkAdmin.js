require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibetune', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found with email:', email);
            process.exit(1);
        }

        console.log('User details:');
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Is Admin:', user.isAdmin);
        console.log('Created At:', user.createdAt);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

checkUser(email); 