import { FastifyInstance } from "fastify";
 
import {
  createOrder,
  getAllOrders,
  getOrderById,
  deleteMultipleOrders,
  deleteOrder,
  getOrdersByCustomerId,
  getEinlagenInProduktion
} from "./customerOrders.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const customerOrdersRoutes = (fastify: FastifyInstance) => {
  // Get "Einlagen in Produktion" orders
  fastify.get(
    "/einlagen-in-produktion",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getEinlagenInProduktion
  );

  // Create new order
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    createOrder
  );

  // Get all orders
  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getAllOrders
  );

  // Get order by ID
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getOrderById
  );

  // Get orders by customer ID
  fastify.get(
    "/customer/:customerId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getOrdersByCustomerId
  );

  // Delete multiple orders
  fastify.delete(
    "/multiple/delete",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    deleteMultipleOrders
  );

  // Delete single order
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    deleteOrder
  );
};

export default customerOrdersRoutes;