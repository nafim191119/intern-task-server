const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = ['https://interns-task.vercel.app', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());

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

                const userData = {
                    name,
                    email,
                    phone,
                    salary,
                    department,
                    resume: resumeData,
                };

                const result = await storage.insertOne(userData);
                res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

run().catch(console.dir);