const Payment = require('../models/Payment')

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        res.status(200).json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch all payments' });
    }
};

let count = 0;
exports.getPaymentByReceiptNumber = async (req, res) => {

    const { receiptNumber } = req.body
    try {

        console.log(receiptNumber);
        const payments = await Payment.findOne({ receiptNumber });

        // console.log(payments);

        if (!payments) {
            return res.status(401).json({ message: 'no record found' })
        }

        // payments.count = (payments.count || 0) + 1;

        // payments.save();

        count++;




        res.status(200).json({ count, payments });

    } catch (error) {

        console.error(error);


    }

}

exports.getPaymentsOfSingleUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const payments = await Payment.find({ user: userId });
        res.status(200).json(payments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch payment history for this user' })
    }
}
