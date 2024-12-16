import multer from 'multer';

// Configure storage options
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Set the destination folder for file uploads
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, `${file.originalname}`);
    }
});

// File filter to restrict uploads by file type 
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
};

// Configure multer middleware
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 1024 * 1024 * 10 }, 
    fileFilter: fileFilter 
});

export default upload;
