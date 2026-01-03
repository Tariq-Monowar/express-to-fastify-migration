import { FastifyInstance } from "fastify";

import {
  getLast40DaysOrderStats,
  getLast30DaysOrderEinlagen,
  getOrdersHistory,
  getSupplyInfo,
  getPicture2324ByOrderId,
  getBarcodeLabel,
  getNewOrderHistory
} from "./track_orders.controllers";
import { verifyUser } from "../../../../middleware/auth.middleware";

const trackOrdersRoutes = (fastify: FastifyInstance) => {
  // Get last 40 days order statistics
  fastify.get(
    "/stats/retio",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getLast40DaysOrderStats
  );

  // Get last 30 days order einlagen
  fastify.get(
    "/lest30days/einlagen",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getLast30DaysOrderEinlagen
  );

  /*
    এটা আমাদের পুরাতন orders history ছিলো। রিকয়ারম্যান্ট পরিবর্তনে এখন আর ব্যবহার হয় না।
    This was our old orders history. Due to requirement changes, it's no longer used.
  */
  fastify.get(
    "/history/orders/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getOrdersHistory
  );

  /*
    orders history রাউট এর বদলে এখন এটা ব্যাবহার হয়।
    This is now used instead of the orders history route.
  */
  fastify.get(
    "/order-history/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getNewOrderHistory
  );

  // Get supply information for an order
  fastify.get(
    "/supply-info/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getSupplyInfo
  );

  // Get picture 23-24 by order ID
  fastify.get(
    "/picture-23-24/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getPicture2324ByOrderId
  );

  // Get barcode label for an order
  fastify.get(
    "/barcode-label/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getBarcodeLabel
  );
};

export default trackOrdersRoutes;