import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { dashboard, dashboardPersonalizado, dashboardGerencial, exportarExcelDetallado } from "../controllers/reportesController.js";

const router = Router();

router.get("/", verificarToken, dashboard);
router.get("/dashboard-personalizado", verificarToken, dashboardPersonalizado);
router.get("/dashboard-gerencial", verificarToken, dashboardGerencial);
router.get("/excel", verificarToken, exportarExcelDetallado);

export default router;
