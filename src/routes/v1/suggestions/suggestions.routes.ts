import { FastifyInstance } from "fastify";
import {
  createSuggestions,
  getAllSuggestions,
  deleteSuggestion,
  deleteAllSuggestions,
  createImprovement,
  getAllImprovements,
  deleteImprovement,
  deleteAllImprovements,
} from "./suggestions.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";
 

const suggestionsRoutes = (fastify: FastifyInstance) => {
  // ==================== FeetF1rst Suggestions ====================
  fastify.post(
    "/feetf1rst",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    createSuggestions
  );

  fastify.get(
    "/feetf1rst",
    {
      preHandler: verifyUser("PARTNER")
    },
    getAllSuggestions
  );

  fastify.delete(
    "/feetf1rst/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteSuggestion
  );

  fastify.delete(
    "/feetf1rst",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteAllSuggestions
  );

  // ==================== Improvements ====================
  fastify.post(
    "/improvement",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.array("images", 100)
      ]
    },
    createImprovement
  );

  fastify.get("/improvement", getAllImprovements);

  fastify.delete("/improvement", deleteImprovement);

  fastify.delete(
    "/improvement/all",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteAllImprovements
  );
};

export default suggestionsRoutes;