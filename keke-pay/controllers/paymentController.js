const schedule = require('node-schedule');
const Payment = require('../models/Payment');
const User = require('../models/User');

async function performDailyDeduction(params) {

    try {
        const users = await User.find();

        //   Deduct N100 from each user's balance
        for (const user of users) {
            if (user.balance >= 100) {
                user.balance -= 100;

                //   Create a transaction record
                const payment = new Payment({
                    user: user._id,
                    description: 'Daily Deduction',
                    amount: 100,
                    status: 'completed',
                });

                await user.save();
                await payment.save();
            }
        }
    } catch (error) {
        console.error('Error during daily deduction:', error);
    }

}
schedule.scheduleJob('*/10 * * * * *', performDailyDeduction);