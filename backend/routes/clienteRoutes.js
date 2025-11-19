import { Router } from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { listarClientes, crearCliente, editarCliente, eliminarCliente } from "../controllers/clienteController.js";


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes en el CRM
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida correctamente
 */
router.get("/", verificarToken, listarClientes);

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               empresa: { type: string }
 *               telefono: { type: string }
 *               email: { type: string }
 *               notas: { type: string }
 *     responses:
 *       200:
 *         description: Cliente creado correctamente
 */
router.post("/", verificarToken, crearCliente);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Editar un cliente existente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               empresa:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 */
router.put("/:id", verificarToken, editarCliente);


/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Eliminar un cliente (solo gerente)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Cliente eliminado correctamente
 */
router.delete("/:id", verificarToken, eliminarCliente);

export default router;
