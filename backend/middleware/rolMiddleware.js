export const soloGerente = (req, res, next) => {
  if (req.usuario.rol !== "GERENTE") {
    return res.status(403).json({ error: "Acceso solo para Gerentes" });
  }
  next();
};

export const soloVendedor = (req, res, next) => {
  if (req.usuario.rol !== "VENDEDOR") {
    return res.status(403).json({ error: "Acceso solo para Vendedores" });
  }
  next();
};
