const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const stream = require('stream')
// Multer : for handling file uploads via HTTP (multipart/form-data)
// GridFS : for storing files in MongoDB that exceed the BSON size limit (16MB)

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
    const bucket = new GridFSBucket(db, { bucketName: collectionName });
    // GridFSBucket is a built-in MongoDB class that manages file storage.
    // bucketName defines the collection prefix used internally:
    // Files go into: <bucketName>.files
    // Chunks go into: <bucketName>.chunks


    const uploadStream = bucket.openUploadStream(file.originalname, { metadata });
    const bufferStream = stream.Readable.from(file.buffer);
    // uploadStream: where you write file data to be stored in MongoDB
    // bufferStream: the in-memory file data (uploaded via Multer) is turned into a readable stream



    const uploadPromise = new Promise((resolve, reject) => {
      // Streams are piped: file data goes from bufferStream -> uploadStream.
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
// Configures Multer to store uploaded files in memory, not on disk.

module.exports = {uploadToGridFS,upload,connectToDatabase,closeDatabaseConnection}


