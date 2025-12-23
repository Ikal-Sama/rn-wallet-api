import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import { arcjetMiddleware } from "./middlewares/arcjet.middleware.js";
dotenv.config();
const PORT = process.env.PORT || 5001;

import transactionRoutes from "./routes/transactions.route.js";

const app = express();

// middlewares
app.use(express.json());

// Only use Arcjet in production
if (process.env.NODE_ENV === "production") {
  app.use(arcjetMiddleware);
  console.log("Arcjet protection enabled");
} else {
  console.log("Arcjet protection disabled (development mode)");
}

app.use("/api/transactions", transactionRoutes);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
  });
});
