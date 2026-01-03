import validator from "validator";
// import { sendEmail } from "../../../utils/emailService.utils";
import { PrismaClient, Prisma } from "@prisma/client";

import { sendEmail } from "../../../utils/email.config";
import { getPaginationOptions, getPaginationResult } from "../../../utils/pagination";
import { getImageUrl } from "../../../utils/baseurl";

const prisma = new PrismaClient();

export const createMessage = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { email: recipientEmail, subject, content } = request.body;
    const { id: senderId } = request.user;

    // Validate required fields
    const missingField = ["email", "subject", "content"].find(
      (field) => !request.body[field]
    );
    if (missingField) {
      reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
      return;
    }

    if (!validator.isEmail(recipientEmail)) {
      reply.status(400).send({
        success: false,
        message: "Invalid email format!",
      });
      return;
    }

    const recipientUser = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true },
    });

    const newMessage = await prisma.message.create({
      data: {
        subject,
        content,
        senderId,
        recipientId: recipientUser?.id || null,
        recipientEmail,
        visibilities: {
          create: [
            {
              userId: senderId,
              isFavorite: false,
              isDeleted: false,
            },
            ...(recipientUser
              ? [
                  {
                    userId: recipientUser.id,
                    isFavorite: false,
                    isDeleted: false,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        // sender: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     image: true,
        //   },
        // },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    //set customer history if it's customer
    if (!recipientUser) {
      const customers = await prisma.customers.findUnique({
        where: { email: recipientEmail },
        select: { id: true, email: true },
      });
      if (customers) {
        await prisma.customerHistorie.create({
          data: {
            customerId: customers.id,
            category: "Emails",
            url: `/message/system-inbox/${newMessage.id}`,
            methord: "GET",
            system_note: "Kunde hat Email gesendet",
          },
          select: { id: true },
        });
      }
    }

    sendEmail(recipientEmail, subject, content);

    const responseData = {
      id: newMessage.id,
      subject: newMessage.subject,
      content: newMessage.content,
      // sender: {
      //   id: newMessage.sender.id,
      //   name: newMessage.sender.name,
      //   email: newMessage.sender.email,
      //   image: newMessage.sender.image
      //     ? getImageUrl(newMessage.sender.image)
      //     : null,
      // },
      recipient: newMessage.recipient
        ? {
            id: newMessage.recipient.id,
            name: newMessage.recipient.name,
            email: newMessage.recipient.email,
            image: newMessage.recipient.image
              ? getImageUrl(`/uploads/${newMessage.recipient.image}`)
              : null,
          }
        : null,
      recipientEmail: newMessage.recipientEmail,
      createdAt: newMessage.createdAt,
      isFavorite: false,
    };

    reply.status(201).json({
      success: true,
      message: "Message created successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Create message error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getSentMessages = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id: userId } = request.user;
    const { page, limit } = getPaginationOptions(request);
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      senderId: userId,
      visibilities: {
        some: {
          userId,
          isDeleted: false,
        },
      },
    };

    let where  = baseWhere;

    if (search) {
      where = {
        ...baseWhere,
        OR: [
          { subject: { contains: search, mode: "insensitive" } },
          { recipientEmail: { contains: search, mode: "insensitive" } },
          {
            recipient: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };
    }

    const total = await prisma.message.count({
      where,
    });

    const sentMessages = await prisma.message.findMany({
      where,
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        visibilities: {
          where: { userId },
          select: {
            isFavorite: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const formattedMessages = sentMessages.map((message) => ({
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.createdAt,
      isFavorite: message.visibilities[0]?.isFavorite || false,
      recipient: message.recipient
        ? {
            id: message.recipient.id,
            name: message.recipient.name,
            email: message.recipient.email,
            image: message.recipient.image
              ? getImageUrl(`/uploads/${message.recipient.image}`)
              : null,
            role: message.recipient.role,
          }
        : null,
      recipientEmail: message.recipientEmail,
    }));

    const result = getPaginationResult(formattedMessages, total, {
      page,
      limit,
    });

    reply.status(200).send({
      success: true,
      message: "Sent messages found successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get sent messages error:", error);
    reply.status(500).send({
      success: false,
      message: error instanceof Error ? error.message : "something went wrong!",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

 
export const getReceivedMessages = async (request, reply) => {
  try {
    const { id: userId, email } = request.user;
    const { page, limit } = getPaginationOptions(request);
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const skip = (page - 1) * limit;

    const baseWhere  = {
      OR: [
        { recipientId: userId },
        {
          recipientEmail: email,
          NOT: { senderId: userId },
        },
      ],
      visibilities: {
        some: {
          userId,
          isDeleted: false,
        },
      },
    };

    let where = baseWhere;

    if (search) {
      where = {
        ...baseWhere,
        OR: [
          ...(baseWhere.OR as any),
          { subject: { contains: search, mode: "insensitive" } },
          {
            sender: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };
    }

    const total = await prisma.message.count({
      where,
    });

    const receivedMessages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        visibilities: {
          where: { userId },
          select: {
            isFavorite: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const formattedMessages = receivedMessages.map((message) => ({
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.createdAt,
      isFavorite: message.visibilities[0]?.isFavorite || false,
      sender: message.sender
        ? {
            id: message.sender.id,
            name: message.sender.name,
            email: message.sender.email,
            image: message.sender.image
              ? getImageUrl(`/uploads/${message.sender.image}`)
              : null,
            role: message.sender.role,
          }
        : null,
      recipientEmail: message.recipientEmail,
    }));

    const result = getPaginationResult(formattedMessages, total, {
      page,
      limit,
    });

    reply.status(200).send({
      success: true,
      message: "Received messages retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get received messages error:", error);
    reply.status(500).send({
      success: false,
      message: "Frontend error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const setToFavorite = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id: userId } = request.user;
    const { id: messageId } = request.params;

    // First verify the message exists and is visible to the user
    const visibility = await prisma.messageVisibility.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!visibility) {
      reply.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to access it",
      });
      return;
    }

    const updatedVisibility = await prisma.messageVisibility.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: {
        isFavorite: !visibility.isFavorite,
      },
    });
 
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        // sender: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     image: true,
        //     role: true,
        //   },
        // },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      reply.status(404).json({
        success: false,
        message: "Message not found",
      });
      return;
    }

    // Format the response
    const responseData = {
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.createdAt,
      isFavorite: updatedVisibility.isFavorite,
      // sender: message.sender ? {
      //   id: message.sender.id,
      //   name: message.sender.name,
      //   email: message.sender.email,
      //   image: message.sender.image ? getImageUrl(message.sender.image) : null,
      //   role: message.sender.role,
      // } : null,
      recipient: message.recipient
        ? {
            id: message.recipient.id,
            name: message.recipient.name,
            email: message.recipient.email,
            image: message.recipient.image
              ? getImageUrl(`/uploads/${message.recipient.image}`)
              : null,
            role: message.recipient.role,
          }
        : null,
      recipientEmail: message.recipientEmail,
    };

    reply.status(200).send({
      success: true,
      message: `Message ${
        updatedVisibility.isFavorite ? "added to" : "removed from"
      } favorites`,
      data: responseData,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    reply.status(500).send({
      success: false,
      message: "Frontend error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFavoriteMessages = async (request, reply) => {
  try {
    const { id: userId } = request.user;
    const { page, limit } = getPaginationOptions(request);
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const skip = (page - 1) * limit;

    // Base where clause for favorites
    const baseWhere = {
      userId,
      isFavorite: true,
      isDeleted: false,
    };

    // Add search conditions if search term is provided
    let where: any = baseWhere;

    if (search) {
      where = {
        ...baseWhere,
        message: {
          OR: [
            {
              sender: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            },
            {
              recipient: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            },
            { subject: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    const total = await prisma.messageVisibility.count({
      where,
    });

    const favoriteMessages = await prisma.messageVisibility.findMany({
      where,
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
            recipient: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { message: { createdAt: "desc" } },
      skip,
      take: limit,
    });

    const formattedMessages = favoriteMessages.map((visibility) => {
      if (!visibility.message) {
        throw new Error("Message not found for visibility record");
      }

      return {
        id: visibility.message.id,
        subject: visibility.message.subject,
        content: visibility.message.content,
        createdAt: visibility.message.createdAt,
        isFavorite: visibility.isFavorite,
        sender: visibility.message.sender
          ? {
              id: visibility.message.sender.id,
              name: visibility.message.sender.name,
              email: visibility.message.sender.email,
              image: visibility.message.sender.image
                ? getImageUrl(`/uploads/${visibility.message.sender.image}`)
                : null,
              role: visibility.message.sender.role,
            }
          : null,
        recipient: visibility.message.recipient
          ? {
              id: visibility.message.recipient.id,
              name: visibility.message.recipient.name,
              email: visibility.message.recipient.email,
              image: visibility.message.recipient.image
                ? getImageUrl(`/uploads/${visibility.message.recipient.image}`)
                : null,
              role: visibility.message.recipient.role,
            }
          : null,
        recipientEmail: visibility.message.recipientEmail,
      };
    });

    const result = getPaginationResult(formattedMessages, total, {
      page,
      limit,
    });

    reply.status(200).send({
      success: true,
      message: "Favorite messages retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get favorite messages error:", error);
    reply.status(500).send({
      success: false,
      message: error instanceof Error ? error.message : "Frontend error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getMessageById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id: userId } = request.user;
    const { id: messageId } = request.params;

    const visibility = await prisma.messageVisibility.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!visibility || visibility.isDeleted) {
      reply.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to access it",
      });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      reply.status(404).json({
        success: false,
        message: "Message not found",
      });
      return;
    }

    const responseData = {
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.createdAt,
      isFavorite: visibility.isFavorite,
      sender: message.sender
        ? {
            id: message.sender.id,
            name: message.sender.name,
            email: message.sender.email,
            image: message.sender.image
              ? getImageUrl(message.sender.image)
              : null,
            role: message.sender.role,
          }
        : null,
      recipient: message.recipient
        ? {
            id: message.recipient.id,
            name: message.recipient.name,
            email: message.recipient.email,
            image: message.recipient.image
              ? getImageUrl(message.recipient.image)
              : null,
            role: message.recipient.role,
          }
        : null,
      recipientEmail: message.recipientEmail,
    };

    reply.status(200).send({
      success: true,
      message: "Message retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Get message by ID error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const permanentDeleteMessages = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id: userId } = request.user;
    const { messageIds } = request.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      reply.status(400).send({
        success: false,
        message: "messageIds must be a non-empty array of message IDs",
      });
      return;
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.messageVisibility.deleteMany({
        where: {
          userId,
          messageId: { in: messageIds },
        },
      });

      const orphanedMessages = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          visibilities: { none: {} },
        },
        select: { id: true },
      });

      const orphanedIds = orphanedMessages.map((m) => m.id);

      if (orphanedIds.length > 0) {
        await prisma.message.deleteMany({
          where: { id: { in: orphanedIds } },
        });
      }
    });

    reply.status(200).send({
      success: true,
      message: "Selected messages permanently deleted",
    });
  } catch (error) {
    console.error("Bulk permanent delete error:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to delete messages",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteSingleMessage = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id: userId } = request.user;
    const { id: messageId } = request.params;
    const visibility = await prisma.messageVisibility.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!visibility) {
      reply.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to access it",
      });
      return;
    }

    await prisma.messageVisibility.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: {
        isDeleted: true,
        isFavorite: false,
      },
    });

    const remainingVisibilities = await prisma.messageVisibility.count({
      where: {
        messageId,
        isDeleted: false,
      },
    });

    reply.status(200).send({
      success: true,
      message: "Message moved to trash",
    });
  } catch (error) {
    console.error("Delete single message error:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to delete message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// in system functionality
export const getSystemInboxMessage = async (request, reply) => {
  try {
    const { messageId } = request.params;
    const prisma = request.server.prisma;

    if (!messageId) {
      return reply.status(400).send({
        success: false,
        message: "Message ID is required",
      });
    }

    // Find the message by ID
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      return reply.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Format the response
    const formattedMessage = {
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            name: message.sender.name,
            email: message.sender.email,
            image: message.sender.image
              ? getImageUrl(`/uploads/${message.sender.image}`)
              : null,
            role: message.sender.role,
          }
        : null,
      recipient: message.recipient
        ? {
            id: message.recipient.id,
            name: message.recipient.name,
            email: message.recipient.email,
            image: message.recipient.image
              ? getImageUrl(`/uploads/${message.recipient.image}`)
              : null,
            role: message.recipient.role,
          }
        : null,
      recipientEmail: message.recipientEmail,
    };

    reply.status(200).send({
      success: true,
      message: "System inbox message retrieved successfully",
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Get system inbox message error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
