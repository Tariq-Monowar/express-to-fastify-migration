import { FastifyInstance } from "fastify";
import {
  getQuestionsFlow,
  getInsolesQuestions,
  setInsolesAnswers,
  getShoesQuestions,
  setShoesAnswers,
  getControllQuestions,
  getQuestions,
} from "./question.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
 

const questionRoutes = (fastify: FastifyInstance) => {
  // ==================== Insoles Questionnaire ====================
  fastify.get("/insoles/:customerId", getInsolesQuestions);
  fastify.post("/insoles/:customerId", setInsolesAnswers);
  fastify.put("/insoles/:customerId", setInsolesAnswers);

  // ==================== Shoes Questionnaire ====================
  fastify.get("/shoes/:customerId", getShoesQuestions);
  fastify.post("/shoes/:customerId", setShoesAnswers);

  // ==================== Partner Control ====================
  fastify.get(
    "/get-questions",
    {
      preHandler: verifyUser("PARTNER")
    },
    getQuestions
  );

  // ==================== Admin Questionnaire Flow ====================
  fastify.get("/admin", getQuestionsFlow);
  fastify.get("/admin/:categoryTitle", getQuestionsFlow);
  fastify.get("/admin/:categoryTitle/:subCategoryTitle", getQuestionsFlow);

  // ==================== Control Questions ====================
  fastify.post(
    "/controll-questions",
    {
      preHandler: verifyUser("PARTNER")
    },
    getControllQuestions
  );
};

export default questionRoutes;