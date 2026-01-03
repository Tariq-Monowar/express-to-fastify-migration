import { FastifyInstance } from "fastify";
import { getAllexercises, sendExercisesEmail } from "./exercises.controllers";
import { upload } from "../../../config/storage.config";
 

const exercisesRoutes = (fastify: FastifyInstance) => {
  // Get all exercises (public route)
  fastify.get("/", getAllexercises);

  // Send exercises email with PDF upload
  fastify.post(
    "/",
    {
      preHandler: upload.single('pdf')
    },
    sendExercisesEmail
  );
};

export default exercisesRoutes;