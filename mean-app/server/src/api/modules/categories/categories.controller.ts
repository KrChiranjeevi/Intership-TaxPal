// import type { Response } from "express";
// import type { AuthRequest } from "../../middlewares/auth.middleware.js";
// import * as categoryService from "./categories.service.js";
// import { CategorySchema } from "./categories.model.js";

// // ✅ Create a new category
// export async function createCategory(req: AuthRequest, res: Response) {
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     // Validate request body using Zod schema
//     const parseResult = CategorySchema.safeParse(req.body);
//     if (!parseResult.success)
//       return res.status(400).json({
//         success: false,
//         message: parseResult.error.issues?.[0]?.message || 'Invalid input',
//       });

//     const category = await categoryService.createCategory(userId, parseResult.data);
//     res.status(201).json({ success: true, data: category });
//   } catch (err: any) {
//     console.error("Error creating category:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// // ✅ Get all categories for the logged-in user
// export async function getCategories(req: AuthRequest, res: Response) {
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     const categories = await categoryService.getCategories(userId);
//     res.status(200).json({ success: true, data: categories });
//   } catch (err: any) {
//     console.error("Error fetching categories:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// // ✅ Update an existing category
// export async function updateCategory(req: AuthRequest, res: Response) {
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     const id = req.params.id;
//     if (!id)
//       return res
//         .status(400)
//         .json({ success: false, message: "Category ID is required" });

//     const updated = await categoryService.updateCategory(id, userId, req.body);

//     if (!updated.count)
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found or not authorized" });

//     res.status(200).json({ success: true, message: "Category updated successfully" });
//   } catch (err: any) {
//     console.error("Error updating category:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// // ✅ Delete a category
// export async function deleteCategory(req: AuthRequest, res: Response) {
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     const id = req.params.id;
//     if (!id)
//       return res
//         .status(400)
//         .json({ success: false, message: "Category ID is required" });

//     const deleted = await categoryService.deleteCategory(id, userId);

//     if (!deleted.count)
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found or not authorized" });

//     res.status(200).json({ success: true, message: "Category deleted successfully" });
//   } catch (err: any) {
//     console.error("Error deleting category:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }
