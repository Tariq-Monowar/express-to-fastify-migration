import { FastifyInstance } from "fastify";
import {
  createMessage,
  getSentMessages,
  getReceivedMessages,
  setToFavorite,
  getFavoriteMessages,
  getMessageById,
  permanentDeleteMessages,
  deleteSingleMessage,
  getSystemInboxMessage
} from "./messages.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
 

const messagesRoutes = (fastify: FastifyInstance) => {
  // Create new message
  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    createMessage
  );

  // Get sent messages
  fastify.get(
    "/sendbox",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getSentMessages
  );

  // Get received messages
  fastify.get(
    "/inbox",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getReceivedMessages
  );

  // Mark message as favorite
  fastify.put(
    "/:id/favorite",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    setToFavorite
  );

  // Get favorite messages
  fastify.get(
    "/favorites",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getFavoriteMessages
  );

  // System inbox message (public route)
  fastify.get(
    "/system-inbox/:messageId",
    getSystemInboxMessage
  );

  // Get message by ID
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getMessageById
  );

  // Permanently delete multiple messages
  fastify.delete(
    "/permanent",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    permanentDeleteMessages
  );

  // Delete single message
  fastify.delete(
    "/delete/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteSingleMessage
  );
};

export default messagesRoutes;