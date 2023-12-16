const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// const receiptNo = uuidv4().substring(0, 6).toUpperCase();
const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    receiptNumber: {
        type: String,
        default: function () {
            return uuidv4().substring(0, 6).toUpperCase();
        },
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;

