import { FastifyInstance } from "fastify";
import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  createMaßschaftKollektion,
  createTustomShafts,
  deleteMaßschaftKollektion,
  getAllMaßschaftKollektion,
  getMaßschaftKollektionById,
  updateMaßschaftKollektion,
  getTustomShafts,
  getSingleCustomShaft,
  updateCustomShaftStatus,
  deleteCustomShaft,
  totalPriceResponse
} from "./custom_shafts.controllers";

const customShaftsRoutes = (fastify: FastifyInstance) => {
  
  fastify.post(
    "/create",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([
          { name: "image3d_1", maxCount: 1 },
          { name: "image3d_2", maxCount: 1 },
        ])
      ]
    },
    createTustomShafts
  );

  fastify.get(
    "/get",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getTustomShafts
  );

  fastify.get(
    "/get/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getSingleCustomShaft
  );

  fastify.patch(
    "/update-status/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    updateCustomShaftStatus
  );

  fastify.delete(
    "/delete/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteCustomShaft
  );

  fastify.get(
    "/total-price-resio",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    totalPriceResponse
  );

  fastify.post(
    "/create/mabschaft_kollektion",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([{ name: "image", maxCount: 1 }])
      ]
    },
    createMaßschaftKollektion
  );

  fastify.get(
    "/mabschaft_kollektion",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getAllMaßschaftKollektion
  );

  fastify.patch(
    "/mabschaft_kollektion/:id",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([{ name: "image", maxCount: 1 }])
      ]
    },
    updateMaßschaftKollektion
  );

  fastify.get(
    "/mabschaft_kollektion/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getMaßschaftKollektionById
  );

  fastify.delete(
    "/mabschaft_kollektion/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteMaßschaftKollektion
  );
};

export default customShaftsRoutes;