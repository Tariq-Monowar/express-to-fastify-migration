import { request } from './../../../../node_modules/effect/src/Effect';


// GET - Get customer settings
export const getCustomerSettings = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;

    const customerSettings = await prisma.customer_settings.findFirst({
      where: { partnerId },
    });

    if (!customerSettings) {
      return reply.status(404).json({
        success: false,
        message: "Customer settings not found for this partner",
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Customer settings fetched successfully",
      data: customerSettings,
    });
  } catch (error: any) {
    console.error("Error in getCustomerSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while fetching customer settings",
      error: error.message,
    });
  }
};

// POST - Create or Update customer settings
export const setCustomerSettings = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { cover_types, laser_print_prices, store_location } = request.body;
    const partnerId = request.user.id;

    if (!Array.isArray(cover_types)) {
      return reply.status(400).send({
        success: false,
        message: "cover_types must be an array",
      });
    }

    const existingSettings = await prisma.customer_settings.findFirst({
      where: { partnerId },
    });

    let customerSettings;
    if (existingSettings) {
      customerSettings = await prisma.customer_settings.update({
        where: { id: existingSettings.id },
        data: {
          cover_types: cover_types,
          laser_print_prices: laser_print_prices,
        },
      });
    } else {
      customerSettings = await prisma.customer_settings.create({
        data: {
          partnerId,
          cover_types: cover_types,
          laser_print_prices: laser_print_prices,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Customer settings saved successfully",
      data: customerSettings,
    });
  } catch (error: any) {
    console.error("Error in setCustomerSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while saving customer settings",
      error: error.message,
    });
  }
};

// DELETE - Delete customer settings
export const deleteCustomerSettings = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;

    const existingSettings = await prisma.customer_settings.findFirst({
      where: { partnerId },
    });

    if (!existingSettings) {
      return reply.status(404).json({
        success: false,
        message: "Customer settings not found for this partner",
      });
    }

    await prisma.customer_settings.delete({
      where: { id: existingSettings.id },
    });

    return reply.status(200).send({
      success: true,
      message: "Customer settings deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in deleteCustomerSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while deleting customer settings",
      error: error.message,
    });
  }
};

export const setStoreLocations = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;
    const { address, description, isPrimary } = request.body;
 
    const storeLocation = await prisma.$transaction(async (tx) => {
 
      if (isPrimary === true) {
        await tx.store_location.updateMany({
          where: {
            partnerId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // Create the new store location
      return await tx.store_location.create({
        data: {
          partnerId,
          address,
          description,
          isPrimary: isPrimary === true,
        },
        select: {
          id: true,
          address: true,
          description: true,
          isPrimary: true,
          createdAt: true,
        },
      });
    });

    return reply.status(200).send({
      success: true,
      message: "Store location set successfully",
      data: storeLocation,
    });
  } catch (error: any) {
    console.error("Error in setStoreLocations:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while setting store locations",
      error: error.message,
    });
  }
};

// GET - Get all store locations for a partner with pagination
export const getStoreLocations = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [storeLocations, totalCount] = await Promise.all([
      prisma.store_location.findMany({
        where: { partnerId },
        skip,
        take: limit,
        select: {
          id: true,
          address: true,
          description: true,
          isPrimary: true,
          createdAt: true,
        },
        orderBy: [
          {
            isPrimary: "desc", // Primary locations first (true comes before false)
          },
          {
            createdAt: "desc", // Then by creation date
          },
        ],
      }),
      prisma.store_location.count({ where: { partnerId } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return reply.status(200).send({
      success: true,
      message: "Store locations fetched successfully",
      data: storeLocations,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error: any) {
    console.error("Error in getStoreLocations:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while fetching store locations",
      error: error.message,
    });
  }
};
 
// PUT - Update a store location
export const updateStoreLocations = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;
    const { id } = request.params;
    const { address, description, isPrimary } = request.body;
    if (!id) {
      return reply.status(400).send({
        success: false,
        message: "Store location ID is required",
      });
    }

    // Check if the store location exists and belongs to this partner
    const existingLocation = await prisma.store_location.findFirst({
      where: {
        id,
        partnerId,
      },
    });

    if (!existingLocation) {
      return reply.status(404).json({
        success: false,
        message: "Store location not found or you don't have permission to update it",
      });
    }

    // Use transaction to ensure atomicity
    const updatedLocation = await prisma.$transaction(async (tx) => {
      // If this location is being set as primary, set all other locations to non-primary
      if (isPrimary === true) {
        await tx.store_location.updateMany({
          where: {
            partnerId,
            isPrimary: true,
            id: { not: id }, // Exclude the current location
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // Update the store location
      return await tx.store_location.update({
        where: { id },
        data: {
          address: address !== undefined ? address : existingLocation.address,
          description: description !== undefined ? description : existingLocation.description,
          isPrimary: isPrimary !== undefined ? isPrimary === true : existingLocation.isPrimary,
        },
        select: {
          id: true,
          address: true,
          description: true,
          isPrimary: true,
          createdAt: true,
        },
      });
    });

    return reply.status(200).send({
      success: true,
      message: "Store location updated successfully",
      data: updatedLocation,
    });
  } catch (error: any) {
    console.error("Error in updateStoreLocations:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while updating store location",
      error: error.message,
    });
  }
};

// DELETE - Delete a store location
export const deleteStoreLocations = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;
    const { id } = request.params;

    if (!id) {
      return reply.status(400).send({
        success: false,
        message: "Store location ID is required",
      });
    }

    // Check if the store location exists and belongs to this partner
    const storeLocation = await prisma.store_location.findFirst({
      where: {
        id,
        partnerId,
      },
    });

    if (!storeLocation) {
      return reply.status(404).json({
        success: false,
        message: "Store location not found or you don't have permission to delete it",
      });
    }

    await prisma.store_location.delete({
      where: { id },
    });

    return reply.status(200).send({
      success: true,
      message: "Store location deleted successfully",
      id: storeLocation.id,
    });
  } catch (error: any) {
    console.error("Error in deleteStoreLocations:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while deleting store location",
      error: error.message,
    });
  }
};
