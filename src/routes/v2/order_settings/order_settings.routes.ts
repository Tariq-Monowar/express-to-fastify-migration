import { FastifyInstance } from "fastify";
 
import { getOrderSettings, manageOrderSettings } from "./order_settings.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const orderSettingsRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/manage",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getOrderSettings
  );

  fastify.put(
    "/manage",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    manageOrderSettings
  );

  fastify.patch(
    "/manage",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    manageOrderSettings
  );
};

export default orderSettingsRoutes;