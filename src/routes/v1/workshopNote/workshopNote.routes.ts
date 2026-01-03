import { FastifyInstance } from "fastify";
import { getWorkshopNote, manageWorkshopNote } from "./workshopNote.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const workshopNoteRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/set",
    {
      preHandler: verifyUser("PARTNER")
    },
    manageWorkshopNote
  );

  fastify.get(
    "/get",
    {
      preHandler: verifyUser("PARTNER")
    },
    getWorkshopNote
  );
};

export default workshopNoteRoutes;