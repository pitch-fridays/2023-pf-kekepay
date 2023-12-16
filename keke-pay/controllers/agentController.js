const Agent = require('../models/Agent');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');


const client = new MongoClient(process.env.URI);
client.connect();

exports.registerAgent = async (req, res) => {

    try {
        const { email, fullName, password, confirmPassword } = req.body;
        if (!email || !fullName || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'password do not match' });
        }

        const agentExist = await Agent.findOne({ email });

        if (agentExist) {

            return res.status(409).json({ message: 'Agent with this email exists' })

        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const agents = new Agent({ email, fullName, password: hashedPassword });

        await agents.save();

        res.status(200).json({ success: true, message: 'Agent registered successfully.' })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal serveer error' })
    }
}

exports.loginAgent = async (req, res) => {

    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const agent = await Agent.findOne({ email });

        if (!agent) {
            return res.status(401).json({ message: 'Agent not found.' });
        }

        console.log('Retrieved agent:', agent);


        const passwordMatch = await bcrypt.compare(password, agent.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            agentId: agent._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed.' });
    }

}


exports.upDateAgent = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, } = req.body;

    // if (!fullName || !email) {
    //     res.status(404).json({ message: 'input field cannot be empty' })
    // }

    try {
        // Check if the user exists
        const existingAgent = await Agent.findById(id);

        if (!existingAgent) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare the updated user data
        const updatedUserAgentData = {};

        if (fullName) {
            updatedUserAgentData.fullName = fullName;
        }

        if (email) {
            updatedUserAgentData.email = email;
        }



        // Perform the update
        const updatedAgent = await Agent.findByIdAndUpdate(id, updatedUserAgentData, { new: true });

        // Return the updated user data
        res.status(200).json({ message: 'profile updated successsfully', updatedAgent });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const agentId = req.params.agentId;
        console.log('agent id ' + agentId);
        const { currentPassword, newPassword, confirmPassword } = req.body;

        console.log(currentPassword);
        console.log(newPassword);
        console.log(confirmPassword);

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(404).json({ message: 'Input fields cannot be empty' });
        }



        // Fetch the user from the MongoDB collection
        const agent = await client.db("keke-pay").collection("agents").findOne({ _id: new ObjectId(agentId) });

        if (!agent) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(401).json({ message: 'Password do not match' });
        }


        // Check if the current password matches
        const isPasswordValid = await bcrypt.compare(currentPassword, agent.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the MongoDB collection
        const result = await client.db("keke-pay").collection("agents").updateOne(
            { _id: new ObjectId(agentId) },
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
        res.status(500).json({ error: 'Internal Server Error' });
        console.error(error);
    }
};
