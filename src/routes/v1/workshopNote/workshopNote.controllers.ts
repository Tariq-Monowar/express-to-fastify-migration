 

export const manageWorkshopNote = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const userId = request.user.id;
    const {
      employeeId,
      completionDays,
      sameAsBusiness,
      showCompanyLogo,
      autoShowAfterPrint,
      autoApplySupply,
      pickupLocation,
    } = request.body;

    console.log(request.body);
    console.log("================================");
    console.log(completionDays);
    console.log("================================");

    //make request body
    if (!employeeId) {
      return reply.status(400).send({
        success: false,
        message: "Employee ID is required",
      });
    }
    if (!completionDays) {
      return reply.status(400).send({
        success: false,
        message: "Completion Days is required",
      });
    }

    let employeeName: string | null = null;
    let validEmployeeId: string | null = null;

    if (employeeId) {
      console.log(employeeId);
      const employee = await prisma.employees.findUnique({
        where: { id: employeeId },
        select: { employeeName: true },
      });
      console.log(employee);
      if (employee) {
        validEmployeeId = employeeId;
        employeeName = employee.employeeName;
      }
    }

    const partner = await prisma.user.findFirst({
      where: { id: userId },
      select: { hauptstandort: true },
    });

    // Determine pickupLocation based on sameAsBusiness
    let finalPickupLocation: string[] = [];
    if (sameAsBusiness === true || sameAsBusiness === undefined) {
      // Use partner's hauptstandort if sameAsBusiness is true
      finalPickupLocation = partner?.hauptstandort ?? [];
    } else {
      // Use provided pickupLocation when sameAsBusiness is false
      finalPickupLocation = Array.isArray(pickupLocation) ? pickupLocation : [];
    }

    const workshopNote = await prisma.workshopNote.upsert({
      where: { userId },
      create: {
        userId,
        employeeId: validEmployeeId,
        employeeName,
        completionDays: completionDays || "5 Werktage",
        pickupLocation: finalPickupLocation as any,
        sameAsBusiness: sameAsBusiness ?? true,
        showCompanyLogo: showCompanyLogo ?? true,
        autoShowAfterPrint: autoShowAfterPrint ?? true,
        autoApplySupply: autoApplySupply ?? true,
      },
      update: {
        employeeId: validEmployeeId,
        employeeName,
        completionDays: completionDays || "5 Werktage",
        pickupLocation: finalPickupLocation as any,
        sameAsBusiness: sameAsBusiness ?? true,
        showCompanyLogo: showCompanyLogo ?? true,
        autoShowAfterPrint: autoShowAfterPrint ?? true,
        autoApplySupply: autoApplySupply ?? true,
      },
    });

    return reply.status(200).send({
      success: true,
      message: "WorkshopNote set successfully",
      data: workshopNote,
    });
  } catch (error: any) {
    console.error("manageWorkshopNote error:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message,
    });
  }
};

export const getWorkshopNote = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const userId = request.user.id;

    const workshopNote = await prisma.workshopNote.findUnique({
      where: { userId },
    });

    if (!workshopNote) {
      return reply.status(404).json({
        success: false,
        message: "Workshop note not found for this user",
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Workshop note fetched successfully",
      data: workshopNote,
    });
  } catch (error: any) {
    console.error("getWorkshopNote error:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message,
    });
  }
};
