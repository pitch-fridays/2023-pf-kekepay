const bcrypt = require('bcrypt');
const randomize = require('randomatic');
const { google } = require('googleapis')
const User = require('../models/User');
const nodemailer = require('nodemailer');

require('dotenv').config();


const CLIENT_ID = process.env.CLIENT_ID;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const userEmails = process.env.email;

const OAuth2client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
OAuth2client.setCredentials({ refresh_token: REFRESH_TOKEN });


// checking for custom errors
const handleCustomError = (err) => {
    const error = { email: '' };
    console.log(err.message, err.code);

    if (err.message.includes()) {
        Object.values(err.errors).forEach(({ properties }) => {
            error[properties.path] = properties.message
        });
    }

    if (err.code === 11000) {
        error.email = 'Email has already been registered';
    }
}

async function sendMail(userEmail, verifyingCode) {

    try {
        const accessToken = await OAuth2client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: userEmails,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: 'Keke-Pay',
            to: userEmail,
            subject: 'Verfication code',
            text: `Your verification code is ${verifyingCode}`
        }

        const result = transport.sendMail(mailOptions);
        return result
    } catch (error) {
        console.log(error.message);
    }
}


// Function to send a verification code to the user's email
exports.sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        // console.log(`from sendVerification ${email}`);

        // Generate a random 6-digit verification code
        const verificationCode = randomize('0', 6);
        console.log(`print verification code from randomize ${verificationCode}`);
        console.log(`Type of verification code from randomize ${typeof verificationCode}`);

        const sendSomeEmail = await sendMail(email, verificationCode);
        // console.log('Email sent', sendSomeEmail);
        sendSomeEmail
        const userExist = await User.findOne({ email });


        if (userExist && !userExist.verified) {

            userExist.email = email;
            userExist.verificationCode = verificationCode;
            userExist.verified = false;

            res.status(200).json({ message: 'Verification code sent. Please check your email.' });
            // console.log(`executed from the if block`);
            console.log(`executed from if block ${verificationCode}`);

            return
        } else {

            const user = new User({
                email,
                verificationCode,
                verified: false,
            });

            await user.save();

            res.status(200).json({ success: true, message: 'Verification code sent. Please check your email.' });
            console.log(`executed from else block ${verificationCode}`);
            return
        }

        // res.status.json()

        // res.status(200).json({ sucess: true, message: 'Verification code sent successfully' });
    } catch (error) {
        console.log("error sending verification code", error);
        const errors = handleCustomError(error);
        res.status(500).json({ message: 'Error sending verification code.' });
    }
};


// confirm verification logic
exports.confirmVerificationCode = async (req, res) => {
    const { verificationCode } = req.body;
    try {
        console.log(`Code to confirm from req.body ${verificationCode}`);
        console.log(`Type of code code to confirm from req.body${typeof verificationCode}`);
        const user = await User.findOne({ verificationCode });

        // Check if the user is found
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if the verification code matches
        if (user.verificationCode == verificationCode) {
            user.verified = true;
            user.verificationCode = null;
            await user.save();

            // Send a response to the client
            res.status(200).json({
                success: true,
                userId: user._id,
                name: user.fullName,
                balance: user.balance,
                count: user.totalTransactions,
                message: 'Account verified successfully'
            });
        } else {
            res.status(401).json({ message: 'Invalid verification code' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Final Registration Step
exports.registerUser = async (req, res) => {
    const id = req.params.id
    try {

        const { fullName, registrationNumber, password, confirmPassword } = req.body;

        // console.log(fullName);
        // console.log(registrationNumber);
        // console.log(password);
        // console.log(confirmPassword);
        if (!fullName || !registrationNumber || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'password do not match' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.findOne({ _id: id });

        if (!user || !user.verified) {

            res.status(404).json({ message: 'User not found` or not verified' });
            return;
        }

        user.fullName = fullName;
        user.registrationNumber = registrationNumber;
        user.password = hashedPassword;
        await user.save();

        // Send a response to the client
        res.status(200).json({ success: true, name: user.fullName, message: 'User information submitted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed.' });
    }
};




exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        // Compare the provided password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        res.status(200).json({
            success: true,
            userId: user._id,
            name: user.fullName,
            balance: user.balance,
            count: user.totalTransactions,
            message: 'Login successful.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed.' });
    }
};

// Logout User
exports.logoutUser = (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Logout successful.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging out.' });
    }
};


