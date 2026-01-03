import { FastifyInstance } from "fastify";
 
import {
  setNewPrice,
  getAllPrices,
  getPriceById,
  updatePrice,
  deletePrice,
} from "./customerPrice.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const customerPriceRoutes = (fastify: FastifyInstance) => {
  // Create new price
  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    setNewPrice
  );

  // Get all prices
  fastify.get(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    getAllPrices
  );

  // Get price by ID
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    getPriceById
  );

  // Update price
  fastify.patch(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    updatePrice
  );

  // Delete price
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deletePrice
  );
};

export default customerPriceRoutes;