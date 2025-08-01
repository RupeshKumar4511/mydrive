const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');

const dotenv = require('dotenv');
dotenv.config();


const uri = process.env.DB_URI;
const dbName = process.env.DATABASE;
const collectionName = "uploads"; // GridFS collection name


async function connectToDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

async function closeDatabaseConnection(client) {
  try {
    await client.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Failed to close MongoDB connection", error);
  }
}


async function uploadToGridFS(file, metadata) {
  const client = await connectToDatabase();
  try {
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const uploadStream = bucket.openUploadStream(file.originalname, { metadata });
    const bufferStream = require('stream').Readable.from(file.buffer);

    const uploadPromise = new Promise((resolve, reject) => {
      bufferStream.pipe(uploadStream)
        .on('error', (err) => {
          reject(err);
          closeDatabaseConnection(client); // Close connection on error
        })
        .on('finish', () => {
          resolve(uploadStream.id);
          closeDatabaseConnection(client); // Close connection on finish
        });
    });

    return uploadPromise;
  } catch (error) {
    closeDatabaseConnection(client); // Ensure connection is closed on catch
    throw error;
  }
}


const storage = multer.memoryStorage();
const upload = multer({ storage });


module.exports = {uploadToGridFS,upload,connectToDatabase}


