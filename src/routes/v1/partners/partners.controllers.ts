import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import validator from "validator";
import {
  generateOTP,
  sendForgotPasswordOTP,
  sendPartnershipWelcomeEmail,
} from "../../../utils/email.config";
import { FileService } from "../../../utils/fileService";

export const createPartnership = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const {
      email,
      password,
      name,
      phone,
      absenderEmail,
      bankName,
      bankNumber,
      busnessName,
      hauptstandort,
    } = request.body;

    const newImage = request.file;

    const missingField = ["email", "password"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      request.status(400).json({
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

    const parsedHauptstandort: string[] | undefined = Array.isArray(
      hauptstandort
    )
      ? (hauptstandort as string[])
      : typeof hauptstandort === "string" && hauptstandort.trim().length > 0
      ? hauptstandort
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;

    const partnership = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "PARTNER",
        name: name ?? undefined,
        phone: phone ?? undefined,
        absenderEmail: absenderEmail ?? undefined,
        bankName: bankName ?? undefined,
        bankNumber: bankNumber ?? undefined,
        busnessName: busnessName ?? undefined,
        hauptstandort: parsedHauptstandort ?? [],
        image: newImage ? newImage.filename : undefined,
      },
    });

    // Send welcome email with credentials
    sendPartnershipWelcomeEmail(email, password, name, phone);

    reply.status(201).json({
      success: true,
      message: "Partnership created successfully",
      partnership: {
        ...partnership,
        image: partnership.image
          ? getImageUrl(`/uploads/${partnership.image}`)
          : null,
      },
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

export const updatePartnerProfile = async (request, reply) => {
  try {
    const { id } = request.user;
    const prisma = request.server.prisma;
    const {
      name,
      phone,
      absenderEmail,
      bankName,
      bankNumber,
      busnessName,
      hauptstandort,
    } = request.body;
    const newImage = request.file;

    const existingUser = await prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!existingUser) {
      // Clean up uploaded image if user doesn't exist
      if (newImage?.filename) {
        FileService.removeFile(newImage.filename);
      }
      return reply.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Remove old image if new one is uploaded
    if (newImage?.filename && existingUser.image) {
      FileService.removeFile(existingUser.image);
    }

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        name: name || existingUser.name,
        image: newImage?.filename || existingUser.image,
        phone: phone || existingUser.phone,
        absenderEmail: absenderEmail || existingUser.absenderEmail,
        bankName: bankName || existingUser.bankName,
        bankNumber: bankNumber || existingUser.bankNumber,
        busnessName: busnessName || existingUser.busnessName,
        hauptstandort: hauptstandort || existingUser.hauptstandort,
      },
    });

    const imageUrl = user.image ? getImageUrl(`/uploads/${user.image}`) : null;

    return reply.status(200).send({
      success: true,
      message: "Partner profile updated successfully",
      user: {
        ...user,
        image: imageUrl,
      },
    });
  } catch (error: any) {
    // Clean up uploaded image if error occurs
    if (request.file?.filename) {
      FileService.removeFile(request.file.filename);
    }

    console.error("Update Partner Profile Error:", error);
    
    return reply.status(500).send({
      success: false,
      message: "Something went wrong while updating partner profile",
      error: error.message || error,
    });
  }
};

export const getAllPartners = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const search = (request.query.search as string) || "";
    const skip = (page - 1) * limit;

    const whereCondition = {
      role: "PARTNER",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [partners, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "PARTNER",
          OR: search
            ? [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : undefined,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: {
          role: "PARTNER",
          OR: search
            ? [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : undefined,
        },
      }),
    ]);

    const partnersWithImageUrls = partners.map((partner) => ({
      ...partner,
      image: partner.image ? getImageUrl(partner.image) : null,
    }));

    reply.status(200).send({
      success: true,
      data: partnersWithImageUrls,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const getPartnerById = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const partner = await prisma.user.findUnique({
      where: { id, role: "PARTNER" },
    });

    if (!partner) {
      reply.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    reply.status(200).send({
      success: true,
      partner: {
        ...partner,
        image: partner.image ? getImageUrl(partner.image) : null,
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const updatePartnerByAdmin = async (request, reply) => {
  const prisma = request.server.prisma;
  const { id } = request.params;
  const newImage = request.file;

  try {
    const {
      name,
      email,
      password,
      phone,
      absenderEmail,
      bankName,
      bankNumber,
      busnessName,
      hauptstandort,
      role,
    } = request.body;

    // Find the user
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.role !== "PARTNER") {
      // Clean up uploaded image if partner not found
      if (newImage?.filename) {
        FileService.removeFile(newImage.filename);
      }
      reply.status(404).json({
        success: false,
        message: "Partner not found",
      });
      return;
    }

    // Validate email if provided
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        // Clean up uploaded image on validation error
        if (newImage?.filename) {
          FileService.removeFile(newImage.filename);
        }
        reply.status(400).send({ 
          success: false, 
          message: "Invalid email format" 
        });
        return;
      }

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        // Clean up uploaded image on duplicate email
        if (newImage?.filename) {
          FileService.removeFile(newImage.filename);
        }
        reply.status(400).send({ 
          success: false, 
          message: "Email already in use" 
        });
        return;
      }
    }

    // Hash password if provided
    let updatedPassword = user.password;
    if (password) {
      if (password.length < 6) {
        // Clean up uploaded image on validation error
        if (newImage?.filename) {
          FileService.removeFile(newImage.filename);
        }
        reply.status(400).send({
          success: false,
          message: "Password must be at least 6 characters",
        });
        return;
      }
      updatedPassword = await bcrypt.hash(password, 10);
    }

    // Remove old image if new one is uploaded
    if (newImage?.filename && user.image) {
      FileService.removeFile(user.image);
    }

    // Parse hauptstandort from string or array
    const parsedHauptstandort: string[] | undefined = Array.isArray(
      hauptstandort
    )
      ? (hauptstandort as string[])
      : typeof hauptstandort === "string" && hauptstandort.trim().length > 0
      ? hauptstandort
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;

    // Validate role if provided
    const allowedRoles = new Set(["ADMIN", "USER", "PARTNER"]);
    const nextRole = role && allowedRoles.has(role) ? (role as any) : undefined;

    // Update user in database
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name ?? user.name,
        email: email ?? user.email,
        password: updatedPassword,
        image: newImage?.filename ?? user.image,
        phone: phone ?? user.phone,
        absenderEmail: absenderEmail ?? user.absenderEmail,
        bankName: bankName ?? user.bankName,
        bankNumber: bankNumber ?? user.bankNumber,
        busnessName: busnessName ?? user.busnessName,
        hauptstandort: parsedHauptstandort ?? user.hauptstandort,
        role: nextRole ?? user.role,
      },
    });

    // Generate image URL for response
    const imageUrl = updated.image ? getImageUrl(updated.image) : null;

    reply.status(200).send({
      success: true,
      message: "Partner updated successfully",
      partner: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        image: imageUrl,
        phone: updated.phone,
        absenderEmail: updated.absenderEmail,
        bankName: updated.bankName,
        bankNumber: updated.bankNumber,
        busnessName: updated.busnessName,
        hauptstandort: updated.hauptstandort,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    if (newImage?.filename) {
      FileService.removeFile(newImage.filename);
    }

    console.error("Update Partner By Admin Error:", error);
    
    reply.status(500).send({
      success: false,
      message: "Something went wrong while updating partner",
      error: error.message || error,
    });
  }
};

export const deletePartner = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;

    const partner = await prisma.user.findUnique({
      where: { id, role: "PARTNER" },
    });

    if (!partner) {
      reply.status(404).json({
        success: false,
        message: "Partner not found",
      });
      return;
    }

    if (partner.image) {
      FileService.removeFile(partner.image);
    }

    await prisma.user.delete({
      where: { id },
    });

    reply.status(200).send({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const changePasswordSendOtp = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { email } = request.body;

    if (!email) {
      reply.status(400).send({
        message: "Email is required!",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      reply.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.email !== email) {
      reply.status(400).send({
        message: "Email does not match with the logged-in user",
      });
      return;
    }

    // Generate OTP and send it to the user's email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Send OTP to user's email (implement your own email sending logic)
    // await sendOtpEmail(email, otp);

    reply.status(200).send({
      success: true,
      message: "OTP sent to your email",
      otp,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

export const forgotPasswordSendOtp = async (request, reply) => {
  const prisma = request.server.prisma;
  const { email } = request.body;

  if (!email) {
    reply.status(400).send({ error: "Email is required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      reply.status(404).json({ error: "User not found" });
      return;
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.ucode.upsert({
      where: { email },
      update: { otp, expired_at: expiry },
      create: { email, otp, expired_at: expiry },
    });

    sendForgotPasswordOTP(email, otp);

    reply.status(200).send({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in forgotPasswordSendOtp:", error);
    reply
      .status(500)
      .json({ error: "Failed to send OTP. Please try again later." });
  }
};

export const forgotPasswordVerifyOtp = async (request, reply) => {
  const prisma = request.server.prisma;
  const { email, otp } = request.body;

  if (!email || !otp) {
    reply.status(400).send({ error: "Email and OTP are required" });
    return;
  }

  try {
    const ucode = await prisma.ucode.findUnique({ where: { email } });

    if (!ucode) {
      reply.status(400).send({ error: "Please request a new OTP" });
      return;
    }

    if (new Date() > ucode.expired_at) {
      reply.status(400).send({ error: "OTP has expired" });
      return;
    }

    if (ucode.otp !== otp) {
      reply.status(400).send({ error: "Invalid OTP" });
      return;
    }

    reply
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in forgotPasswordVerifyOtp:", error);
    reply.status(500).send({ error: "Failed to verify OTP" });
  }
};

export const resetPassword = async (request, reply) => {
  const prisma = request.server.prisma;
  const { email, password } = request.body;

  if (!email || !password) {
    reply.status(400).send({ error: "Email and new password are required" });
    return;
  }

  try {
    const ucode = await prisma.ucode.findUnique({ where: { email } });

    if (!ucode) {
      reply.status(400).send({
        error: "OTP verification required before resetting password",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.ucode.delete({ where: { email } });

    reply
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    reply.status(500).send({ error: "Failed to reset password" });
  }
};

export const changePassword = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { currentPassword, newPassword } = request.body;

    if (!currentPassword || !newPassword) {
      reply.status(400).send({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      reply.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      reply.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    if (newPassword.length < 6) {
      reply.status(400).send({
        success: false,
        message: "New password must be at least 6 characters long",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    reply.status(200).send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const managePartnerSettings = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const { id } = request.user;
    const { orthotech, opannrit } = request.body;

    // this orthotech and opannrit are boolean values
    if (orthotech !== undefined && typeof orthotech !== "boolean") {
      return reply.status(400).send({
        success: false,
        message: "orthotech must be a boolean value",
      });
    }
    if (opannrit !== undefined && typeof opannrit !== "boolean") {
      return reply.status(400).send({
        success: false,
        message: "opannrit must be a boolean value",
      });
    }

    // Validate input
    if (orthotech === undefined && opannrit === undefined) {
      return reply.status(400).send({
        success: false,
        message: "At least one setting (orthotech or opannrit) is required",
      });
    }

    const partner = await prisma.user.findUnique({
      where: { id },
    });

    if (!partner) {
      return reply.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.role !== "PARTNER") {
      return reply.status(400).send({
        success: false,
        message: "You are not authorized to manage partner settings",
      });
    }

    // Check if partner_settings exists, then create or update
    // This ensures only one partner_settings record exists per partner
    // Using type assertion in case Prisma client hasn't been regenerated
    const partnersSettingsModel = (prisma as any).partners_settings;
    if (!partnersSettingsModel) {
      return reply.status(500).send({
        success: false,
        message:
          "Partner settings model not available. Please regenerate Prisma client.",
        error: "Model not found in Prisma client",
      });
    }

    const existingSettings = await partnersSettingsModel.findUnique({
      where: { partnerId: id },
    });

    let partnerSettings;
    if (existingSettings) {
      // Update existing settings
      partnerSettings = await partnersSettingsModel.update({
        where: { id: existingSettings.id },
        data: {
          ...(orthotech !== undefined && { orthotech }),
          ...(opannrit !== undefined && { opannrit }),
        },
      });
    } else {
      // Create new settings
      partnerSettings = await partnersSettingsModel.create({
        data: {
          partnerId: id,
          orthotech: orthotech ?? false,
          opannrit: opannrit ?? false,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Partner settings saved successfully",
      data: partnerSettings,
    });
  } catch (error: any) {
    console.error("managePartnerSettings error:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message || "Unknown error",
    });
  }
};

export const getPartnerSettings = async (request, reply) => {
  try {
    const { id } = request.user;
    const prisma = request.server.prisma;

    const partner = await prisma.user.findUnique({
      where: { id },
    });

    if (!partner) {
      return reply.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.role !== "PARTNER") {
      return reply.status(400).send({
        success: false,
        message: "You are not authorized to view partner settings",
      });
    }

    const partnersSettingsModel = (prisma as any).partners_settings;
    if (!partnersSettingsModel) {
      return reply.status(500).send({
        success: false,
        message:
          "Partner settings model not available. Please regenerate Prisma client.",
        error: "Model not found in Prisma client",
      });
    }

    const partnerSettings = await partnersSettingsModel.findUnique({
      where: { partnerId: id },
    });

    if (!partnerSettings) {
      return reply.status(200).send({
        success: true,
        message: "Partner settings not found. Default values returned.",
        data: {
          orthotech: false,
          opannrit: false,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Partner settings fetched successfully",
      data: partnerSettings,
    });
  } catch (error: any) {
    console.error("Error in getPartnerSettings:", error);
    return reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error?.message || "Unknown error",
    });
  }
};
