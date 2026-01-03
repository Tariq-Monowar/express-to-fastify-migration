import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const checkAppointmentOverlap = async (
  employeeId: string,
  date: Date,
  time: string,
  duration: number,
  excludeAppointmentId?: string
) => {
  const [timeStr, period] = time.includes(" ") ? time.split(" ") : [time, ""];
  const [hours, minutes] = timeStr.split(":").map(Number);

  let startHour = hours;
  if (period.toLowerCase() === "pm" && hours !== 12) {
    startHour += 12;
  } else if (period.toLowerCase() === "am" && hours === 12) {
    startHour = 0;
  }

  const startTime = new Date(date);
  startTime.setHours(startHour, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setHours(startTime.getHours() + duration);

  const overlappingAppointments = await prisma.appointment.findMany({
    where: {
      employeId: employeeId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    },
  });

  for (const appointment of overlappingAppointments) {
    const [existingTimeStr, existingPeriod] = appointment.time.includes(" ")
      ? appointment.time.split(" ")
      : [appointment.time, ""];
    const [existingHours, existingMinutes] = existingTimeStr
      .split(":")
      .map(Number);

    let existingStartHour = existingHours;
    if (existingPeriod.toLowerCase() === "pm" && existingHours !== 12) {
      existingStartHour += 12;
    } else if (existingPeriod.toLowerCase() === "am" && existingHours === 12) {
      existingStartHour = 0;
    }

    const existingStartTime = new Date(appointment.date);
    existingStartTime.setHours(existingStartHour, existingMinutes, 0, 0);

    const existingEndTime = new Date(existingStartTime);
    existingEndTime.setHours(
      existingStartTime.getHours() + (appointment.duration || 1)
    );
    
    if (
      (startTime < existingEndTime && endTime > existingStartTime) ||
      startTime.getTime() === existingStartTime.getTime()
    ) {
      return {
        hasOverlap: true,
        conflictingAppointment: appointment,
        message: `Employee ${
          appointment.assignedTo
        } already has an appointment from ${
          appointment.time
        } to ${existingEndTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })} on this date.`,
      };
    }
  }

  return { hasOverlap: false };
};

export const getAvailableTimeSlots = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { employeId, date } = request.query;

    if (!employeId || !date) {
      reply.status(400).send({
        success: false,
        message: "employeId and date are required",
      });
      return;
    }

    const appointmentDate = new Date(date as string);

    const appointments = await prisma.appointment.findMany({
      where: {
        employeId: employeId as string,
        date: {
          gte: new Date(
            appointmentDate.getFullYear(),
            appointmentDate.getMonth(),
            appointmentDate.getDate()
          ),
          lt: new Date(
            appointmentDate.getFullYear(),
            appointmentDate.getMonth(),
            appointmentDate.getDate() + 1
          ),
        },
      },
      orderBy: {
        time: "asc",
      },
    });

    const workingHours = 8;
    const workingEndHours = 18;
    const slotDuration = 0.5;
    const availableSlots = [];

    for (
      let hour = workingHours;
      hour < workingEndHours;
      hour += slotDuration
    ) {
      const slotTime = `${Math.floor(hour).toString().padStart(2, "0")}:${
        hour % 1 === 0 ? "00" : "30"
      }`;

      const hasConflict = appointments.some((appointment) => {
        const [appTimeStr, appPeriod] = appointment.time.includes(" ")
          ? appointment.time.split(" ")
          : [appointment.time, ""];
        const [appHours, appMinutes] = appTimeStr.split(":").map(Number);

        let appStartHour = appHours;
        if (appPeriod.toLowerCase() === "pm" && appHours !== 12) {
          appStartHour += 12;
        } else if (appPeriod.toLowerCase() === "am" && appHours === 12) {
          appStartHour = 0;
        }

        const appEndHour = appStartHour + (appointment.duration || 1);

        return hour >= appStartHour && hour < appEndHour;
      });

      if (!hasConflict) {
        availableSlots.push(slotTime);
      }
    }

    reply.status(200).send({
      success: true,
      availableSlots,
      existingAppointments: appointments.map((app) => ({
        id: app.id,
        time: app.time,
        duration: app.duration || 1,
        customer_name: app.customer_name,
        reason: app.reason,
      })),
    });
  } catch (error) {
    console.error("Get available time slots error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Create appointment
export const createAppointment = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const {
      customer_name,
      customerId,
      time,
      date,
      reason,
      assignedTo,
      employeId,
      duration,
      details,
      isClient,
    } = request.body;
    const { id } = request.user;

    const missingField = ["time", "date", "reason", "assignedTo"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
      return;
    }

    // Validate duration
    const appointmentDuration = duration || 1; // Default to 1 hour if not provided
    if (appointmentDuration <= 0) {
      reply.status(400).send({
        success: false,
        message: "Duration must be greater than 0",
      });
      return;
    }

    // Check for overlapping appointments if employeId is provided
    if (employeId) {
      const overlapCheck = await checkAppointmentOverlap(
        employeId,
        new Date(date),
        time,
        appointmentDuration,
        request
      );

      if (overlapCheck.hasOverlap) {
        reply.status(409).json({
          success: false,
          message: overlapCheck.message,
          data: overlapCheck.conflictingAppointment,
        });
        return;
      }
    }

    const appointmentData: any = {
      customer_name,
      time,
      date: new Date(date),
      reason,
      assignedTo,
      details: details ? details : null,
      userId: id,
      customerId,
      duration: appointmentDuration,
    };

    if (employeId) {
      appointmentData.employeId = employeId;
    }

    if (typeof isClient !== "undefined") {
      appointmentData.isClient = isClient;
    }

    const appointment = await prisma.appointment.create({
      data: appointmentData,
    });

    if (isClient && customerId) {
      const customerExists = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true },
      });

      if (!customerExists) {
        console.warn(
          `Customer with ID ${customerId} not found. Skipping history creation.`
        );
      } else {
        const formattedDate = new Date(date).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        await prisma.customerHistorie.create({
          data: {
            customerId,
            category: "Termin",
            url: `/appointment/system-appointment/${customerId}/${appointment.id}`,
            methord: "GET",
            system_note: `Termin zur Laufanalyse am ${formattedDate}`,
          },
          select: { id: true },
        });
      }
    }

    reply.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
///------------------------------------------------------------------------------------

// controllers/appointment.ts

export const getSystemAppointment = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { customerId, appointmentId } = request.params;

    //i need only single user appomnent
    const { id } = request.user;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: customerId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      return reply.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    reply.status(200).send({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get system appointment error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Get all appointments
export const getAllAppointments = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    reply.status(200).send({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      reply.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    reply.status(200).send({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Update appointment
export const updateAppointment = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;
    const {
      customer_name,
      time,
      date,
      reason,
      assignedTo,
      employeId,
      duration,
      details,
      isClient,
    } = request.body;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      reply.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const updatedTime = time || existingAppointment.time;
    const updatedDate = date ? new Date(date) : existingAppointment.date;
    const updatedEmployeId = employeId || existingAppointment.employeId;
    const updatedDuration =
      duration !== undefined ? duration : existingAppointment.duration || 1;

    // Validate duration
    if (updatedDuration <= 0) {
      reply.status(400).send({
        success: false,
        message: "Duration must be greater than 0",
      });
      return;
    }

    if (
      updatedEmployeId &&
      (time !== undefined ||
        date !== undefined ||
        duration !== undefined ||
        employeId !== undefined)
    ) {
      const overlapCheck = await checkAppointmentOverlap(
        updatedEmployeId,
        updatedDate,
        updatedTime,
        updatedDuration,
        id // Exclude current appointment from overlap check
      );

      if (overlapCheck.hasOverlap) {
        reply.status(409).json({
          success: false,
          message: overlapCheck.message,
          conflictingAppointment: overlapCheck.conflictingAppointment,
        });
        return;
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        customer_name: customer_name || existingAppointment.customer_name,
        time: updatedTime,
        date: updatedDate,
        reason: reason || existingAppointment.reason,
        assignedTo: assignedTo || existingAppointment.assignedTo,
        employeId: updatedEmployeId,
        duration: updatedDuration,
        details: details || existingAppointment.details,
        isClient:
          isClient !== undefined ? isClient : existingAppointment.isClient,
      },
    });

    reply.status(200).send({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Delete appointment
export const deleteAppointment = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      reply.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    await prisma.appointment.delete({
      where: { id },
    });

    reply.status(200).send({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Get my appointments
export const getMyAppointments = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const search = (request.query.search as string) || "";
    const skip = (page - 1) * limit;

    // Define search conditions for better readability
    const searchConditions = search
      ? [
          { customer_name: { contains: search, mode: "insensitive" as const } },
          { details: { contains: search, mode: "insensitive" as const } },
          { reason: { contains: search, mode: "insensitive" as const } },
          { assignedTo: { contains: search, mode: "insensitive" as const } },
          { time: { contains: search, mode: "insensitive" as const } },
        ]
      : undefined;

    // Define base where condition
    const whereCondition = {
      userId: id,
      OR: searchConditions,
    };

    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        // include: {
        //   user: {
        //     select: {
        //       name: true,
        //       email: true
        //     }
        //   }
        // }
      }),
      prisma.appointment.count({
        where: whereCondition,
      }),
    ]);

    reply.status(200).send({
      success: true,
      data: appointments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get my appointments error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
