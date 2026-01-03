import exercises from "./exercises.data";
import fs from "fs";
import { sendPdfToEmail } from "../../../utils/email.config";
 

export const getAllexercises = async (request, reply) => {
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

export const sendExercisesEmail = async (request, reply) => {

  try {
    const { email } = request.body;
    const pdfFile = request.file;

    console.log(email, pdfFile)

    if (!email || !pdfFile) {
      if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
      return reply.status(400).send({
        success: false,
        message: 'Email and PDF file are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
      return reply.status(400).send({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (pdfFile.mimetype !== 'application/pdf') {
      if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
      return reply.status(400).send({
        success: false,
        message: 'Only PDF files are allowed',
      });
    }

    sendPdfToEmail(email, pdfFile);

    if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);

    return reply.status(200).send({
      success: true,
      message: 'Foot exercise program sent successfully to your email',
    });
  } catch (error: any) {
    if (request.file && fs.existsSync(request.file.path)) fs.unlinkSync(request.file.path);
    console.error('Error in sendExercisesEmail:', error);
    return reply.status(500).send({
      success: false,
      message: error.message || 'Failed to send exercise program email',
    });
  }
};