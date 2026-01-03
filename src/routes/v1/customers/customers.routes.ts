import { FastifyInstance } from "fastify";
 
import {
  createCustomers,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  updateCustomer,
  updateCustomerSpecialFields,
  addScreenerFile,
  updateScreenerFile,
  deleteScreenerFile,
  getScreenerFileById,
  getEinlagenInProduktion,
  filterCustomer,
  createCustomerRequirements,
  getCustomerRequirements
} from "./customers.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";
import { upload } from "../../../config/storage.config";
 

const customersRoutes = (fastify: FastifyInstance) => {
  // Customer Requirements
  fastify.post(
    "/customer-requirements",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    createCustomerRequirements
  );

  fastify.get(
    "/customer-requirements",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getCustomerRequirements
  );

  // Create customer with multiple file uploads
  fastify.post(
    "/",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([
          { name: "picture_10", maxCount: 1 },
          { name: "picture_23", maxCount: 1 },
          { name: "paint_10", maxCount: 1 },
          { name: "paint_23", maxCount: 1 },
          { name: "threed_model_left", maxCount: 1 },
          { name: "picture_17", maxCount: 1 },
          { name: "picture_11", maxCount: 1 },
          { name: "picture_24", maxCount: 1 },
          { name: "threed_model_right", maxCount: 1 },
          { name: "picture_16", maxCount: 1 },
          { name: "csvFile", maxCount: 1 },
        ])
      ]
    },
    createCustomers
  );

  // Get customers with "Einlagen in Produktion"
  fastify.get(
    "/einlagen-in-produktion",
    getEinlagenInProduktion
  );

  // Get all customers
  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    getAllCustomers
  );

  // Search customers
  fastify.get(
    "/search",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    searchCustomers
  );

  // Filter customers
  fastify.get(
    "/filter-customers",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    filterCustomer
  );

  // Delete customer
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    deleteCustomer
  );

  // Update customer
  fastify.patch(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    updateCustomer
  );

  // Update customer special fields
  fastify.patch(
    "/:id/special-fields",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    updateCustomerSpecialFields
  );

  // Screener File Management
  fastify.post(
    "/screener-file/:customerId",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([
          { name: "picture_10", maxCount: 1 },
          { name: "picture_23", maxCount: 1 },
          { name: "threed_model_left", maxCount: 1 },
          { name: "picture_17", maxCount: 1 },
          { name: "picture_11", maxCount: 1 },
          { name: "picture_24", maxCount: 1 },
          { name: "threed_model_right", maxCount: 1 },
          { name: "picture_16", maxCount: 1 },
          { name: "csvFile", maxCount: 1 },
        ])
      ]
    },
    addScreenerFile
  );

  fastify.patch(
    "/update-screener-file/:customerId/:screenerId",
    {
      preHandler: [
        verifyUser("PARTNER", "ADMIN"),
        upload.fields([
          { name: "picture_10", maxCount: 1 },
          { name: "picture_23", maxCount: 1 },
          { name: "paint_24", maxCount: 1 },
          { name: "paint_23", maxCount: 1 },
          { name: "threed_model_left", maxCount: 1 },
          { name: "picture_17", maxCount: 1 },
          { name: "picture_11", maxCount: 1 },
          { name: "picture_24", maxCount: 1 },
          { name: "threed_model_right", maxCount: 1 },
          { name: "picture_16", maxCount: 1 },
          { name: "csvFile", maxCount: 1 },
        ])
      ]
    },
    updateScreenerFile
  );

  fastify.delete(
    "/delete-screener-file/:screenerId",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteScreenerFile
  );

  fastify.get(
    "/screener-file/:screenerId",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getScreenerFileById
  );

  // Get customer by ID
  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getCustomerById
  );
};

export default customersRoutes;