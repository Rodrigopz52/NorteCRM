const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;

const esPosInt = (str) => /^\d+$/.test(str);

/**
 * @param {object} query
 * @param {number} [limitePorDefecto=10]
 * @returns {{ page, limit, skip, take }}
 */
export function parsearPaginacion(query, limitePorDefecto = LIMITE_POR_DEFECTO) {
  const paginaRaw = String(query.page  ?? "").trim();
  const limiteRaw = String(query.limit ?? "").trim();

  if (paginaRaw !== "" && !esPosInt(paginaRaw)) {
    const err = new Error("El parámetro 'page' debe ser un entero positivo.");
    err.status = 400;
    throw err;
  }
  if (limiteRaw !== "" && !esPosInt(limiteRaw)) {
    const err = new Error("El parámetro 'limit' debe ser un entero positivo.");
    err.status = 400;
    throw err;
  }

  const page  = paginaRaw !== "" ? Math.max(1, parseInt(paginaRaw, 10)) : 1;
  const limit = limiteRaw !== ""
    ? Math.min(Math.max(1, parseInt(limiteRaw, 10)), LIMITE_MAXIMO)
    : limitePorDefecto;

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

/**
 * @param {Array}  data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {{ data, meta: { page, limit, total, totalPaginas } }}
 */
export function construirRespuestaPaginada(data, total, page, limit) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limit))
    }
  };
}
