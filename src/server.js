require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");

const app = express();

// --------------------------------------
// Performance
// --------------------------------------
app.disable("x-powered-by");

app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

// --------------------------------------
// CORS
// --------------------------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// --------------------------------------
// Body Parser
// --------------------------------------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------------------------
// Static Cache
// --------------------------------------
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "365d",
    immutable: true,
    etag: true,
    lastModified: true,
  })
);

// --------------------------------------
// API Cache Headers
// --------------------------------------
app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300"
    );
  }
  next();
});

// --------------------------------------
// Routes
// --------------------------------------
const adminRoutes = require("./routes/adminRoutes");
const houseRoutes = require("./routes/houseRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/houses", houseRoutes);

// --------------------------------------
// Home
// --------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "House Design Platform API is Running 🚀",
  });
});

// --------------------------------------
// Error Handler
// --------------------------------------
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --------------------------------------
// Start Server
// --------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});