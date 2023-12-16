const Transaction = require('../models/Transaction');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.PUBLIC_KEY, process.env.SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const uuid = uuidv4();

require('dotenv').config();


const client = new MongoClient(process.env.URI);
client.connect();


// logic for gettting all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

//logic for getting a single user
exports.getSingleUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
};

// logic to apdating a user
// exports.upDateUser = async (req, res) => {
//     const { id } = req.params;
//     const {} = req.body;

//     try {
//         const user = await User.findByIdAndUpdate(id, updatedUserData, { new: true });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(200).json(user);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to update user' });
//     }
// };

exports.upDateUser = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, registrationNumber } = req.body;

    try {
        // Check if the user exists
        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare the updated user data
        const updatedUserData = {};

        if (fullName) {
            updatedUserData.fullName = fullName;
        }

        if (email) {
            updatedUserData.email = email;
        }

        if (registrationNumber) {
            updatedUserData.registrationNumber = registrationNumber;
        }

        // Perform the update
        const updatedUser = await User.findByIdAndUpdate(id, updatedUserData, { new: true });

        // Return the updated user data
        res.status(200).json({ message: 'Profile updated successfully.', name: existingUser.fullName, updatedUser, });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;


        // Fetch the user from the MongoDB collection
        const user = await client.db("keke-pay").collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(401).json({ message: 'Password do not match' });
        }


        // Check if the current password matches
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the MongoDB collection
        const result = await client.db("keke-pay").collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password: hashedPassword,
                },
            }
        );

        // Check if the update was successful
        if (result.matchedCount > 0) {
            res.status(200).json({ message: 'Password changed successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// function for adding fund to user wallet
// let count = 0;
exports.addFund = async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId);
        const { amount, cardNumber, mm, yy, cvv, pin } = req.body;

        if (!amount || !cardNumber || !mm || !yy || !cvv || !pin) {
            return res.status(400).json({ message: 'Missing required fields in the request body' });
        }

        const payload = {
            "card_number": cardNumber,
            "cvv": cvv,
            "expiry_month": mm,
            "expiry_year": yy,
            "currency": "NGN",
            "amount": +amount,
            "redirect_url": "https://www.google.com",
            "fullname": user.fullName,
            "email": user.email,
            "enckey": process.env.ENCRYPTION_KEY,
            "tx_ref": uuid,
        };
        const response = await flw.Charge.card(payload);
        if (response.meta.authorization.mode === pin) {
            let payload2 = { ...payload }
            payload2.authorization = {
                "mode": "pin",
                "fields": [
                    "pin"
                ],
                "pin": pin
            }
            const reCallCharge = await flw.Charge.card(payload2)
            const callValidate = await flw.Charge.validate({
                "otp": "12345",
                "flw_ref": reCallCharge.data.flw_ref
            })
        }

        if (response.meta.authorization.mode === 'redirect') {
            let url = response.meta.authorization.redirect
            open(url)
        }
        // Transaction succeeded
        user.balance += parseFloat(amount);
        user.totalTransactions = (user.totalTransactions || 0) + 1;

        await user.save();

        // Save transaction details
        const transaction = new Transaction({
            user: user._id,
            date: new Date(),
            description: 'Adding funds to wallet',
            amount: parseFloat(amount),
            status: 'completed',
            totalTransactions: user.totalTransactions
        });

        await transaction.save();

        const userTransactions = await Transaction.find({ user: user._id });
        // const userBalance = user.balance;
        // const userTotalNumberOftransactions = user.totalTransactions
        // console.log(userBalance);
        res.status(200).json({
            success: true,
            message: 'fund added successfully',
            count: user.totalTransactions,
            balance: user.balance,
            userTransactions
        })
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment' });
        console.error('Error processing payment:', error);

    }
}

exports.transferFund = async (req, res) => {

    const userId = req.params.userId
    const user = await User.findById(userId);
    const { amount, accountNumber } = req.body;
    if (!amount || !accountNumber) {
        return res.status(400).json({ message: 'Missing required fields in the request body' });
    }

    if (parseFloat(amount) > user.balance) {
        return res.status(400).json({ message: 'Insufficient funds for the transfer' });
    }



    const flw = new Flutterwave(process.env.PUBLIC_KEY, process.env.SECRET_KEY);
    const details = {
        account_bank: "044",
        account_number: accountNumber,
        amount: amount,
        narration: "Transfer",
        currency: "NGN",
        reference: uuidv4().substring(0, 6).toUpperCase(),
        callback_url: "https://webhook.site/b3e505b0-fe02-430e-a538-22bbbce8ce0d",
        debit_currency: "NGN"
    };
    flw.Transfer.initiate(details)
        .then((response) => {

            user.balance -= parseFloat(amount);
            user.totalTransactions = (user.totalTransactions || 0) + 1;

            user.save();

            const transaction = new Transaction({
                user: user._id,
                date: new Date(),
                description: 'Transfer funds from wallet',
                amount: parseFloat(amount),
                status: 'completed',
                totalTransactions: user.totalTransactions
            });

            transaction.save();

            console.log('Transfer initiated successfully:', response);
            res.status(200).json({
                success: true,
                message: 'Transfer initiated successfully',
                balance: user.balance,
                count: user.totalTransactions,
                data: response
            });
        })
        .catch((error) => {
            const transaction = new Transaction({
                user: user._id,
                date: new Date(),
                description: 'Transfer funds from wallet',
                amount: parseFloat(amount),
                status: 'failed',
                totalTransactions: user.totalTransactions
            });
            transaction.save();
            console.error('Error initiating transfer:', error);
            res.status(500).json({ success: false, message: 'Error initiating transfer', error: error.message });
        });
}



