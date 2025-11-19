-- CreateTable
CREATE TABLE "Actividad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaVencimiento" DATETIME NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fechaCompletada" DATETIME,
    "oportunidadId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Actividad_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "Oportunidad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Actividad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
