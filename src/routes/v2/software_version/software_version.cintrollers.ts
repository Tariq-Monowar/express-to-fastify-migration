 

export const createSoftwareVersion = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { version, releaseDate, title, description } = request.body;

    const requiredFields = ["version", "releaseDate", "description"];
    const missingFields = requiredFields.filter((f) => !request.body[f]);

    if (missingFields.length > 0) {
      return reply.status(400).send({
        success: false,
        message: "Required fields are missing",
        missingFields,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.software_version.updateMany({
        where: { isNewest: true },
        data: { isNewest: false },
      });

      return await tx.software_version.create({
        data: {
          version,
          releaseDate: new Date(releaseDate),
          title,
          description,
          isNewest: true,
        },
      });
    });

    reply.status(201).json({
      success: true,
      message: "Software version created and set as newest",
      data: result,
    });
  } catch (error) {
    console.error("Error create version:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to create software version",
      error: error.message,
    });
  }
};


export const getAllSoftwareVersions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.software_version.count();

    const versions = await prisma.software_version.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    reply.status(200).send({
      success: true,
      message: total === 0 ? "No software versions found" : "Software versions fetched",
      data: versions,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages && total > 0,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error get versions:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch software versions",
    });
  }
};


export const getSoftwareVersionById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const version = await prisma.software_version.findUnique({
      where: { id },
    });

    if (!version) {
      return reply.status(404).json({
        success: false,
        message: "Software version not found",
      });
    }

    reply.status(200).send({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error("Error get version:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch software version",
    });
  }
};

export const deleteSoftwareVersion = async (request, reply) => {
  try {
    const { id } = request.params;
    const prisma = request.server.prisma;

    const existing = await prisma.software_version.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).json({
        success: false,
        message: "Software version not found",
      });
    }

    await prisma.software_version.delete({
      where: { id },
    });

    reply.status(200).send({
      success: true,
      message: "Software version deleted successfully",
    });
  } catch (error) {
    console.error("Error delete version:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to delete software version",
    });
  }
};


export const updateSoftwareVersion = async (request, reply) => {

  try {
    const { id } = request.params;
    const { version, releaseDate, title, description, isNewest } = request.body;
    const prisma = request.server.prisma;

    const existing = await prisma.software_version.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).json({
        success: false,
        message: "Software version not found",
      });
    }

    const updateData: any = {};
    if (version !== undefined) updateData.version = version;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (releaseDate !== undefined)
      updateData.releaseDate = new Date(releaseDate);

    if (isNewest === true) {
 
      const updated = await prisma.$transaction(async (tx) => {
        await tx.software_version.updateMany({
          where: { isNewest: true },
          data: { isNewest: false },
        });

        // Update this version
        updateData.isNewest = true;
        return await tx.software_version.update({
          where: { id },
          data: updateData,
        });
      });

      return reply.status(200).send({
        success: true,
        message: "Software version updated successfully (set as newest)",
        data: updated,
      });
    }

    // Normal update if isNewest is not true
    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({
        success: false,
        message: "No fields provided to update",
      });
    }

    const updated = await prisma.software_version.update({
      where: { id },
      data: updateData,
    });

    reply.status(200).send({
      success: true,
      message: "Software version updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error update version:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to update software version",
      error: error.message,
    });
  }
};


