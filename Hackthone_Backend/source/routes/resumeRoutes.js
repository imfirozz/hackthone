const express = require("express");
const multer = require("multer");
const resumeRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return callback(new Error("Only PDF files are allowed"));
    }

    callback(null, true);
  },
});

resumeRouter.post("/upload", (req, res) => {
  upload.single("resume")(req, res, async (error) => {
    try {
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (!req.file?.buffer) {
        return res.status(400).json({
          message: "Resume PDF is required. Send it as multipart/form-data using the field name 'resume'.",
        });
      }

      const { parseResumeBuffer } = require("../services/aiResumeParser");
      const result = await parseResumeBuffer(req.file.buffer);

      return res.status(200).json({
        message: "Resume parsed successfully",
        fileName: req.file.originalname,
        parser: result.parser,
        data: result.parsedData,
        extractedText: result.extractedText,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Failed to parse resume",
        error: err.message,
      });
    }
  });
});

module.exports = resumeRouter;
