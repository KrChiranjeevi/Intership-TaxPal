import dotenv from 'dotenv';
import app from './app.js';  

dotenv.config();

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});




// Add this to the top of src/server.ts
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

// ... rest of your imports and server code (e.g., import express from 'express';)