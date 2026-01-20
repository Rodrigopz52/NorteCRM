import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { listarOportunidades, crearOportunidad, editarOportunidad, eliminarOportunidad, cambiarEtapa } from "../controllers/oportunidadController.js";

const router = Router();

router.get("/", verificarToken, listarOportunidades);
router.post("/", verificarToken, crearOportunidad);
router.put("/:id", verificarToken, editarOportunidad);
router.delete("/:id", verificarToken, eliminarOportunidad);
router.put("/:id/etapa", verificarToken, cambiarEtapa);

export default router;