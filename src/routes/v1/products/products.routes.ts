import { FastifyInstance } from "fastify";
import { 
  createProduct, 
  updateProduct, 
  getAllProducts, 
  deleteImage, 
  queryProducts, 
  deleteProduct, 
  getSingleProduct, 
  characteristicsIcons, 
  getCategorizedProducts 
} from "./products.controllers";
// import upload from "../../../config/multer.config";
// import { verifyUser } from "../../../middleware/verifyUsers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";

const productsRoutes = (fastify: FastifyInstance) => {
 
  fastify.post(
    "/",
    {
      preHandler: [
        upload.array("images", 10000),
        verifyUser("ADMIN")
      ],
    },
    createProduct
  );
 
  fastify.put(
    "/:id",
    {
      preHandler: [
        verifyUser("ADMIN"),
        upload.array("images", 10000)
      ]
    },
    updateProduct
  );
 
  fastify.get("/", getAllProducts);
 
  fastify.get("/categories", getCategorizedProducts);
 
  fastify.get("/technical-icons", characteristicsIcons);

 
  fastify.delete(
    "/:id/:imageName",
    {
      preHandler: verifyUser("ADMIN")
    },
    deleteImage
  );

 
  fastify.get("/query", queryProducts);
 
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("ADMIN")
    },
    deleteProduct
  );
 
  fastify.get("/:id", getSingleProduct);
};

export default productsRoutes;