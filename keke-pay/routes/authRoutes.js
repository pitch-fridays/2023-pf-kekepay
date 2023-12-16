const express = require('express');
const authRouter = express.Router();
const { sendVerificationCode, confirmVerificationCode, registerUser, loginUser, logoutUser } = require('../controllers/authController');
// const { validateUserRegistration, validateRegistrationErrors, } = require('../validator/userValidator');

authRouter.post('/send-code', sendVerificationCode);
authRouter.post('/confirm-code', confirmVerificationCode);
authRouter.post('/register/:id', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);


module.exports = authRouter;

