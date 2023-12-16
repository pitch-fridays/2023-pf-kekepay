
const mongoose = require('mongoose');
const validator = require('validator');

const agentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        unique: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email format'],
    },

    fullName: {
        type: String,
        // required: [true, 'Full name is required'],
    },

    password: {
        type: String,
        // required: [true, 'Password is required'],
    },

});
const Agent = mongoose.model('Agent', agentSchema);
module.exports = Agent;








