import { FastifyInstance } from "fastify";
import {
  createStorage,
  deleteStorage,
  getAllMyStorage,
  getSingleStorage,
  updateStorage,
  getStorageChartData,
  getStorageHistory,
  getStoragePerformer,
  getStoreOverviews,
  updateOverviewStatus,
  getStoreOverviewById
} from "./storage.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
 

const storageRoutes = (fastify: FastifyInstance) => {
  // Create storage
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    createStorage
  );

  // Get all my storage
  fastify.get(
    "/my/get",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getAllMyStorage
  );

  // Get single storage by ID
  fastify.get(
    "/get/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getSingleStorage
  );

  // Update storage
  fastify.patch(
    "/update/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    updateStorage
  );

  // Delete storage
  fastify.delete(
    "/delete/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteStorage
  );

  // Get storage chart data
  fastify.get(
    "/chart-data",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getStorageChartData
  );

  // Get storage history
  fastify.get(
    "/history/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getStorageHistory
  );

  // Get storage performer
  fastify.get(
    "/performer",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getStoragePerformer
  );

  // Store overview routes
  fastify.get(
    "/store-overview",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getStoreOverviews
  );

  fastify.patch(
    "/update-overview-statu",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    updateOverviewStatus
  );

  fastify.get(
    "/get-store-overview-by-id/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getStoreOverviewById
  );
};

export default storageRoutes;