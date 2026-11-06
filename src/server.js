require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const prisma = require("./prisma");

const app = express();

app.set("etag", "strong");

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

const allowedOrigins = [
  "http://localhost:5173",
  "https://housedgn.com",
  "https://www.housedgn.com",
];

app.use(
  cors({
    origin(origin, callback) {
      // Postman / Server-to-server request
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(cors());

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
// Dynamic Sitemap
// --------------------------------------
app.get("/sitemap.xml", async (req, res) => {
  try {
    const houses = await prisma.house.findMany({
  select: {
    id: true,
    updatedAt: true,
    houseType: true,
    folder: true,
    complete: true,
    images: {
      select: {
        image: true,
      },
    },
  },
  orderBy: {
    updatedAt: "desc",
  },
});

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Home
    xml += `
      <url>
        <loc>https://housedgn.com/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;

    xml += `
  <url>
    <loc>https://housedgn.com/houses/1-floor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://housedgn.com/houses/2-floor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://housedgn.com/houses/3-floor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://housedgn.com/houses/4-floor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://housedgn.com/houses/luxury</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://housedgn.com/houses/tinshade</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // House Details
    houses.forEach((house) => {
      xml += `
        <url>
          <loc>https://housedgn.com/house/${house.id}</loc>
          <lastmod>${new Date(house.updatedAt).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `;

      // Floor Plan
      xml += `
        <url>
          <loc>https://housedgn.com/floorplan/${house.folder}/${house.complete}/${house.id}</loc>
          <lastmod>${new Date(house.updatedAt).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;

      // Estimate
      xml += `
        <url>
          <loc>https://housedgn.com/estimate/${house.folder}/${house.complete}/${house.id}</loc>
          <lastmod>${new Date(house.updatedAt).toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error(error);

    res.status(500).send("Sitemap Error");
  }
});

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

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;