const multer = require("multer");

// Configure storage to store files temporarily in memory as Buffer
const storage = multer.memoryStorage();
// Set file size limit to 5MB
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  // Filter files to allow only specific image formats
  fileFilter: (req, file, cb) => {

    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      // Accept the file
      cb(null, true);
    } else {
      // Reject the file with an error message
      cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }

  }
});

module.exports = upload