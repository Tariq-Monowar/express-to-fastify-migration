import { validator } from 'validator';
 import { sendNewSuggestionEmail } from "../../../utils/email.config";
import { FileService } from '../../../utils/fileService';
import { getImageUrl } from '../../../utils/baseurl';
 
export const createSuggestions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { reason, name, phone, suggestion } = request.body;
    const { id } = request.user;

    const missingField = ["reason", "name", "phone", "suggestion"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
      return;
    }

    if (!validator.isMobilePhone(phone)) {
      reply.status(400).send({
        success: false,
        message: "Invalid phone number format!",
      });
      return;
    }

    const newSuggestion = await prisma.suggestionFeetf1rst.create({
      data: {
        reason,
        name,
        phone,
        suggestion,
        userId: id,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    sendNewSuggestionEmail(name, "email", phone, "firma", suggestion);

    reply.status(201).json({
      success: true,
      message: "Suggestion created successfully",
      suggestion: newSuggestion,
    });
  } catch (error) {
    console.error("Create suggestion error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllSuggestions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const suggestions = await prisma.suggestionFeetf1rst.findMany({
      orderBy: {
        createdAt: "desc", // Newest first
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
      suggestions,
    });
  } catch (error) {
    console.error("Get all suggestions error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteSuggestion = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const suggestion = await prisma.suggestionFeetf1rst.findUnique({
      where: { id },
    });

    if (!suggestion) {
      reply.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
      return;
    }

    await prisma.suggestionFeetf1rst.delete({
      where: { id },
    });

    reply.status(200).send({
      success: true,
      message: "Suggestion deleted successfully",
    });
  } catch (error) {
    console.error("Delete suggestion error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteAllSuggestions = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    await prisma.suggestionFeetf1rst.deleteMany();

    reply.status(200).send({
      success: true,
      message: "All suggestions deleted successfully",
    });
  } catch (error) {
    console.error("Delete all suggestions error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const createImprovement = async (request, reply) => {

  const files = request.files as any;

  const cleanupFiles = () => {
    if (!files) return;
    if (Array.isArray(files)) {
      files.forEach((file: any) => {
        try {
          if (file && file.path){
            FileService.removeFileByPath(file.path);
          }
        } catch (err) {
          console.error(`Failed to delete file ${file?.path}`, err);
        }
      });
    } else if (files && typeof files === 'object') {
      // Handle object format (shouldn't happen with upload.array, but just in case)
      Object.keys(files).forEach((key) => {
        if (Array.isArray(files[key])) {
          files[key].forEach((file: any) => {
            try {
              if (file && file.path) FileService.removeFileByPath(file.path);
            } catch (err) {
              console.error(`Failed to delete file ${file?.path}`, err);
            }
          });
        }
      });
    }
  };

  try {
    const prisma = request.server.prisma;
    const { suggestion, category } = request.body;
    const { id: userId } = request.user;

    // Validate required fields
    if (!suggestion) {
      cleanupFiles();
      return reply.status(400).send({
        success: false,
        message: "suggestion is required!",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      cleanupFiles();
      return reply.status(400).send({
        success: false,
        message: "User not found",
      });
    }

    // Handle image uploads
    // When using upload.array("images", 100), files come as an array directly
    let imageFilenames: string[] = [];
    
    if (files) {
      if (Array.isArray(files) && files.length > 0) {
        // Standard case: files is an array
        imageFilenames = files
          .filter((file: any) => file && file.filename)
          .map((file: any) => file.filename);
      } else if (typeof files === 'object' && !Array.isArray(files)) {
        // Fallback: files might be an object with field names as keys
        if (files.images && Array.isArray(files.images)) {
          imageFilenames = files.images
            .filter((file: any) => file && file.filename)
            .map((file: any) => file.filename);
        }
      }
    }

    console.log("[createImprovement] req.files:", request.files);
    console.log("[createImprovement] files type:", typeof files);
    console.log("[createImprovement] files is array:", Array.isArray(files));
    console.log("[createImprovement] image filenames:", imageFilenames);

    const newImprovement = await prisma.improvementSuggestion.create({
      data: {
        suggestion,
        category: category || null,
        image: imageFilenames,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    // Format response with image URLs
    const formattedImprovement = {
      ...newImprovement,
      image: newImprovement.image.map((img) => getImageUrl(img)),
    };

    reply.status(201).json({
      success: true,
      message: "Improvement suggestion created successfully",
      improvement: formattedImprovement,
    });
  } catch (error: any) {
    cleanupFiles();
    console.error("Create improvement suggestion error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getAllImprovements = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Optional: Filter by category if provided
    if (request.query.category) {
      where.category = request.query.category as string;
    }

    // Optional: Filter by date range (days)
    const days = parseInt(request.query.days as string);
    if (days && !isNaN(days)) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.createdAt = {
        gte: startDate,
      };
    }

    // Optional: Filter by userId if provided
    if (request.query.userId) {
      where.userId = request.query.userId as string;
    }

    const [improvements, totalCount] = await Promise.all([
      prisma.improvementSuggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.improvementSuggestion.count({ where }),
    ]);

    // Format improvements with image URLs
    const formattedImprovements = improvements.map((improvement) => ({
      ...improvement,
      image: improvement.image.map((img) => getImageUrl(img)),
      user: {
        ...improvement.user,
        image: improvement.user.image ? getImageUrl(improvement.user.image) : null,
      },
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    reply.status(200).send({
      success: true,
      improvements: formattedImprovements,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        filter: days ? `Last ${days} days` : "All time",
      },
    });
  } catch (error: any) {
    console.error("Get all improvement suggestions error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteImprovement = async (request, reply) => {
  try {
    const { ids } = request.body;
    const prisma = request.server.prisma;

    // Validate required field
    if (!ids) {
      return reply.status(400).send({
        success: false,
        message: "IDs are required",
      });
    }

    // Validate ids is an array
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "IDs must be a non-empty array",
      });
    }

    // Check if all improvements exist
    const existingImprovements = await prisma.improvementSuggestion.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        image: true,
      },
    });

    const existingIds = existingImprovements.map((improvement) => improvement.id);
    const nonExistingIds = ids.filter((id: string) => !existingIds.includes(id));

    if (nonExistingIds.length > 0) {
      return reply.status(404).json({
        success: false,
        message: "Some improvement suggestions not found",
        nonExistingIds,
        existingIds,
      });
    }

    // Delete all image files
    existingImprovements.forEach((improvement) => {
      if (improvement.image && improvement.image.length > 0) {
        improvement.image.forEach((imageFilename) => {
          FileService.removeFile(imageFilename);
          // const imagePath = path.join(process.cwd(), "uploads", imageFilename);
          // if (imagePath) {
          //   try {
          //     // fs.unlinkSync(imagePath);
          //     console.log(`Deleted image file: ${imagePath}`);
          //   } catch (err) {
          //     console.error(`Failed to delete image file: ${imagePath}`, err);
          //   }
          // }
        });
      }
    });

    // Delete all improvements
    const result = await prisma.improvementSuggestion.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    reply.status(200).send({
      success: true,
      message: `Successfully deleted ${result.count} improvement suggestion(s)`,
      data: {
        deletedCount: result.count,
        deletedIds: existingIds,
      },
    });
  } catch (error: any) {
    console.error("Delete improvement suggestion error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteAllImprovements = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    // Get all improvements with their images before deleting
    const improvements = await prisma.improvementSuggestion.findMany({
      select: {
        image: true,
      },
    });

    // Delete all image files
    improvements.forEach((improvement) => {
      if (improvement.image && improvement.image.length > 0) {
        improvement.image.forEach((imageFilename) => {
          FileService.removeFile(imageFilename);
        });
      }
    });

    await prisma.improvementSuggestion.deleteMany();

    reply.status(200).send({
      success: true,
      message: "All improvement suggestions deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete all improvement suggestions error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
