/**
 * Componente de paginación reutilizable.
 *
 * Props:
 *   page        {number}   - Página actual (1-indexed)
 *   totalPages  {number}   - Total de páginas
 *   total       {number}   - Total de registros
 *   limit       {number}   - Registros por página
 *   onPageChange {fn}      - Callback recibe el número de página nueva
 */
export default function Paginacion({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;

  const desde = (page - 1) * limit + 1;
  const hasta  = Math.min(page * limit, total);

  // Genera los números de página visibles con "..." cuando hay muchas páginas
  const generarPaginas = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const paginas = [];
    if (page <= 4) {
      paginas.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      paginas.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      paginas.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return paginas;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center relative mt-4 mb-2 gap-4 px-1 w-full">
      {/* Texto informativo */}
      <div className="sm:absolute sm:left-1 sm:top-1/2 sm:-translate-y-1/2 order-2 sm:order-none">
        <p className="text-xs text-gray-500">
          Mostrando{" "}
          <span className="font-semibold text-gray-700">{desde}–{hasta}</span>{" "}
          de{" "}
          <span className="font-semibold text-gray-700">{total}</span>
        </p>
      </div>

      {/* Controles en el centro */}
      <div className="flex items-center gap-1 order-1 sm:order-none z-10 w-full sm:w-auto overflow-x-auto justify-center pb-2 sm:pb-0">
        {/* Anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ←
        </button>

        {/* Números de página */}
        {generarPaginas().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                p === page
                  ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Siguiente */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          →
        </button>
      </div>
    </div>
  );
}
