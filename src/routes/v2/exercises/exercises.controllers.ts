import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import exercises from "./exercises.data";
import { FileService } from "../../../utils/fileService";
import { sendPdfToEmail } from "../../../utils/email.config";
// import { sendPdfToEmail } from "../../../utils/emailService.utils";
// import { FileService } from "../../../utils/fileService.utils";

export const getAllexercises = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    reply.status(200).send({ success: true, exercises });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    reply.status(500).send({
      success: false,
      message: "Server error, could not fetch exercises.",
    });
  }
};
 
export const sendExercisesEmail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email } = request.body as { email: string };
    const pdfFile = (request as any).file;

    if (!email || !pdfFile) {
      if (pdfFile) FileService.removeFileByPath(pdfFile.path);

      reply.status(400).send({
        success: false,
        message: "Email and PDF file are required",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      FileService.removeFileByPath(pdfFile.path);
      reply.status(400).send({
        success: false,
        message: "Invalid email format",
      });
      return;
    }

    if (pdfFile.mimetype !== "application/pdf") {
      FileService.removeFileByPath(pdfFile.path);
      reply.status(400).send({
        success: false,
        message: "Only PDF files are allowed",
      });
      return;
    }

    // Send email with PDF content
    await sendPdfToEmail(email, pdfFile);

    // Clean up
    FileService.removeFileByPath(pdfFile.path);

    reply.status(200).send({
      success: true,
      message: "Email with PDF content sent successfully",
    });
  } catch (error: any) {
    // Clean up file if error occurs
    const pdfFile = (request as any).file;
    if (pdfFile) FileService.removeFileByPath(pdfFile.path);

    reply.status(500).send({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
};