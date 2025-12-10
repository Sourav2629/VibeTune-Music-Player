require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const makeAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibetune', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const user = await User.findOne({ email });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();
        console.log(`Successfully made ${user.username} (${user.email}) an admin`);
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

makeAdmin(email); 