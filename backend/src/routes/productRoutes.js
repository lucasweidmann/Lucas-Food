import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
} from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id/active", toggleProductStatus);

export default router;
