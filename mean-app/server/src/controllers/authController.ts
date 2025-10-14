// import type { Request, Response } from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export const signup = async (req: Request, res: Response) => {
//   try {
//     const { username, email, password, name, country, incomeBracket } = req.body;

//     // Check if user already exists
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Hash password before saving
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await prisma.user.create({
//       data: {
//         username,
//         email,
//         password: hashedPassword,
//         name,
//         country,
//         incomeBracket,
//       },
//     });

//     res.status(201).json({ message: "User registered successfully", newUser });
//   } catch (error) {
//     console.error("Signup Error:", error);
//     res.status(500).json({ message: "Server error while creating account" });
//   }
// };

// export const login = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Generate a JWT token here and send it back to the client
//     const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, {
//       expiresIn: "1h",
//     });

//     res.status(200).json({ message: "Login successful", token, user });
//   } catch (error) {
//   console.error("Login Error:", error);
//   if (error instanceof Error) {
//     res.status(500).json({ message: "Login failed", error: error.message });
//   } else {
//     res.status(500).json({ message: "Login failed", error: "An unknown error occurred" });
//   }
// }
// };





// server/src/controllers/authController.ts

import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password, name, country, incomeBracket } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, name, country, incomeBracket }
    });
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error while creating account", error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: (error as Error).message });
  }
};