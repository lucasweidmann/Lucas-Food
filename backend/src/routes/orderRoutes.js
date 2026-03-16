import { Router } from "express";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = Router();

router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.get("/", getOrders);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;
