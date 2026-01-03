import { FastifyInstance } from "fastify";
import { getExcelData } from "./excel.controllers";

const excelRoutes = (fastify: FastifyInstance) => {
  // Get Excel data
  fastify.get("/", getExcelData);
};

export default excelRoutes;