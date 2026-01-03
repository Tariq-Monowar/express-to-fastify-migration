import { FastifyInstance } from "fastify";
 
import {
  createNotification,
  getAllNotificaions,
  getCountUnreadNotifications,
  markeAsReadNotifications,
  deleteNotifications
} from "./notifications.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const notificationsRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    createNotification
  );

  fastify.get(
    "/get-all",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getAllNotificaions
  );

  fastify.get(
    "/unread-count",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getCountUnreadNotifications
  );

  fastify.patch(
    "/mark-as-read",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    markeAsReadNotifications
  );

  fastify.delete(
    "/delete",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteNotifications
  );
};

export default notificationsRoutes;