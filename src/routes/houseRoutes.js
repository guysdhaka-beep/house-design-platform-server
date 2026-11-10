const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  createHouse,
  getAllHouses,
  getHouse,
  getRelatedHouses,
  updateHouse,
  deleteHouse,
  searchHouses,
} = require("../controllers/houseController");

// ==============================
// Search (must stay before /:id)
// ==============================
router.get("/search", searchHouses);

// ==============================
// Related Houses
// Must stay before /:id
// ==============================
router.get("/related/:id", getRelatedHouses);

// ==============================
// Get All Houses
// ==============================
router.get("/", getAllHouses);

// ==============================
// Get Single House
// ==============================
router.get("/:id", getHouse);

// ==============================
// Create House
// ==============================
router.post(
  "/",
  upload.fields([
    { name: "image3d", maxCount: 1 },
    { name: "image2d", maxCount: 1 },
  ]),
  createHouse
);

// ==============================
// Update House
// ==============================
router.put(
  "/:id",
  upload.fields([
    { name: "image3d", maxCount: 1 },
    { name: "image2d", maxCount: 1 },
  ]),
  updateHouse
);

// ==============================
// Delete House
// ==============================
router.delete("/:id", deleteHouse);

module.exports = router;