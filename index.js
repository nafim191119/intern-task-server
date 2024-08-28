const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to handle file uploads
app.use(fileUpload());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2go6xuw.mongodb.net/task?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const database = client.db('task');
        const storage = database.collection('storage');

        app.post('/api/signup', async (req, res) => {
            try {
                const { name, email } = req.body;
                const resume = req.files?.resume;

                if (!resume) {
                    return res.status(400).json({ message: "Resume file is required" });
                }

                const resumeData = {
                    name: resume.name,
                    data: resume.data,
                    contentType: resume.mimetype,
                };

                const newUser = {
                    name,
                    email,
                    resume: resumeData,
                };

                const result = await storage.insertOne(newUser);

                if (result.insertedId) {
                    res.status(201).json({ message: 'User registered successfully!' });
                } else {
                    res.status(500).json({ message: 'Failed to register user' });
                }
            }
            catch (error) {
                console.error('Error during user registration:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

run().catch(console.dir);
