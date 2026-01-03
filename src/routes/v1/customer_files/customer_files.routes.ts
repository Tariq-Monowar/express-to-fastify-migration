import { FastifyInstance } from "fastify";
 
import {
  createCustomerFile,
  deleteCustomerFile,
  getCustomerFiles,
  updateCustomerFile,
} from "./customer_files.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";
 

const customerFilesRoutes = (fastify: FastifyInstance) => {

  fastify.get("/get", getCustomerFiles);

  fastify.post(
    "/create/:customerId",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([{ name: "image", maxCount: 1 }])
      ]
    },
    createCustomerFile
  );

  fastify.put(
    "/update/:customerId",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([{ name: "image", maxCount: 1 }])
      ]
    },
    updateCustomerFile
  );

  fastify.delete(
    "/delete",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteCustomerFile
  );
};

export default customerFilesRoutes;