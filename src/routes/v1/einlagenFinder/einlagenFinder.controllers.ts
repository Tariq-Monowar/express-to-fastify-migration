import fs from "fs";
import path from "path";


export const setEinlagenFinder = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { customerId, category, answers } = request.body;
    console.log(answers);
    console.log(customerId);
    console.log(category);
    console.log(request.body);
    const missingField = ["category", "answers"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    const validCategories = [
      "BUSINESSEINLAGE",
      "ALLTAGSEINLAGE",
      "SPORTEINLAGE",
    ];
    if (!validCategories.includes(category)) {
      return reply.status(400).send({
        success: false,
        message:
          "Invalid category. Must be one of: " + validCategories.join(", "),
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "Answers must be a non-empty array",
      });
    }

    const customerExists = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customerExists) {
      return reply.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const savedAnswers = [];

    for (const answer of answers) {
      const { questionId, selected } = answer;

      if (!questionId || selected === undefined) {
        continue;
      }

      try {
        let answerData = selected;

        if (Array.isArray(selected)) {
          answerData = selected;
        }

        const savedAnswer = await prisma.einlagenAnswers.upsert({
          where: {
            customerId_questionId: {
              customerId: customerId,
              questionId: questionId.toString(),
            },
          },
          update: {
            answer: answerData,
            category: category,
          },
          create: {
            customerId: customerId,
            category: category,
            questionId: questionId.toString(),
            answer: answerData,
          },
        });

        savedAnswers.push(savedAnswer);
      } catch (answerError) {
        console.error(
          `Error saving answer for question ${questionId}:`,
          answerError
        );
      }
    }

    console.log(savedAnswers);
    return reply.status(201).json({
      success: true,
      message: "Answers stored successfully!",
      data: {
        customerId,
        category,
        savedAnswers: savedAnswers.map((answer) => ({
          questionId: answer.questionId,
          answer: answer.answer,
        })),
      },
    });
  } catch (error) {
    console.error("Error in setEinlagenFinder:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getEinlagenFinderAnswers = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { customerId } = request.params;
    const { category } = request.query;

    if (!customerId) {
      return reply.status(400).send({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check if customer exists
    const customerExists = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customerExists) {
      return reply.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Build where clause
    const whereClause: any = {
      customerId: customerId,
    };

    if (category) {
      const validCategories = [
        "BUSINESSEINLAGE",
        "ALLTAGSEINLAGE",
        "SPORTEINLAGE",
      ];
      if (!validCategories.includes(category as string)) {
        return reply.status(400).send({
          success: false,
          message:
            "Invalid category. Must be one of: " + validCategories.join(", "),
        });
      }
      whereClause.category = category;
    }

    // Fetch answers
    const answers = await prisma.einlagenAnswers.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { questionId: "asc" }],
    });

    // Group answers by category
    const groupedAnswers = answers.reduce((acc, answer) => {
      if (!acc[answer.category]) {
        acc[answer.category] = [];
      }
      acc[answer.category].push({
        id: answer.id,
        questionId: answer.questionId,
        answer: answer.answer,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return reply.status(200).send({
      success: true,
      message: "Answers retrieved successfully",
      data: {
        customerId,
        customer: {
          id: customerExists.id,
          vorname: customerExists.vorname,
          nachname: customerExists.nachname,
          email: customerExists.email,
        },
        totalAnswers: answers.length,
        answersByCategory: groupedAnswers,
        allAnswers: answers.map((answer) => ({
          id: answer.id,
          category: answer.category,
          questionId: answer.questionId,
          answer: answer.answer,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getEinlagenFinderAnswers:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getEinlagenFinderQuestions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const jsonPath = path.join(__dirname, "einlagenFinder.json");

    if (!fs.existsSync(jsonPath)) {
      return reply.status(404).json({
        success: false,
        message: "Questions data not found",
      });
    }

    const jsonData = fs.readFileSync(jsonPath, "utf8");
    const questions = JSON.parse(jsonData);

    return reply.status(200).send({
      success: true,
      message: "Questions retrieved successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Error in getEinlagenFinderQuestions:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getAnswersByUserId = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: userId },
    });

    if (!customer) {
      return reply.status(404).json({
        success: false,
        message: "Customer not found for the given user ID",
      });
    }

    const answers = await prisma.einlagenAnswers.findMany({
      where: { customerId: customer.id },
      orderBy: [{ category: "asc" }, { questionId: "asc" }],
    });

    const groupedAnswers = answers.reduce((acc, answer) => {
      if (!acc[answer.category]) acc[answer.category] = [];
      acc[answer.category].push({
        questionId: answer.questionId,
        answer: answer.answer,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return reply.status(200).send({
      success: true,
      message: "Answers get successfully",
      data: {
        customerId: customer.id,
        totalAnswers: answers.length,
        answer: groupedAnswers,
      },
    });
  } catch (error) {
    console.error("Error in getAnswersByUserId:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
