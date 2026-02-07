const express = require("express");
const validateServiceKey = require("./helper/validateServiceKey");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");
dns.setServers([
  "1.1.1.1", // Cloudflare
  "8.8.8.8"  // Google fallback
]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://api.bitezy.online"
  ],
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type", "x-service-key"],
}));

app.use(express.json());

app.use("/bucket", validateServiceKey, require("./routes/bucket"));
app.use("/mailer", validateServiceKey, require("./routes/mailer"));

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
    note: "Please contact Ariel Jericko Gacilo for assistance."
  });
});

app.get("/", (req, res) => {
  res.send("Made by Ariel Jericko Gacilo with love ❤️.");
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});