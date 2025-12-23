import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import { rateLimitMiddleware } from "./middlewares/ratelimit.middleware.js";
dotenv.config();
const PORT = process.env.PORT || 5001;

import transactionRoutes from "./routes/transactions.route.js";
import job from "./config/cron.js";

const app = express();

if (process.env.NODE_ENV === "production") job.start();

// middlewares
// Trust proxy - required for Render deployment to get correct client IP
app.set("trust proxy", true);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

// Apply rate limiting to all API routes
app.use("/api/", rateLimitMiddleware);

app.use("/api/transactions", transactionRoutes);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
  });
});
