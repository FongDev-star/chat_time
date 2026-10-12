import multer from "multer";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV."));
  },
});

// Wraps multer so its errors come back as clean JSON messages
export const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File is too large (max 50 MB)" });
    }
    return res.status(400).json({ message: err.message || "Upload error" });
  });
};