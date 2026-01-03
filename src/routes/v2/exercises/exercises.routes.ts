import { FastifyInstance } from "fastify";
import { getAllexercises, sendExercisesEmail } from "./exercises.controllers";
import { upload } from "../../../config/storage.config";
 
 

const exercisesRoutes = (fastify: FastifyInstance) => {
  fastify.get("/", getAllexercises);
  
  fastify.post(
    "/", 
    {
      preHandler: upload.single('pdf')
    },
    sendExercisesEmail
  );
};

export default exercisesRoutes;