
const prisma = require("../prisma");
const cloudinary = require("../cloudinary");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const parseNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value === true || value === "true" || value === "1";
};

const parseJson = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseKeywords = (value) => {
  const parsed = parseJson(value, value);

  if (Array.isArray(parsed)) {
    return parsed.map(String).filter(Boolean);
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return [parsed.trim()];
  }

  return [];
};

const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const uploadIndex = url.pathname.indexOf("/upload/");

    if (uploadIndex === -1) return null;

    let publicPath = url.pathname
      .slice(uploadIndex + 8)
      .replace(/^\/+/, "");

    // Remove Cloudinary version number
    publicPath = publicPath.replace(/^v\d+\//, "");

    // Remove file extension
    return publicPath.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

const getImageMetadata = (body, type) => {
  const prefix = `image${type}`;

  return {
    imageTitle:
      body[`${prefix}Title`] ||
      body[`${prefix}ImageTitle`] ||
      null,

    altText:
      body[`${prefix}Alt`] ||
      body[`${prefix}AltText`] ||
      null,

    caption:
      body[`${prefix}Caption`] || null,

    description:
      body[`${prefix}Description`] || null,

    fileName:
      body[`${prefix}FileName`] ||
      body[`${prefix}Filename`] ||
      null,

    keywords: parseKeywords(body[`${prefix}Keywords`]),
  };
};

const getHouseData = (body, existing = null) => {
  const data = {};

  const stringFields = [
    "title",
    "houseType",
    "folder",
    "designStyle",
    "language",
    "status",
  ];

  const numberFields = [
    "length",
    "width",
    "lengthInches",
    "widthInches",
    "area",
    "foundation",
    "complete",
    "bedroom",
    "bathroom",
    "balcony",
    "kitchen",
    "livingRoom",
    "diningRoom",
    "stair",
  ];

  const booleanFields = [
    "garage",
    "terrace",
    "frontGarden",
    "backGarden",
    "swimmingPool",
    "lift",
    "servantRoom",
  ];

  for (const field of stringFields) {
    if (body[field] !== undefined && body[field] !== "") {
      data[field] = body[field];
    }
  }

  for (const field of numberFields) {
    if (body[field] !== undefined && body[field] !== "") {
      const number = parseNumber(body[field]);

      if (number !== undefined) {
        data[field] = number;
      }
    }
  }

  for (const field of booleanFields) {
    if (body[field] !== undefined) {
      data[field] = parseBoolean(body[field]);
    }
  }

  if (body.featured !== undefined) {
    data.isFeatured = parseBoolean(body.featured);
  }

  if (body.isFeatured !== undefined) {
    data.isFeatured = parseBoolean(body.isFeatured);
  }

  // Support nested room and feature objects
  const rooms = parseJson(body.rooms);
  const features = parseJson(body.features);

  if (rooms && typeof rooms === "object") {
    const roomFields = [
      "bedroom",
      "bathroom",
      "balcony",
      "kitchen",
      "livingRoom",
      "diningRoom",
      "stair",
    ];

    for (const field of roomFields) {
      if (rooms[field] !== undefined) {
        const number = parseNumber(rooms[field]);

        if (number !== undefined) {
          data[field] = number;
        }
      }
    }
  }

  if (features && typeof features === "object") {
    const featureFields = [
      "garage",
      "terrace",
      "frontGarden",
      "backGarden",
      "swimmingPool",
      "lift",
      "servantRoom",
    ];

    for (const field of featureFields) {
      if (features[field] !== undefined) {
        data[field] = parseBoolean(features[field]);
      }
    }
  }

  if (existing) {
    return data;
  }

  // Defaults for new houses
  data.foundation ??= 1;
  data.complete ??= 1;
  data.language ??= "bn";

  return data;
};

// ==========================================
// CREATE HOUSE
// ==========================================

exports.createHouse = async (req, res) => {
  try {
    const image3d = req.files?.image3d?.[0] || null;
    const image2d = req.files?.image2d?.[0] || null;

    const data = getHouseData(req.body);

    if (!data.title || !data.houseType || !data.folder) {
      return res.status(400).json({
        success: false,
        message: "Title, House Type and Folder are required.",
      });
    }

    const images = [];

    if (image3d) {

      images.push({
        type: "3d",
        image: image3d.path,
        sortOrder: 1,
        ...getImageMetadata(req.body, "3d"),
      });

      data.image3d = image3d.path;
    }

    if (image2d) {
      images.push({
        type: "2d",
        image: image2d.path,
        sortOrder: 2,
        ...getImageMetadata(req.body, "2d"),
      });

      data.image2d = image2d.path;
    }

    const keywords = parseKeywords(req.body.keywords);

    if (images.length) {
      data.images = {
        create: images,
      };
    }

    if (keywords.length) {
      data.keywords = {
        create: keywords.map((keyword) => ({
          language: data.language || "bn",
          keyword,
        })),
      };
    }

    const house = await prisma.house.create({
      data,
      include: {
        images: true,
        keywords: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "House Added Successfully",
      house,
    });
  } catch (error) {
    console.error("CREATE HOUSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "House Creation Failed",
      error: error.message,
    });
  }
};

/// ==========================================
// GET ALL HOUSES
// ==========================================

exports.getAllHouses = async (req, res) => {
  console.log("GET ALL HOUSES RUNNING");

  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    
    // ==============================
// Home Page Latest 6 Houses
// ==============================

if (req.query.home === "true") {
  const typeMap = [
    "1-story",
    "2-story",
    "3-story",
    "4-story",
    "Luxury",
    "Tin Shade",
  ];

  const houses = await Promise.all(
    typeMap.map((houseType) =>
      prisma.house.findFirst({
        where: {
          houseType,
        },
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          title: true,
          houseType: true,
          folder: true,
          length: true,
          width: true,
          foundation: true,
          complete: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              type: true,
              image: true,
              sortOrder: true,
            },
          },
        },
      })
    )
  );

  res.setHeader("Cache-Control", "public, max-age=300");

  return res.json({
    success: true,
    houses: houses.filter(Boolean),
  });
}

    const where = {};

    if (req.query.type) {
      

      const typeMap = {
        "1-story": "1-story",
        "2-story": "2-story",
        "3-story": "3-story",
        "4-story": "4-story",
        luxury: "Luxury",
        tinshade: "Tin Shade",
      };

      where.houseType = typeMap[req.query.type] || req.query.type;
    }

    

    const total = await prisma.house.count({
      where,
    });

    const houses = await prisma.house.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        title: true,
        houseType: true,
        folder: true,
        length: true,
        width: true,
        foundation: true,
        complete: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            type: true,
            image: true,
            sortOrder: true,
            imageTitle: true,
            altText: true,
            caption: true,
            description: true,
            fileName: true,
            keywords: true,
          },
        },
      },
    });


    res.setHeader("Cache-Control", "public, max-age=300");

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      houses,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
    });
  }
};

// ==========================================
// GET RELATED HOUSES
// Purpose:
// House Details / Floor Plan / Estimate page-এর নিচে
// মোট ১২টি Related House দেখানোর জন্য।
//
// 6 = Same House Type
// 6 = Latest from Other Types
// ==========================================

exports.getRelatedHouses = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const currentHouse = await prisma.house.findUnique({
      where: { id },
      select: {
        id: true,
        houseType: true,
      },
    });

    if (!currentHouse) {
      return res.status(404).json({
        success: false,
        message: "House not found",
      });
    }

    // ===========================
    // Same Type (Latest 6)
    // ===========================

    const sameType = await prisma.house.findMany({
      where: {
        houseType: currentHouse.houseType,
        id: {
          not: id,
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 6,
      select: {
        id: true,
        title: true,
        houseType: true,
        folder: true,
        length: true,
        width: true,
        foundation: true,
        complete: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            type: true,
            image: true,
            sortOrder: true,
          },
        },
      },
    });

    // ===========================
    // One Latest House
    // From Every Other Type
    // ===========================

    const allTypes = [
      "1-story",
      "2-story",
      "3-story",
      "4-story",
      "Luxury",
      "Tin Shade",
    ];

    const otherTypes = allTypes.filter(
      (type) => type !== currentHouse.houseType
    );

    const latestOtherTypes = await Promise.all(
      otherTypes.map((houseType) =>
        prisma.house.findFirst({
          where: {
            houseType,
          },
          orderBy: {
            id: "desc",
          },
          select: {
            id: true,
            title: true,
            houseType: true,
            folder: true,
            length: true,
            width: true,
            foundation: true,
            complete: true,
            images: {
              orderBy: {
                sortOrder: "asc",
              },
              select: {
                id: true,
                type: true,
                image: true,
                sortOrder: true,
              },
            },
          },
        })
      )
    );

    const houses = [
      ...sameType,
      ...latestOtherTypes.filter(Boolean),
    ];

    res.setHeader(
      "Cache-Control",
      "public, max-age=300"
    );

    return res.json({
      success: true,
      houses,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE HOUSE
// ==========================================

exports.getHouse = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid House ID",
      });
    }

    const house = await prisma.house.findUnique({
      where: { id },

      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        keywords: {
          select: {
            language: true,
            keyword: true,
          },
        },
      },
    });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House Not Found",
      });
    }

    res.set(
      "Cache-Control",
      "public, max-age=300, s-maxage=300"
    );

    return res.json({
      success: true,
      house,
    });
  } catch (error) {
    console.error("GET HOUSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// UPDATE HOUSE
// ==========================================



exports.updateHouse = async (req, res) => {
  try {


    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid House ID",
      });
    }

    const existingHouse = await prisma.house.findUnique({
      where: { id },
      include: {
        images: true,
        keywords: true,
      },
    });

    if (!existingHouse) {
      return res.status(404).json({
        success: false,
        message: "House Not Found",
      });
    }

    const updateData = getHouseData(req.body, existingHouse);

    const imageUpdates = [];

    for (const type of ["3d", "2d"]) {
  const fieldName = `image${type}`;
  const newFile = req.files?.[fieldName]?.[0];

  const oldImage = existingHouse.images.find(
    (img) => img.type === type
  );

  const metadata = getImageMetadata(req.body, type);

  if (oldImage && !newFile) {
    metadata.imageTitle ??= oldImage.imageTitle;
    metadata.altText ??= oldImage.altText;
    metadata.caption ??= oldImage.caption;
    metadata.description ??= oldImage.description;
    metadata.fileName ??= oldImage.fileName;
    metadata.keywords =
      metadata.keywords.length > 0
        ? metadata.keywords
        : oldImage.keywords;
  }

  if (newFile) {
    imageUpdates.push({
      type,
      oldImage,
      newFile,
      metadata,
    });

    updateData[fieldName] = newFile.path;
  } else if (oldImage) {
    const metadataKeys = [
      "imageTitle",
      "altText",
      "caption",
      "description",
      "fileName",
      "keywords",
    ];

    const metadataData = {};

    for (const key of metadataKeys) {
      const bodyKey = {
        imageTitle: [`${fieldName}Title`, `${fieldName}ImageTitle`],
        altText: [`${fieldName}Alt`, `${fieldName}AltText`],
        caption: [`${fieldName}Caption`],
        description: [`${fieldName}Description`],
        fileName: [`${fieldName}FileName`, `${fieldName}Filename`],
        keywords: [`${fieldName}Keywords`],
      }[key];

      const provided = bodyKey.some(
        (name) => req.body[name] !== undefined
      );

      if (provided) {
        metadataData[key] = metadata[key];
      }
    }

    if (Object.keys(metadataData).length) {
      await prisma.houseImage.update({
        where: { id: oldImage.id },
        data: metadataData,
      });
    }
  }
}

    // Update house data
    await prisma.house.update({
      where: { id },
      data: updateData,
    });

    // Replace uploaded images
    for (const item of imageUpdates) {
      const { type, oldImage, newFile, metadata } = item;

      if (oldImage) {
        const publicId = getCloudinaryPublicId(oldImage.image);

        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error("OLD IMAGE DELETE ERROR:", error);
          }
        }

        await prisma.houseImage.update({
          where: { id: oldImage.id },
          data: {
            image: newFile.path,
            ...metadata,
          },
        });
      } else {
        await prisma.houseImage.create({
          data: {
            houseId: id,
            type,
            image: newFile.path,
            sortOrder: type === "3d" ? 1 : 2,
            ...metadata,
          },
        });
      }
    }

    // Replace house keywords only when supplied
    if (req.body.keywords !== undefined) {
      const keywords = parseKeywords(req.body.keywords);

      await prisma.$transaction([
        prisma.houseKeyword.deleteMany({
          where: { houseId: id },
        }),

        ...(keywords.length
          ? [
              prisma.houseKeyword.createMany({
                data: keywords.map((keyword) => ({
                  houseId: id,
                  language:
                    updateData.language ||
                    existingHouse.language ||
                    "bn",
                  keyword,
                })),
              }),
            ]
          : []),
      ]);
    }

    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        keywords: true,
      },
    });

    return res.json({
      success: true,
      message: "House Updated Successfully",
      house,
    });
  } catch (error) {
    console.error("UPDATE HOUSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "House Update Failed",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE HOUSE
// ==========================================

exports.deleteHouse = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid House ID",
      });
    }

    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House Not Found",
      });
    }

    // Delete Cloudinary images
    for (const img of house.images) {
      const publicId = getCloudinaryPublicId(img.image);

      if (!publicId) continue;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("CLOUDINARY DELETE ERROR:", error);
      }
    }

    // Delete database record
    // Related records are deleted by Cascade
    await prisma.house.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "House Deleted Successfully",
    });
  } catch (error) {
    console.error("DELETE HOUSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "House Delete Failed",
    });
  }
};

// ==========================================
// SEARCH HOUSES
// ==========================================

exports.searchHouses = async (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toLowerCase();

    if (!q) {
      return res.json({
        success: true,
        houses: [],
      });
    }

    const houses = await prisma.house.findMany({
      select: {
        id: true,
        title: true,
        houseType: true,
        folder: true,
        length: true,
        width: true,
        foundation: true,
        complete: true,

        images: {
          select: {
            type: true,
            image: true,
          },
        },

        keywords: {
          select: {
            keyword: true,
            language: true,
          },
        },
      },
    });

    const normalizedQuery = q.replace(/\s/g, "");

    const scored = houses
      .map((house) => {
        let score = 0;

        const title = (house.title || "").toLowerCase();
        const type = (house.houseType || "").toLowerCase();
        const folder = (house.folder || "").toLowerCase();

        const size1 = `${house.length}x${house.width}`;
        const size2 = `${house.width}x${house.length}`;

        const houseKeywords = house.keywords || [];

        // Exact ID
        if (house.id.toString() === q) {
          score += 100;
        }

        // Title
        if (title === q) score += 90;
        else if (title.startsWith(q)) score += 70;
        else if (title.includes(q)) score += 50;

        // House type
        if (type.includes(q)) score += 40;

        // Folder
        if (folder.includes(q)) score += 20;

        // Dimensions
        if (
          size1.replace(/\s/g, "").includes(normalizedQuery) ||
          size2.replace(/\s/g, "").includes(normalizedQuery)
        ) {
          score += 60;
        }

        // Foundation
        if (house.foundation.toString() === q) {
          score += 20;
        }

        // Complete floor
        if (house.complete.toString() === q) {
          score += 20;
        }

        // SEO keywords
        if (
          houseKeywords.some((item) =>
            item.keyword.toLowerCase().includes(q)
          )
        ) {
          score += 45;
        }

        return {
          ...house,
          score,
        };
      })
      .filter((house) => house.score > 0)
      .sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      houses: scored,
    });
  } catch (error) {
    console.error("SEARCH HOUSES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Search Failed",
    });
  }
};
