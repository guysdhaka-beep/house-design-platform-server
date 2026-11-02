
const prisma = require("../prisma");

const cloudinary = require("../cloudinary");


// Create House
exports.createHouse = async (req, res) => {
  try {
    const image3d = req.files?.image3d?.[0]?.path || null;
    const image2d = req.files?.image2d?.[0]?.path || null;

    const {
      title,
      houseType,
      folder,
      length,
      width,
      foundation,
      complete,
      featured,
      status,
    } = req.body;

    const house = await prisma.house.create({
      data: {
        title,
        houseType,
        folder,
        length: Number(length),
        width: Number(width),
        foundation: Number(foundation),
        complete: Number(complete),
        isFeatured: featured === "true",
        status: status || "Published",

        images: {
          create: [
            ...(image3d ? [{
              type: "3d",
              image: image3d,
              sortOrder: 1,
            }] : []),

            ...(image2d ? [{
              type: "2d",
              image: image2d,
              sortOrder: 2,
            }] : []),
          ],
        },
      },
      include: {
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "House Added Successfully",
      house,
    });
  } catch (error) {
  console.error("CREATE HOUSE ERROR:");
  console.error(error);

  res.status(500).json({
    success: false,
    message: error.message,
    error,
  });
}
};

// Get All Houses (Server-side Pagination + Type Filter)
exports.getAllHouses = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const type = req.query.type;

    const skip = (page - 1) * limit;

    const where = {};

    if (type) {
      where.houseType = type;
    }

    const total = await prisma.house.count({
      where,
    });

    const houses = await prisma.house.findMany({
      where,

      skip,
      take: limit,

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
      },

      orderBy: {
        id: "desc",
      },
    });

    res.set("Cache-Control", "public, max-age=300");

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      houses,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Single House
exports.getHouse = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const house = await prisma.house.findUnique({
      where: { id },

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

    res.set("Cache-Control", "public, max-age=300");

    res.json({
      success: true,
      house,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update House
exports.updateHouse = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingHouse = await prisma.house.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingHouse) {
      return res.status(404).json({
        success: false,
        message: "House Not Found",
      });
    }

    const {
      title,
      houseType,
      folder,
      length,
      width,
      foundation,
      complete,
      featured,
      status,
    } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (houseType !== undefined) updateData.houseType = houseType;
    if (folder !== undefined) updateData.folder = folder;
    if (length !== undefined) updateData.length = Number(length);
    if (width !== undefined) updateData.width = Number(width);
    if (foundation !== undefined) updateData.foundation = Number(foundation);
    if (complete !== undefined) updateData.complete = Number(complete);

    if (featured !== undefined) {
      updateData.isFeatured = featured === true || featured === "true";
    }

    if (status !== undefined) updateData.status = status;

    await prisma.house.update({
      where: { id },
      data: updateData,
    });

    // Replace uploaded images if new files are provided
    for (const type of ["3d", "2d"]) {
      const fieldName = type === "3d" ? "image3d" : "image2d";
      const newFile = req.files?.[fieldName]?.[0];

      if (!newFile) continue;

      const oldImage = existingHouse.images.find(
        (img) => img.type === type
      );

      if (oldImage) {
  const publicId = oldImage.image
    .split("/")
    .slice(-2)
    .join("/")
    .replace(/\.[^/.]+$/, "");

  await cloudinary.uploader.destroy(publicId);

  await prisma.houseImage.update({
    where: { id: oldImage.id },
    data: {
      image: newFile.path,
    },
  });
} else {
  await prisma.houseImage.create({
    data: {
      houseId: id,
      type,
      image: newFile.path,
      sortOrder: type === "3d" ? 1 : 2,
    },
  });
}
    }

    const updatedHouse = await prisma.house.findUnique({
      where: { id },
      include: {
        images: true,
        keywords: true,
      },
    });

    res.json({
      success: true,
      message: "House Updated Successfully",
      house: updatedHouse,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "House Update Failed",
    });
  }
};

// Delete House
exports.deleteHouse = async (req, res) => {
  try {
    const id = Number(req.params.id);

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

    for (const img of house.images) {
  if (!img.image) continue;

  const publicId = img.image
    .split("/")
    .slice(-2)
    .join("/")
    .replace(/\.[^/.]+$/, "");

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.log(e);
  }
}

    // Delete database record (related records cascade)
    await prisma.house.delete({
      where: { id },
    });

  

    res.json({
      success: true,
      message: "House Deleted Successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "House Delete Failed",
    });
  }
};

exports.searchHouses = async (req, res) => {
  try {
    const q = (req.query.q || "").trim().toLowerCase();

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
  },
});

    const scored = houses
      .map((house) => {
        let score = 0;

        const title = (house.title || "").toLowerCase();
        const type = (house.houseType || "").toLowerCase();

        const size1 = `${house.length}x${house.width}`;
        const size2 = `${house.width}x${house.length}`;

        // Exact ID
        if (house.id.toString() === q) score += 100;

        // Title
        if (title === q) score += 90;
        else if (title.startsWith(q)) score += 70;
        else if (title.includes(q)) score += 50;

        // House Type
        if (type.includes(q)) score += 40;

        // Size
        if (
          size1.includes(q.replace(/\s/g, "")) ||
          size2.includes(q.replace(/\s/g, ""))
        ) {
          score += 60;
        }

        // Foundation
        if (house.foundation.toString() === q) score += 20;

        // Complete Floor
        if (house.complete.toString() === q) score += 20;

        return {
          ...house,
          score,
        };
      })
      .filter((house) => house.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      houses: scored,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Search Failed",
    });
  }
};