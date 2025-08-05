const express = require('express');
// const methodOverride = require('method-override');
const router = express.Router();
const authemiddleware = require('../middlewares/authenticate');
const {uploadToGridFS,upload,connectToDatabase,closeDatabaseConnection} = require('../config/gridFS')
const { GridFSBucket, ObjectId } = require('mongodb');
require('dotenv').config()




router.post('/upload', upload.single('file'), async (req, res) => {
    // console.log("file", req.file);
    // console.log("body", req.body);
    try {
      if (!req.file) {
        throw new Error('No file uploaded'); // Handle missing file
      }
      const fileId = await uploadToGridFS(req.file, req.body); // Access additional data from req.body
      return res.json({ message: 'File uploaded successfully!', fileId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error uploading file' });
    }
  });




router.get('/download/:filename', async (req, res) => {
    const client = await connectToDatabase();
    try {
      const db = client.db(process.env.DATABASE);
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  
      const filename = req.params.filename;
  
      // Find the file by filename
      const file = await bucket.find({ filename: filename }).toArray();
      //Uses GridFS's .find() to locate the file metadata.
  
      if (!file || file.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }
  
      // Set headers to prompt download
      res.setHeader('Content-Disposition', `attachment; filename="${file[0].filename}"`);
  
      // Stream the file to the response
      const downloadStream = bucket.openDownloadStreamByName(filename);
      downloadStream.pipe(res);
      // it automatically send response to client
  
      downloadStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        closeDatabaseConnection(client)
        return res.status(500).json({ message: 'Error streaming file' });
      });

      downloadStream.on('end',()=>{
        closeDatabaseConnection(client)
      })
      
  
    } catch (error) {
      console.error('Error downloading file:', error);
      closeDatabaseConnection(client)
      return res.status(500).json({ message: 'Error downloading file' });
      
    }
  });

module.exports = router;