import { notificationSend } from "../../../utils/notification.utils";
 
export const createNotification = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;
    const { type, message, eventId, route } = request.body;

    notificationSend(partnerId, type, message, eventId, false, route);

    reply.status(201).json({
      success: true,
      message: "Notification created successfully",
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    reply.status(500).send({
      success: false,
      error: error.message,
      message: "Failed to create notification",
    });
  }
};
export const getAllNotificaions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const partnerId = request.user.id;

    const page = Math.max(Number(request.query.page) || 1, 1);
    const limit = Math.min(Number(request.query.limit) || 10);
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    reply.status(200).send({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        hasNextPage: notifications.length === limit,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

export const getCountUnreadNotifications = async (request, reply) => {
  try {
    const partnerId = request.user.id;
    const prisma = request.server.prisma;

    const unreadCount = await prisma.notification.count({
      where: { partnerId, isRead: false },
    });

    reply.status(200).send({
      success: true,
      data: unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch unread notifications count",
      error: error.message,
    });
  }
};

export const markeAsReadNotifications = async (request, reply) => {
  try {
    const partnerId = request.user.id;
    const prisma = request.server.prisma;
    await prisma.notification.updateMany({
      where: { partnerId, isRead: false },
      data: { isRead: true },
    });
    reply.status(200).send({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};


export const deleteNotifications = async (request, reply) => {
  try {
    const partnerId = request.user.id;
    const { notificationIds } = request.body;
    const prisma = request.server.prisma;

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "notificationIds must be a non-empty array",
      });
    }

    // Find notifications that exist and belong to this partner
    const notificationsToDelete = await prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        partnerId, // Only delete notifications belonging to this partner
      },
      select: { id: true },
    });

    const foundIds = notificationsToDelete.map((notif) => notif.id);
    const notFoundIds = notificationIds.filter((id) => !foundIds.includes(id));

    // Delete only the notifications that exist and belong to the partner
    if (foundIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: foundIds } },
      });
    }

    // Return success with details about what was deleted
    reply.status(200).send({
      success: true,
      message: `Successfully deleted ${foundIds.length} notification(s)`,
      data: {
        deletedCount: foundIds.length,
        deletedIds: foundIds,
        notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      },
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to delete notifications",
      error: error.message,
    });
  }
};
