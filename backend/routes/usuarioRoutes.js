import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { 
  listarUsuarios, 
  crearUsuario, 
  editarUsuario, 
  toggleActivo,
  resetearPassword
} from "../controllers/usuarioController.js";

const router = Router();

router.get("/", verificarToken, listarUsuarios);
router.post("/", verificarToken, crearUsuario);
router.put("/:id", verificarToken, editarUsuario);
router.put("/:id/toggle-activo", verificarToken, toggleActivo);
router.put("/:id/resetear-password", verificarToken, resetearPassword);

export default router;
