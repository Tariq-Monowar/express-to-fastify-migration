import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import {
  sendAdminLoginNotification,
  sendPartnershipWelcomeEmail,
} from "../../../utils/email.config";

import { generateJwtToken } from "../../../utils/jwt.utils";
import { baseUrl, getImageUrl } from "../../../utils/baseurl";

import { v4 as uuidv4 } from "uuid";
import { authenticator } from "otplib";
import { uploadsDir } from "../../../config/storage.config";
import { FileService } from "../../../utils/fileService";
import jwt from "jsonwebtoken";

export const loginUser = async (request, reply) => {
  const prisma = request.server.prisma;

  try {
    const { email, password } = request.body;

    const missingField = ["email", "password"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      return reply.status(400).send({
        message: `${missingField} is required!`,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        image: true,
        role: true,
      },
    });
    console.log(user);

    if (!user) {
      request.status(404).json({
        message: "User not found",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      request.status(401).json({ message: "Invalid password" });
      return;
    }

    const token = generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (user.role === "ADMIN") {
      const rawIp = request.ip || request.socket.remoteAddress || "Unknown";
      const ipAddress = rawIp.replace("::ffff:", "");

      sendAdminLoginNotification(user.email, user.name, ipAddress);
    }

    return reply.status(200).send({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ? getImageUrl(user.image) : null,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      succes: false,
      error: error,
      message: "Internal Server Error",
    });
  }
};

export const checkAuthStatus = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const authHeader = request.headers["authorization"];
    if (!authHeader) {
      return reply.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      return reply.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return reply.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return reply.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Fetch user based on the decoded ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return reply.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password, ...userData } = user;

    reply.status(200).send({
      success: true,
      user: {
        ...userData,
        image: user.image ? getImageUrl(user.image) : null,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    reply.status(500).send({
      success: false,
      message: "Authentication check failed",
    });
  }
};

export const createUser = async (request, reply) => {
  const prisma = request.server.prisma;

  try {
    const { name, email, password } = request.body;
    const image = request.file;

    // Check for missing required fields
    const missingField = ["name", "email", "password"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      if (image) {
        FileService.removeFile(image.filename);
      }
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (image) {
        FileService.removeFile(image.filename);
      }
      return reply.status(400).send({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: image ? image.filename : null,
      },
    });

    // Generate JWT token
    const token = generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Get image URL if exists
    const imageUrl = user.image ? `${getImageUrl(user.image)}` : null;

    // Send success response
    return reply.status(201).send({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: imageUrl,
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (request.file) {
      FileService.removeFile(request.file.filename);
    }

    // Log the error for server-side debugging
    request.server.log.error(error);

    // Send generic error response (don't expose internal error details)
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const updateUser = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { name, email } = request.body;
    
    const newImage = request.file;

    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!existingUser) {
      if (newImage) {
        FileService.removeFile(newImage.filename);
      }
      return reply.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (newImage && existingUser.image) {
      FileService.removeFile(existingUser.image);
    }

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        image: newImage ? newImage.filename : existingUser.image,
      },
    });

    const imageUrl = user.image ? getImageUrl(user.image) : null;
    reply.status(200).send({
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: imageUrl,
      },
    });
  } catch (error) {
    if (request.file) {
      FileService.removeFile(request.file.filename);
    }

    request.server.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const changePassword = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { oldPassword, newPassword } = request.body;

    if (!oldPassword || !newPassword) {
      return reply
        .code(400)
        .send({ message: "Both old and new passwords are required!" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return reply.code(401).send({ message: "Old password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: String(id) },
      data: { password: hashedNewPassword },
    });

    return reply.code(200).send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const createPartnership = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { email, password } = request.body;

    const missingField = ["email", "password"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      reply.status(400).send({
        message: `${missingField} is required!`,
      });
      return;
    }

    const existingPartnership = await prisma.user.findUnique({
      where: { email },
    });

    if (existingPartnership) {
      reply.status(400).send({
        message: "Email already exists",
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const partnership = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "PARTNER",
      },
    });

    // Send welcome email with credentials
    sendPartnershipWelcomeEmail(email, password, undefined, undefined);

    reply.status(201).json({
      success: true,
      message: "Partnership created successfully",
      partnership,
    });
  } catch (error) {
    console.error("Partnership creation error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const getAllPartners = async (request, reply) => {
  const prisma = request.server.prisma;

  try {
    const partners = await prisma.user.findMany({
      where: { role: "PARTNER" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    const partnersWithImageUrls = partners.map((partner) => ({
      ...partner,
      image: partner.image ? getImageUrl(partner.image) : null,
    }));

    reply.status(200).send({
      success: true,
      partners: partnersWithImageUrls,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const updatePartnerProfile = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { name } = request.body;
    const newImage = request.file;

    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!existingUser) {
      if (newImage) {
        FileService.removeFile(newImage.filename);
      }
      reply.status(404).json({
        message: "User not found",
      });
    }

    if (newImage && existingUser.image) {
      FileService.removeFile(existingUser.image);
    }

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        name: name || existingUser.name,
        image: newImage ? newImage.filename : existingUser.image,
      },
    });

    const imageUrl = user.image ? getImageUrl(user.image) : null;

    reply.status(200).send({
      success: true,
      message: "Partner profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: imageUrl,
        role: user.role,
      },
    });
  } catch (error) {
    if (request.file) {
      FileService.removeFile(request.file.filename);
    }

    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};
