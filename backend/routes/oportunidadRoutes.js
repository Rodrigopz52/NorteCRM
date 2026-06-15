import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { listarOportunidades, crearOportunidad, editarOportunidad, toggleActivoOportunidad, cambiarEtapa } from "../controllers/oportunidadController.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

router.get("/", verificarToken, listarOportunidades);
router.post("/", verificarToken, upload.single("imagen"), crearOportunidad);
router.put("/:id", verificarToken, upload.single("imagen"), editarOportunidad);
router.put("/:id/toggle-activo", verificarToken, toggleActivoOportunidad);
router.put("/:id/etapa", verificarToken, cambiarEtapa);

export default router;

