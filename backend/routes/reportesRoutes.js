import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { dashboard, dashboardPersonalizado } from "../controllers/reportesController.js";

const router = Router();

router.get("/", verificarToken, dashboard);
router.get("/dashboard-personalizado", verificarToken, dashboardPersonalizado);

export default router;

