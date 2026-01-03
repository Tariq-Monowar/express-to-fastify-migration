import { FastifyRequest, FastifyReply } from "fastify";

export const createBestellubersicht = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { number } = request.body;

    const bestellubersicht = await prisma.bestellubersicht.upsert({
      where: { userId: id },
      update: {
        number,
        updatedAt: new Date(),
      },
      create: {
        number,
        user: { connect: { id } },
      },
    });

    reply.status(200).send({
      success: true,
      message: "Bestellübersicht updated successfully.",
      data: bestellubersicht,
    });
  } catch (err: any) {
    console.error("Error creating/updating Bestellübersicht:", err);
    reply.status(500).send({
      success: false,
      message: "Something went wrong!",
      error: err.message,
    });
  }
};

export const getBestellubersicht = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;

    const bestellubersicht = await prisma.bestellubersicht.findUnique({
      where: { userId: id },
    });

    if (!bestellubersicht) {
      reply.status(404).json({
        success: false,
        message: "No Bestellübersicht found for this user.",
      });
      return;
    }

    reply.status(200).send({
      success: true,
      data: bestellubersicht,
    });
  } catch (err: any) {
    console.error("Error fetching Bestellübersicht:", err);
    reply.status(500).send({
      success: false,
      message: "Something went wrong!",
      error: err.message,
    });
  }
};
