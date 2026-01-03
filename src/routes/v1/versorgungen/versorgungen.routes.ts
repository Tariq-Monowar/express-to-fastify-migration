import { FastifyInstance } from "fastify";
import {
  createVersorgungen,
  deleteVersorgungen,
  getAllVersorgungen,
  getVersorgungenByDiagnosis,
  getSingleVersorgungen,
  patchVersorgungen,
  getSupplyStatus,
  getSingleSupplyStatus,
  createSupplyStatus,
  updateSupplyStatus,
  deleteSupplyStatus
} from "./versorgungen.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";

const versorgungenRoutes = (fastify: FastifyInstance) => {
  // ==================== Versorgungen Routes ====================
  fastify.get(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    getAllVersorgungen
  );

  fastify.get(
    "/diagnosis/:diagnosis_status",
    {
      preHandler: verifyUser("PARTNER")
    },
    getVersorgungenByDiagnosis
  );

  fastify.get(
    "/single/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    getSingleVersorgungen
  );

  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    createVersorgungen
  );

  fastify.patch(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    patchVersorgungen
  );

  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteVersorgungen
  );

  // ==================== Supply Status Routes ====================
  fastify.get(
    "/supply-status",
    {
      preHandler: verifyUser("PARTNER")
    },
    getSupplyStatus
  );

  fastify.get(
    "/supply-status/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    getSingleSupplyStatus
  );

  fastify.post(
    "/supply-status",
    {
      preHandler: [
        verifyUser("PARTNER"),
        upload.single("image")
      ]
    },
    createSupplyStatus
  );

  fastify.patch(
    "/supply-status/:id",
    {
      preHandler: [
        verifyUser("PARTNER"),
        upload.single("image")
      ]
    },
    updateSupplyStatus
  );

  fastify.delete(
    "/supply-status/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteSupplyStatus
  );
};

export default versorgungenRoutes;