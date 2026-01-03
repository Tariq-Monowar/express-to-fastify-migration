import { FastifyInstance } from "fastify";
 
import { createSoftwareVersion, deleteSoftwareVersion, getAllSoftwareVersions, getSoftwareVersionById, updateSoftwareVersion } from "./software_version.cintrollers";
import { verifyUser } from "../../../middleware/auth.middleware";

const softwareVersionRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("ADMIN")
    },
    createSoftwareVersion
  );

  fastify.get(
    "/get-all",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getAllSoftwareVersions
  );

  fastify.get(
    "/get-single/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getSoftwareVersionById
  );

  fastify.delete(
    "/delete/:id",
    {
      preHandler: verifyUser("ADMIN")
    },
    deleteSoftwareVersion
  );

  fastify.patch(
    "/update/:id",
    {
      preHandler: verifyUser("ADMIN")
    },
    updateSoftwareVersion
  );
};

export default softwareVersionRoutes;