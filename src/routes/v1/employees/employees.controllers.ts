


export const createEmployee = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { accountName, employeeName, email, password, financialAccess } =
      request.body;

    const missingField = [
      "accountName",
      "employeeName",
      "email",
      "password",
    ].find((field) => !request.body[field]);
    if (missingField) {
      return reply
        .status(400)
        .json({ success: false, message: `${missingField} is required!` });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return reply.status(400).send({
        success: false,
        message: "Email already registered!",
      });
    }

    const existingEmployee = await prisma.employees.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      return reply
        .status(400)
        .json({ success: false, message: "Employee already exists!" });
    }

    const employeeData = {
      accountName,
      employeeName,
      email,
      password,
      financialAccess,
      partnerId: request.user.id,
    };

    const newEmployee = await prisma.employees.create({
      data: employeeData,
    });

    reply.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: newEmployee,
    });
  } catch (error) {
    console.error("Create Employee error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getAllEmployees = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    console.log("request.user", request.user);
    const { page = 1, limit = 10 } = request.query;
    const partnerId = request.user.id;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid type page or limit",
      });
    }

    const totalCount = await prisma.employees.count({
      where: {
        partnerId,
      },
    });
    const employeesList = await prisma.employees.findMany({
      skip: (pageNumber - 1) * limitNumber,
      where: {
        partnerId,
      },
      take: limitNumber,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    reply.status(200).send({
      success: true,
      message: "Employees fetched successfully",
      data: employeesList,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    console.error("Get All Employees error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const updateEmployee = async (request, reply) => {
  try {
    const { id } = request.params;
    const partnerId = request.user.id;
    const prisma = request.server.prisma;

    const existingEmployee = await prisma.employees.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return reply
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Check if the employee belongs to the requesting partner
    if (existingEmployee.partnerId !== partnerId) {
      return reply.status(403).json({
        success: false,
        message: "You do not have permission to update this employee",
      });
    }

    // Prevent updating partnerId to ensure employees can't be transferred
    const { partnerId: _, ...updateData } = request.body;

    const updatedEmployee = await prisma.employees.update({
      where: { id },
      data: updateData,
    });

    reply.status(200).send({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Update Employee error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteEmployee = async (request, reply) => {
  try {
    const { id } = request.params;
    const partnerId = request.user.id;
    const prisma = request.server.prisma;

    const existingEmployee = await prisma.employees.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return reply
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Check if the employee belongs to the requesting partner
    if (existingEmployee.partnerId !== partnerId) {
      return reply.status(403).json({
        success: false,
        message: "You do not have permission to delete this employee",
      });
    }

    await prisma.employees.delete({
      where: { id },
    });

    reply.status(200).send({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete Employee error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const searchEmployees = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { search, page = 1, limit = 10, field = "all" } = request.query;

    if (!search || typeof search !== "string" || search.trim() === "") {
      return reply.status(400).send({
        success: false,
        message: "Search search is required",
      });
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const searchQuery = search.toString().trim();

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid page or limit parameter",
      });
    }

    let whereCondition: any = {
      partnerId: request.user.id,
    };

    if (field === "all" || !field) {
      whereCondition.OR = [
        { employeeName: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { accountName: { contains: searchQuery, mode: "insensitive" } },
      ];
    } else {
      const fieldMap: { [key: string]: string } = {
        name: "employeeName",
        email: "email",
        account: "accountName",
      };

      const prismaField = fieldMap[field as string] || "employeeName";
      whereCondition[prismaField] = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    const [employees, totalCount] = await Promise.all([
      prisma.employees.findMany({
        where: whereCondition,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      prisma.employees.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    reply.status(200).send({
      success: true,
      message:
        employees.length > 0
          ? "Employees found successfully"
          : "No employees found matching your search",
      data: employees,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
      search: {
        query: searchQuery,
        field: field || "all",
        resultsCount: employees.length,
      },
    });
  } catch (error: any) {
    console.error("Search Employees error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong while searching employees",
      error: error.message,
    });
  }
};
