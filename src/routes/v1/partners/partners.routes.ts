import { FastifyInstance } from "fastify";
import {
  createPartnership,
  updatePartnerProfile,
  getAllPartners,
  getPartnerById,
  updatePartnerByAdmin,
  deletePartner,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
  changePassword,
  managePartnerSettings,
  getPartnerSettings
} from "./partners.controllers";

import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";

const partnersRoutes = (fastify: FastifyInstance) => {
  // Partner Settings Management
  fastify.post(
    "/manage-partner-settings",
    {
      preHandler: verifyUser("PARTNER")
    },
    managePartnerSettings
  );

  fastify.get(
    "/get-partner-settings",
    {
      preHandler: verifyUser("PARTNER")
    },
    getPartnerSettings
  );

  // Create partnership (Admin only)
  fastify.post(
    "/create",
    {
      preHandler: [
        verifyUser("ADMIN"),
        upload.single("image")
      ]
    },
    createPartnership
  );

  // Update partner profile (Admin or Partner)
  fastify.patch(
    "/update-partner-profile",
    {
      preHandler: [
        verifyUser("ADMIN", "PARTNER"),
        upload.single("image")
      ]
    },
    updatePartnerProfile
  );

  // Get all partners (Admin only)
  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN")
    },
    getAllPartners
  );

  // Get partner by ID (Admin only)
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("ADMIN")
    },
    getPartnerById
  );

  // Update partner by Admin
  fastify.put(
    "/update/:id",
    {
      preHandler: [
        verifyUser("ADMIN"),
        upload.single("image")
      ]
    },
    updatePartnerByAdmin
  );

  // Delete partner (Admin only)
  fastify.delete(
    "/delete/:id",
    {
      preHandler: verifyUser("ADMIN")
    },
    deletePartner
  );

  // Forgot Password Routes (Public)
  fastify.post("/forgot-password/send-otp", forgotPasswordSendOtp);
  fastify.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
  fastify.post("/forgot-password/reset", resetPassword);

  // Change Password (Authenticated)
  fastify.post(
    "/change-password",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    changePassword
  );
};

export default partnersRoutes;