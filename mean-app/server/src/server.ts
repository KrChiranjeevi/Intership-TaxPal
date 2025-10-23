// import dotenv from 'dotenv';
// import app from './app.js';  
// import authRoutes from "./routes/authRoutes.js"; // Adjust path as needed
// import express from "express";
// import cors from "cors";


// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/api/auth", authRoutes); // Correct endpoint for signup
// // Other routes will go here
// app.get("/", (req, res) => {
//   res.json({ success: true, message: "Server is up!" });
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// dotenv.config();

// const PORT = process.env.PORT || 5000;


// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });




// // Add this to the top of src/server.ts
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   // Application specific logging, throwing an error, or other logic here
//   process.exit(1);
// });

// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   // Application specific logging, throwing an error, or other logic here
//   process.exit(1);
// });

// // ... rest of your imports and server code (e.g., import express from 'express';)


// import dotenv from 'dotenv';
// import express from 'express';
// import cors from 'cors';
// import transactionRoutes from "./api/modules/transactions/transaction.routes.js";


// // Import your application routes
// import authRoutes from "./routes/authRoutes.js";

// // Load environment variables from .env file
// dotenv.config();

// // Initialize the Express application
// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware setup
// app.use(cors());
// app.use(express.json());

// // API route handlers
// app.use("/api/auth", authRoutes);

// app.use("/api/transactions", transactionRoutes);


// // A simple test route
// app.get("/", (req, res) => {
//   res.json({ success: true, message: "Server is up!" });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });

// // Global error handling for unhandled promises and exceptions
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   process.exit(1);
// });







import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./api/modules/transactions/transaction.routes.js";
// import financialReportRoutes from "./api/modules/FinancialReport/FinancialReport.routes.js";
import financialReportRoutes from "./api/modules/FinancialReport/FinancialReport.routes.js"; // 👈 Correct Path



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Server is up!" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});