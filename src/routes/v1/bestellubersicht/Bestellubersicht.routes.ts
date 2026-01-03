import { FastifyInstance } from "fastify";

import {
  createBestellubersicht,
  getBestellubersicht,
} from "./Bestellubersicht.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const bestellubersichtRoutes = (fastify: FastifyInstance) => {

  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    createBestellubersicht
  );


  fastify.get(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    getBestellubersicht
  );
};

export default bestellubersichtRoutes;