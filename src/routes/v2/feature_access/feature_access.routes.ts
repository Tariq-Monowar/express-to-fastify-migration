import { FastifyInstance } from "fastify";
 
import { 
  getFeatureAccess, 
  manageFeatureAccess,
  partnerFeatureAccess
} from "./feature_access.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const featureAccessRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/get/:partnerId",
    {
      preHandler: verifyUser("ADMIN")
    },
    getFeatureAccess
  );

  fastify.post(
    "/manage/:partnerId",
    {
      preHandler: verifyUser("ADMIN")
    },
    manageFeatureAccess
  );

  fastify.get(
    "/partner-feature",
    {
      preHandler: verifyUser("PARTNER")
    },
    partnerFeatureAccess
  );
};

export default featureAccessRoutes;