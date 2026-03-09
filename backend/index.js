import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import oportunidadRoutes from "./routes/oportunidadRoutes.js";
import actividadRoutes from "./routes/actividadRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import propiedadRoutes from "./routes/propiedadRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";
import { swaggerSpec, swaggerUiMiddleware, swaggerUiSetup } from "./swagger.js";
import reportesRoutes from "./routes/reportesRoutes.js";

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/.*/, cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/clientes", clienteRoutes);
app.use("/oportunidades", oportunidadRoutes);
app.use("/propiedades", propiedadRoutes);
app.use("/actividades", actividadRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/tareas", tareaRoutes);
app.use("/docs", swaggerUiMiddleware, swaggerUiSetup);
app.use("/reportes", reportesRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "API CRM funcionando" });
});

app.listen(3000, () => {
  console.log("Servidor backend escuchando en http://localhost:3000");
});