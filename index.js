const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'https://interns-task-7twk.vercel.app',
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
                const { name, email, phone, salary, department } = req.body;
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
                    phone,
                    salary,
                    department,
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

        // Route to fetch all users
        app.get('/api/users', async (req, res) => {
            try {
                const users = await storage.find().toArray();
                res.status(200).json(users);
            } 
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        // Route to download a user's resume
        app.get('/api/download/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const user = await storage.findOne({ _id: new ObjectId(id) });

                if (!user || !user.resume) {
                    return res.status(404).json({ message: 'Resume not found' });
                }

                res.set({
                    'Content-Type': user.resume.contentType,
                    'Content-Disposition': `attachment; filename="${user.resume.name}"`,
                });

                res.send(user.resume.data);
            } 
            catch (error) {
                console.error('Error downloading resume:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

run().catch(console.dir);
