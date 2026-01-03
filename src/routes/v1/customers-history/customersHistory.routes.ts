import { FastifyInstance } from "fastify";
import {
  createCustomerHistoryNote,
  getAllCustomerHistory,
  getCustomerHistoryById,
  updateCustomerHistory,
  deleteCustomerHistory
} from "./customersHistory.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
 

const customersHistoryRoutes = (fastify: FastifyInstance) => {
  // Create history note for a customer
  fastify.post(
    "/notizen/:customerId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    createCustomerHistoryNote
  );

  // Get all customer history
  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getAllCustomerHistory
  );

  // Get customer history by ID
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getCustomerHistoryById
  );

  // Update customer history
  fastify.patch(
    "/:historyId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateCustomerHistory
  );

  // Delete customer history
  fastify.delete(
    "/:historyId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    deleteCustomerHistory
  );
};

export default customersHistoryRoutes;