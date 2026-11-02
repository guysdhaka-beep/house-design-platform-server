require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");

const app = express();

app.use(compression());

app.use(cors());

app.use(express.json());

const adminRoutes = require("./routes/adminRoutes");
const houseRoutes = require("./routes/houseRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/houses", houseRoutes);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "365d",
    immutable: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "House Design Platform API is Running 🚀",
  });
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: err.message,
    stack: err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});