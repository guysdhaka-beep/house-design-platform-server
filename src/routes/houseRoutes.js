

const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  createHouse,
  getAllHouses,
  getHouse,
  updateHouse,
  deleteHouse,
  searchHouses,
} = require("../controllers/houseController");

// Create House
router.post(
  "/",
  upload.fields([
    { name: "image3d", maxCount: 1 },
    { name: "image2d", maxCount: 1 },
  ]),
  createHouse
);

// Smart Search
router.get("/search", searchHouses);


// Get All Houses
router.get("/", getAllHouses);

// Get Single House
router.get("/:id", getHouse);

// Update House with optional new images
router.put(
  "/:id",
  upload.fields([
    { name: "image3d", maxCount: 1 },
    { name: "image2d", maxCount: 1 },
  ]),
  updateHouse
);

// Delete House
router.delete("/:id", deleteHouse);

module.exports = router;
