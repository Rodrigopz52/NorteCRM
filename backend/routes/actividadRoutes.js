import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { 
  obtenerActividades, 
  crearActividad, 
  editarActividad,
  completarActividad, 
  eliminarActividad 
} from "../controllers/actividadController.js";

const router = Router();

router.get("/", verificarToken, obtenerActividades);
router.post("/", verificarToken, crearActividad);
router.put("/:id", verificarToken, editarActividad);
router.put("/:id/completar", verificarToken, completarActividad);
router.delete("/:id", verificarToken, eliminarActividad);

export default router;
