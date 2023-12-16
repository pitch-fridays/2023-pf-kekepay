const express = require('express');
const agentRouter = express.Router();

const { registerAgent, loginAgent, upDateAgent, changePassword } = require('../controllers/agentController');
agentRouter.post('/register', registerAgent);
agentRouter.post('/login', loginAgent);
agentRouter.patch('/update-agent/:id', upDateAgent);
agentRouter.put('/change-password/:agentId', changePassword);


module.exports = agentRouter;