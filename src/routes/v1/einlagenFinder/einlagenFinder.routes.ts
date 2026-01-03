import { FastifyInstance } from "fastify";
 
import {
  setEinlagenFinder,
  getEinlagenFinderAnswers,
  getEinlagenFinderQuestions,
  getAnswersByUserId
} from "./einlagenFinder.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const einlagenFinderRoutes = (fastify: FastifyInstance) => {
  // Submit Einlagen Finder answers
  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    setEinlagenFinder
  );

  // Get Einlagen Finder questions
  fastify.get(
    "/questions",
    {
      preHandler: verifyUser("PARTNER")
    },
    getEinlagenFinderQuestions
  );

  // Get answers by customer ID
  fastify.get(
    "/:customerId",
    {
      preHandler: verifyUser("PARTNER")
    },
    getEinlagenFinderAnswers
  );

  // Get answers by user ID
  fastify.get(
    "/answer/:userId",
    {
      preHandler: verifyUser("PARTNER")
    },
    getAnswersByUserId
  );
};

export default einlagenFinderRoutes;