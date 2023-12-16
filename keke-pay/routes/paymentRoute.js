const express = require('express');
const paymentRouter = express.Router();
const { getAllPayments, getPaymentsOfSingleUser, getPaymentByReceiptNumber, } = require('../controllers/paymentHistory')

paymentRouter.get('/all-payments', getAllPayments);
paymentRouter.get('/payments/:userId', getPaymentsOfSingleUser);
paymentRouter.post('/fetch-record', getPaymentByReceiptNumber)

module.exports = paymentRouter;
