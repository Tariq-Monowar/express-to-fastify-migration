import { FastifyInstance } from "fastify";
 
import {
  insolesAndShoesRevenue,
  seallingLocationRevenue,
  revenueChartData,
  revenueCompareMonthWithYear,
  revenueCompareMonthWithYearInsoles,
  revenueCompareMonthWithYearShoes,
  revenueOfFinishedInsoles,
  revenueOfFinishedShoes,
  quantityOfInproductionShoes,
  quantityOfInproductionInsoles,
  insoleQuantityPerStatus,
  shoeQuantityPerStatus,
  insurancePaymentComparison
} from "./dashboard_overview.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const dashboardRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/insoles-and-shoes-revenue",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    insolesAndShoesRevenue
  );

  fastify.get(
    "/sealling-location-revenue",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    seallingLocationRevenue
  );

  fastify.get(
    "/revenue-chart-data",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueChartData
  );

  fastify.get(
    "/revenue-compare-month-with-year",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueCompareMonthWithYear
  );

  fastify.get(
    "/revenue-compare-month-with-year-insoles",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueCompareMonthWithYearInsoles
  );

  fastify.get(
    "/quantity-of-finished-insoles",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueOfFinishedInsoles
  );

  fastify.get(
    "/revenue-of-finished-shoes",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueOfFinishedShoes
  );

  fastify.get(
    "/revenue-compare-month-with-year-shoes",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    revenueCompareMonthWithYearShoes
  );

  fastify.get(
    "/quantity-of-inproduction-shoes",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    quantityOfInproductionShoes
  );

  fastify.get(
    "/quantity-of-inproduction-insoles",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    quantityOfInproductionInsoles
  );

  fastify.get(
    "/insole-quantity-par-status",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    insoleQuantityPerStatus
  );

  fastify.get(
    "/shoe-quantity-per-status",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    shoeQuantityPerStatus
  );

  fastify.get(
    "/insurance-payment-comparison",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    insurancePaymentComparison
  );
};

export default dashboardRoutes;