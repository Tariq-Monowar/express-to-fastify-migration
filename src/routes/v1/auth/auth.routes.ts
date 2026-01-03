import { FastifyInstance } from "fastify";

import {
  loginUser,
  checkAuthStatus,
  createUser,
  updateUser,
  changePassword,
  createPartnership,
  updatePartnerProfile,
  getAllPartners,
} from "./auth.controllers";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";

const usersRoutes = (fastify: FastifyInstance) => {
  fastify.post("/login", loginUser);
  
  fastify.get("/check-auth", checkAuthStatus);

  
  fastify.post(
    "/register",
    {
      preHandler: upload.single("image"),
    },
    createUser
  );

  fastify.put(
    "/",
    {
      preHandler: [upload.single("image"), verifyUser("ANY")],
    },
    updateUser
  );

  fastify.patch(
    "/change-password",
    {
      preHandler: verifyUser("ANY"),
    },
    changePassword
  );

  fastify.post(
    "/create-partnership",
    {
      preHandler: verifyUser("ADMIN"),
    },
    createPartnership
  );

  fastify.patch(
    "/update-partner-profile",
    {
      preHandler: [verifyUser("ADMIN", "PARTNER"), upload.single("image")],
    },
    updatePartnerProfile
  );

  fastify.get(
    "/partners",
    {
      preHandler: verifyUser("ADMIN"),
    },
    getAllPartners
  );
};

export default usersRoutes;
