import { getImageUrl } from "../../../utils/baseurl";

export const createCustomerHistoryNote = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { note, date } = request.body;
    const { customerId } = request.params;

    if (!note) {
      return reply.status(400).send({
        success: false,
        message: "Note is required",
      });
    }

    if (!customerId) {
      return reply.status(400).send({
        success: false,
        message: "customerId parameter is required",
      });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return reply.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customerHistory = await prisma.customerHistorie.create({
      data: {
        customer: {
          connect: { id: customerId },
        },
        category: "Notizen",
        note: note,
        date: date,
        system_note: note,
      },
      select: {
        id: true,
        customerId: true,
        category: true,
        note: true,
        date: true,
        system_note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    reply.status(201).json({
      success: true,
      message: "Customer history note created successfully",
      data: customerHistory,
    });
  } catch (error: any) {
    console.error("Create Customer History Note Error:", error);
    reply.status(500).send({
      success: false,
      message: error.message ? error.message : "Something went wrong",
      error: error.message,
    });
  }
};

export const getAllCustomerHistory = async (request, reply) => {
  const prisma = request.server.prisma;
  const validEventCategories = [
    "Notizen",
    "Bestellungen",
    "Leistungen",
    "Rechnungen",
    "Zahlungen",
    "Emails",
    "Termin",
  ];
  try {
    const { page = 1, limit = 10, customerId, category } = request.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    if (category && !validEventCategories.includes(category as string)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid category value",
        error: `Category must be one of: ${validEventCategories.join(", ")}`,
        validCategories: validEventCategories,
      });
    }

    const whereCondition: any = {};

    if (customerId) {
      whereCondition.customerId = customerId as string;
    }

    if (category) {
      whereCondition.category = category as string;
    }

    const [history, totalCount] = await Promise.all([
      prisma.customerHistorie.findMany({
        where: whereCondition,
        skip,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customerHistorie.count({ where: whereCondition }),
    ]);

    const historyWithBaseUrl = history.map((record) => {
      if (record.url) {
        record.url = getImageUrl(record.url);
      }
      return record;
    });

    reply.status(200).send({
      success: true,
      message: "Customer history retrieved successfully",
      data: historyWithBaseUrl,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    console.error("Get All Customer History Error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getCustomerHistoryById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const history = await prisma.customerHistorie.findUnique({
      where: { id },
    });

    if (!history) {
      return reply.status(404).json({
        success: false,
        message: "Customer history not found",
      });
    }

    reply.status(200).send({
      success: true,
      message: "Customer history retrieved successfully",
      data: history,
    });
  } catch (error: any) {
    console.error("Get Customer History By ID Error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};


export const updateCustomerHistory = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { historyId } = request.params;
    const { note, url, methord, date, paymentIs, eventId, category } = request.body;

    if (!historyId) {
      return reply.status(400).send({
        success: false,
        message: "historyId parameter is required",
      });
    }

    const updateFields = {
      note,
      url,
      methord,
      date,
      paymentIs,
      eventId,
      category,
    };
    const hasUpdateData = Object.values(updateFields).some(
      (value) => value !== undefined
    );

    if (!hasUpdateData) {
      return reply.status(400).send({
        success: false,
        message: "At least one field is required for update",
      });
    }

    if (category !== undefined) {
      const validEventCategories = new Set([
        "Notizen",
        "Bestellungen",
        "Leistungen",
        "Rechnungen",
        "Zahlungen",
        "Emails",
        "Termin",
      ]);

      if (!validEventCategories.has(category)) {
        return reply.status(400).send({
          success: false,
          message: "Invalid category value",
          error: `Category must be one of: ${Array.from(
            validEventCategories
          ).join(", ")}`,
          validCategories: Array.from(validEventCategories),
        });
      }
    }

    const updateData: any = {};

    if (note !== undefined) {
      updateData.note = note;
    }
    if (url !== undefined) updateData.url = url;
    if (methord !== undefined) updateData.methord = methord;
    if (paymentIs !== undefined) updateData.paymentIs = paymentIs;
    if (eventId !== undefined) updateData.eventId = eventId;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;

    const updatedHistory = await prisma.customerHistorie.update({
      where: { id: historyId },
      data: {
        ...updateData,
        ...(note !== undefined && {
          system_note: {
            set: updateData.category === "Notizen" ? note : undefined,
          },
        }),
      },
    });

    if (updatedHistory.url) {
      updatedHistory.url = getImageUrl(updatedHistory.url);
    }

    reply.status(200).send({
      success: true,
      message: "Customer history updated successfully",
      data: updatedHistory,
    });
  } catch (error: any) {
    console.error("Update Customer History Error:", error);

    if (error.code === "P2025") {
      return reply.status(404).json({
        success: false,
        message: "Customer history record not found",
      });
    }

    reply.status(500).send({
      success: false,
      message: "Something went wrong while updating customer history",
      error: error.message ? error.message : "Internal server error",
    });
  }
};

export const deleteCustomerHistory = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { historyId } = request.params;

    if (!historyId) {
      return reply.status(400).send({
        success: false,
        message: "historyId parameter is required",
      });
    }

    const existingHistory = await prisma.customerHistorie.findUnique({
      where: { id: historyId },
    });

    if (!existingHistory) {
      return reply.status(404).json({
        success: false,
        message: "Customer history record not found",
      });
    }

    await prisma.customerHistorie.delete({
      where: { id: historyId },
    });

    reply.status(200).send({
      success: true,
      message: "Customer history deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Customer History Error:", error);

    if (error.code === "P2025") {
      return reply.status(404).json({
        success: false,
        message: "Customer history record not found",
      });
    }

    reply.status(500).send({
      success: false,
      message: "Something went wrong while deleting customer history",
      error: error.message ? error.message : "Internal server error",
    });
  }
};
