import fp from "fastify-plugin";
import { Server } from "socket.io";

// Export io instance so it can be imported in utils
export let io: Server;

export default fp(async (fastify) => {
  // Get allowed origins from CORS config or use default
  const allowedOrigins = ["*", "http://103.161.8.25:3000"];

  io = new Server(fastify.server, {
    path: "/socket.io",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    fastify.log.info(`Socket connected: ${socket.id}`);

    socket.on("join", (userId: string) => {
      socket.join(userId);
      fastify.log.info(`User with ID: ${userId} joined room: ${userId}`);
    });

    // Keep backward compatibility with join_room
    socket.on("join_room", ({ roomId, userType }) => {
      socket.join(roomId);

      if (userType === "admin") {
        fastify.log.info(`Admin joined room: ${roomId}`);
      } else {
        fastify.log.info(`User joined their room: ${roomId}`);
      }
    });

    // Example: receive a message from client
    socket.on("message", (data) => {
      fastify.log.info({ data }, "Message from client");
    });

    socket.on("disconnect", () => {
      fastify.log.info(`Socket disconnected: ${socket.id}`);
    });
  });

  fastify.decorate("io", io);
});

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
}
