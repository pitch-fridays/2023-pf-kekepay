
const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        unique: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email format'],
    },
    verificationCode: {
        type: String,
    },
    verified: {
        type: Boolean,
    },
    fullName: {
        type: String,
        // required: [true, 'Full name is required'],
    },
    registrationNumber: {
        type: String,
        // required: [true, 'Registration number is required'],
    },
    password: {
        type: String,
        // required: [true, 'Password is required'],
    },
    balance: {
        type: Number,
        default: 0.00,
    },
    totalTransactions: {
        type: Number,
        default: 0
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User;








