const dotenv = require("dotenv");
dotenv.config();

const SERVICE_KEY = process.env.SERVICE_KEY;

function validateServiceKey(req, res, next) {
  const key = req.headers["x-service-key"];
  if (!key || key !== SERVICE_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = validateServiceKey;