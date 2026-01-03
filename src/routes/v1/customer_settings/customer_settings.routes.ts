import { FastifyInstance } from "fastify";
 
import {
  getCustomerSettings,
  setCustomerSettings,
  deleteCustomerSettings,
  setStoreLocations,
  getStoreLocations,
  updateStoreLocations,
  deleteStoreLocations,
} from "./customer_settings.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const customerSettingsRoutes = (fastify: FastifyInstance) => {
  // Customer Settings Routes
  fastify.get(
    "/settings",
    {
      preHandler: verifyUser("PARTNER")
    },
    getCustomerSettings
  );

  fastify.post(
    "/settings",
    {
      preHandler: verifyUser("PARTNER")
    },
    setCustomerSettings
  );

  fastify.delete(
    "/settings",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteCustomerSettings
  );

  // Store Locations Routes
  fastify.post(
    "/store-locations",
    {
      preHandler: verifyUser("PARTNER")
    },
    setStoreLocations
  );

  fastify.get(
    "/store-locations",
    {
      preHandler: verifyUser("PARTNER")
    },
    getStoreLocations
  );

  fastify.patch(
    "/store-locations/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    updateStoreLocations
  );

  fastify.delete(
    "/store-locations/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteStoreLocations
  );
};

export default customerSettingsRoutes;