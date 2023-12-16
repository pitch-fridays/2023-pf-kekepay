require('dotenv').config();
require('./controllers/paymentController');
const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
// const ConnectMongoDbSession = require('connect-mongodb-session')
const cors = require('cors');
const mongoose = require('mongoose');
// const MongoDbStore = ConnectMongoDbSession(session)

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoute');
const paymentRouter = require('./routes/paymentRoute');
const agentRouter = require('./routes/agentRoute');

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'https://frontend-keke-pay.vercel.app');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });
// .env configuration 

// Configure body-parser to handle URL-encoded data
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS for Express application
app.use(cors({ origin: "*" }));

//midlewares
app.use('/verification', authRouter);
app.use('/user', userRouter);
app.use('/', paymentRouter);
app.use('/', agentRouter);

//mongoDB connection+
const uri = process.env.URI

mongoose.connect(uri).then(() => {
    console.log('Connected to database Successfully');
}).catch(error => {
    console.error('Error while connecting to the database', error)
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
