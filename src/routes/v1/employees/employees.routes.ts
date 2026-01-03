import { FastifyInstance } from "fastify";
 
import {
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
} from "./employees.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const employeesRoutes = (fastify: FastifyInstance) => {
  // Get all employees
  fastify.get(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    getAllEmployees
  );

  // Create new employee
  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER")
    },
    createEmployee
  );

  // Update employee
  fastify.patch(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    updateEmployee
  );

  // Delete employee
  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("PARTNER")
    },
    deleteEmployee
  );

  // Search employees
  fastify.get(
    "/search",
    {
      preHandler: verifyUser("PARTNER")
    },
    searchEmployees
  );
};

export default employeesRoutes;