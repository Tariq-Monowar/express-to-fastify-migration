import { FastifyInstance } from "fastify";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getMyAppointments,
  getSystemAppointment,
  getAvailableTimeSlots
} from "./appointment.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";


const appointmentRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    createAppointment
  );

  fastify.get(
    "/system-appointment/:customerId/:appointmentId",
    getSystemAppointment
  );

  fastify.get(
    "/available-slots",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getAvailableTimeSlots
  );

  fastify.get(
    "/",
    {
      preHandler: verifyUser("ADMIN")
    },
    getAllAppointments
  );

  fastify.get(
    "/my",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getMyAppointments
  );

  fastify.get(
    "/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    getAppointmentById
  );

  fastify.put(
    "/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    updateAppointment
  );

  fastify.delete(
    "/:id",
    {
      preHandler: verifyUser("PARTNER", "ADMIN")
    },
    deleteAppointment
  );
};

export default appointmentRoutes;