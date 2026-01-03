import { FastifyInstance } from "fastify";
 
import {
  createMassschuheOrder,
  getMassschuheOrder,
  getMassschuheOrderByCustomerId,
  updateMassschuheOrder,
  deleteMassschuheOrder,
  getMassschuheOrderById,
  updateMassschuheOrderStatus,
  getMassschuheOrderStats,
  getMassschuheRevenueChart,
  getMassschuheFooterAnalysis,
  getMassschuheProductionTimeline,
  getMassschuheProductionSummary,
  uploadMassschuheOrderPdf,
  getMassschuheProfitCount,
} from "./massschuhe_order.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";
 

const massschuheOrderRoutes = (fastify: FastifyInstance) => {
  // Get orders by customer ID
  fastify.get(
    "/get-by-customer/:customerId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheOrderByCustomerId
  );

  // Create new order
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    createMassschuheOrder
  );

  // Get all orders
  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheOrder
  );

  // Get order by ID
  fastify.get(
    "/get/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheOrderById
  );

  // Update order status
  fastify.patch(
    "/update-status",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateMassschuheOrderStatus
  );

  // Upload PDF files for order
  fastify.post(
    "/upload-pdf/:orderId",
    {
      preHandler: [
        verifyUser("ADMIN", "PARTNER"),
        upload.fields([
          { name: "bodenerstellungpdf", maxCount: 1 },
          { name: "geliefertpdf", maxCount: 1 },
        ])
      ]
    },
    uploadMassschuheOrderPdf
  );

  // Update order
  fastify.patch(
    "/update-order/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateMassschuheOrder
  );

  // Statistics routes
  fastify.get(
    "/stats",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheOrderStats
  );

  fastify.get(
    "/stats/revenue",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheRevenueChart
  );

  fastify.get(
    "/stats/footer-analysis",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheFooterAnalysis
  );

  fastify.get(
    "/stats/production-timeline",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheProductionTimeline
  );

  fastify.get(
    "/stats/production-summary",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheProductionSummary
  );

  // Get profit count
  fastify.get(
    "/profit-count",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getMassschuheProfitCount
  );

  // Delete order
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    deleteMassschuheOrder
  );
};

export default massschuheOrderRoutes;