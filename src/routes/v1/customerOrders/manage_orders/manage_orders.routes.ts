import { FastifyInstance } from "fastify";
 
import {
  uploadBarcodeLabel,
  updateMultiplePaymentStatus,
  updateMultipleOrderStatuses,
  updateOrderPriority,
  uploadInvoice,
  uploadInvoiceOnly,
  sendInvoiceToCustomer,
} from "./manage_orders.controllers";
import { verifyUser } from "../../../../middleware/auth.middleware";
import { upload } from "../../../../config/storage.config";

const manageOrdersRoutes = (fastify: FastifyInstance) => {
  // Update multiple orders payment status
  fastify.patch(
    "/payment-status",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateMultiplePaymentStatus
  );

  // Update multiple orders status
  fastify.patch(
    "/status/multiple/update",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateMultipleOrderStatuses
  );

  // Upload barcode label with image
  fastify.post(
    "/upload-barcode-label/:orderId",
    {
      preHandler: [
        verifyUser("ADMIN", "PARTNER"),
        upload.fields([{ name: "image", maxCount: 1 }])
      ]
    },
    uploadBarcodeLabel
  );

  // এর উদ্দেশ্য হচ্ছে। একটা অর্ডার কি আরজেন্ট ডেলিভেরি দিতে হবে নাকি নরমাল প্রসেজে যাবে তা ঠিক করা।
  // Purpose: To determine whether an order should be delivered urgently or go through normal process.
  fastify.patch(
    "/update/priority/:id",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    updateOrderPriority
  );

  // এদের উদ্দেশ্য ক্লিয়ার না।
  // Purpose unclear.
  fastify.post(
    "/upload-invoice/:orderId",
    {
      preHandler: [
        verifyUser("ADMIN", "PARTNER"),
        upload.fields([{ name: "invoice", maxCount: 1 }])
      ]
    },
    uploadInvoice
  );

  fastify.post(
    "/upload-invoice-only/:orderId",
    {
      preHandler: [
        verifyUser("ADMIN", "PARTNER"),
        upload.fields([{ name: "invoice", maxCount: 1 }])
      ]
    },
    uploadInvoiceOnly
  );

  // Send invoice to customer
  fastify.post(
    "/send-invoice/:orderId",
    {
      preHandler: verifyUser("ADMIN", "PARTNER")
    },
    sendInvoiceToCustomer
  );
};

export default manageOrdersRoutes;