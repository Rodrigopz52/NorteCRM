-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Oportunidad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "valor" REAL,
    "etapa" TEXT NOT NULL DEFAULT 'CONTACTO',
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Oportunidad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Oportunidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Oportunidad" ("clienteId", "creadoEn", "etapa", "id", "titulo", "usuarioId", "valor") SELECT "clienteId", "creadoEn", "etapa", "id", "titulo", "usuarioId", "valor" FROM "Oportunidad";
DROP TABLE "Oportunidad";
ALTER TABLE "new_Oportunidad" RENAME TO "Oportunidad";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
