export const setNewPrice = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { fußanalyse, einlagenversorgung } = request.body;

    const newPrice = await prisma.customer_price.create({
      data: {
        fußanalyse,
        einlagenversorgung,
        partnerId: request.user.id,
      },
    });

    reply.status(201).json({
      success: true,
      message: "Price created successfully",
      data: newPrice,
    });
  } catch (error: any) {
    reply.status(500).send({ success: false, message: error.message });
  }
};

export const getAllPrices = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { page = 1, limit = 10 } = request.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      return reply.status(400).send({
        success: false,
        message: "Invalid page or limit",
      });
    }

    const totalItems = await prisma.customer_price.count({
      where: { partnerId: request.user.id },
    });

    const totalPages = Math.ceil(totalItems / limitNumber);

    const prices = await prisma.customer_price.findMany({
      where: { partnerId: request.user.id },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: { createdAt: "desc" },
    });

    reply.status(200).send({
      success: true,
      message: "Prices fetched successfully",
      data: prices,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    reply.status(500).send({ success: false, message: error.message });
  }
};

export const getPriceById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const price = await prisma.customer_price.findUnique({
      where: { id },
    });

    if (!price || price.partnerId !== request.user.id) {
      return reply
        .status(404)
        .json({ success: false, message: "Price not found" });
    }

    reply.status(200).send({
      success: true,
      message: "Price fetched successfully",
      data: price,
    });
  } catch (error: any) {
    reply.status(500).send({ success: false, message: error.message });
  }
};

export const updatePrice = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;
    const { fußanalyse, einlagenversorgung } = request.body;

    const price = await prisma.customer_price.findUnique({ where: { id } });

    if (!price || price.partnerId !== request.user.id) {
      return reply
        .status(404)
        .json({ success: false, message: "Price not found" });
    }

    const updatedPrice = await prisma.customer_price.update({
      where: { id },
      data: {
        fußanalyse: fußanalyse || price.fußanalyse,
        einlagenversorgung: einlagenversorgung || price.einlagenversorgung,
      },
    });

    reply.status(200).send({
      success: true,
      message: "Price updated successfully",
      data: updatedPrice,
    });
  } catch (error: any) {
    reply.status(500).send({ success: false, message: error.message });
  }
};

export const deletePrice = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const price = await prisma.customer_price.findUnique({ where: { id } });

    if (!price || price.partnerId !== request.user.id) {
      return reply
        .status(404)
        .json({ success: false, message: "Price not found" });
    }

    await prisma.customer_price.delete({ where: { id } });

    reply.status(200).send({
      success: true,
      message: "Price deleted successfully",
    });
  } catch (error: any) {
    reply.status(500).send({ success: false, message: error.message });
  }
};
