 

// Default order settings
const DEFAULT_ORDER_SETTINGS = {
  autoCalcPelottePos: true,
  autoSendToProd: false,
  attachFootScans: true,
  showMeasPoints10_11: false,
  printFootScans: true,
  showMeasPoints10_11_Det: false,
};

/**
 * GET - Fetch order settings for a partner
 * Creates default settings if they don't exist
 */
export const getOrderSettings = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user?.id;

    if (!partnerId) {
      return reply.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if settings exist
    let orderSettings = await prisma.order_settings.findUnique({
      where: { partnerId },
    });

    // If settings don't exist, create default settings
    if (!orderSettings) {
      orderSettings = await prisma.order_settings.create({
        data: {
          partnerId,
          ...DEFAULT_ORDER_SETTINGS,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Order settings fetched successfully",
      data: orderSettings,
    });
  } catch (error: any) {
    console.error("Error in getOrderSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message || "Unknown error",
    });
  }
};
 

/**
 * PUT/POST - Update order settings for a partner
 * Creates default settings if they don't exist, then updates
 */
export const manageOrderSettings = async (request, reply) => {
  try {
    const partnerId = request.user?.id;
    const prisma = request.server.prisma;

    if (!partnerId) {
      return reply.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      autoCalcPelottePos,
      autoSendToProd,
      attachFootScans,
      showMeasPoints10_11,
      printFootScans,
      showMeasPoints10_11_Det,
    } = request.body;

    // Validate boolean fields if provided
    const updateData: any = {};

    if (autoCalcPelottePos !== undefined) {
      if (typeof autoCalcPelottePos !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "autoCalcPelottePos must be a boolean value",
        });
      }
      updateData.autoCalcPelottePos = autoCalcPelottePos;
    }

    if (autoSendToProd !== undefined) {
      if (typeof autoSendToProd !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "autoSendToProd must be a boolean value",
        });
      }
      updateData.autoSendToProd = autoSendToProd;
    }

    if (attachFootScans !== undefined) {
      if (typeof attachFootScans !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "attachFootScans must be a boolean value",
        });
      }
      updateData.attachFootScans = attachFootScans;
    }

    if (showMeasPoints10_11 !== undefined) {
      if (typeof showMeasPoints10_11 !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "showMeasPoints10_11 must be a boolean value",
        });
      }
      updateData.showMeasPoints10_11 = showMeasPoints10_11;
    }

    if (printFootScans !== undefined) {
      if (typeof printFootScans !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "printFootScans must be a boolean value",
        });
      }
      updateData.printFootScans = printFootScans;
    }

    if (showMeasPoints10_11_Det !== undefined) {
      if (typeof showMeasPoints10_11_Det !== "boolean") {
        return reply.status(400).send({
          success: false,
          message: "showMeasPoints10_11_Det must be a boolean value",
        });
      }
      updateData.showMeasPoints10_11_Det = showMeasPoints10_11_Det;
    }

    // Check if at least one field is provided
    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({
        success: false,
        message: "At least one setting field is required",
      });
    }

    // Check if settings exist
    let orderSettings = await prisma.order_settings.findUnique({
      where: { partnerId },
    });

    // If settings don't exist, create with defaults first
    if (!orderSettings) {
      orderSettings = await prisma.order_settings.create({
        data: {
          partnerId,
          ...DEFAULT_ORDER_SETTINGS,
          ...updateData, // Apply updates on creation
        },
      });
    } else {
      // Update existing settings
      orderSettings = await prisma.order_settings.update({
        where: { partnerId },
        data: updateData,
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Order settings updated successfully",
      data: orderSettings,
    });
  } catch (error: any) {
    console.error("Error in manageOrderSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message || "Unknown error",
    });
  }
};