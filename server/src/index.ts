import { app } from "./app";
import { prisma } from "./db";
import { config } from "./config";

const server = app.listen(config.port, () => console.log(`FitSaathi local API ready at http://localhost:${config.port}`));

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
