const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

dotenv.config();
const router = express.Router();

const ENVIRONMENT = process.env.ENVIRONMENT || "production";
const PORT = process.env.PORT || 3200;

const BASE_UPLOAD_DIR =
  ENVIRONMENT === "development"
    ? path.resolve("./assets")
    : "/var/www/cdn/assets";

const BASE_URL =
  ENVIRONMENT === "development"
    ? `http://localhost:${PORT}/assets`
    : "https://cdn.bitezy.online/assets";

fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });

function sanitizeMerchantId(id) {
  if (!id) return null;
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return clean.length ? clean : null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const merchantId = sanitizeMerchantId(req.body.merchantId);
    if (!merchantId) {
      return cb(new Error("Invalid merchantId"));
    }
    req.merchantId = merchantId;
    const merchantDir = path.join(BASE_UPLOAD_DIR, merchantId);
    fs.mkdirSync(merchantDir, { recursive: true });
    cb(null, merchantDir);
  },

  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const merchantId = req.merchantId;
      const originalPath = req.file.path;
      const webpName = uuidv4() + ".webp";
      const webpPath = path.join(
        BASE_UPLOAD_DIR,
        merchantId,
        webpName
      );

      await sharp(originalPath)
        .webp({ quality: 70 }) // lower quality = lower file
        .toFile(webpPath);

      fs.unlinkSync(originalPath);
      const publicUrl = `${BASE_URL}/${merchantId}/${webpName}`;
      res.json({
        success: true,
        merchantId,
        filename: webpName,
        url: publicUrl,
        note: "Made by Ariel Jericko Gacilo with love ❤️."
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
