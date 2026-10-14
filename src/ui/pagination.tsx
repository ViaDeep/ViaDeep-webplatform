type PaginationProps = {
  page: number;
  size: number;
  total: number;
  noun: string;
  sizes?: number[];
  onPage: (page: number) => void;
  onSize?: (size: number) => void;
};

/** Pie de tabla de los mockups: "Mostrando 1 - 8 de 1,248 …", tamaño de página y páginas. */
export function Pagination({ page, size, total, noun, sizes, onPage, onSize }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / size));
  const first = total === 0 ? 0 : page * size + 1;
  const last = Math.min(total, (page + 1) * size);
  const numbers = pageNumbers(page, pages);
  return (
    <div className="table-foot">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span>
          Mostrando <strong>{first.toLocaleString('es-PE')} - {last.toLocaleString('es-PE')}</strong> de <strong>{total.toLocaleString('es-PE')}</strong> {noun}
        </span>
        {sizes && onSize ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
            <span className="mono" style={{ fontSize: 11 }}>
              Mostrar:
            </span>
            <span className="segmented">
              {sizes.map((value) => (
                <button key={value} className={value === size ? 'on' : ''} onClick={() => onSize(value)}>
                  {value}
                </button>
              ))}
            </span>
          </span>
        ) : null}
      </div>
      <div className="pager">
        <button className="edge" disabled={page === 0} onClick={() => onPage(page - 1)}>
          ‹ Anterior
        </button>
        {numbers.map((value, index) =>
          value === null ? (
            <span key={`gap-${index}`}>…</span>
          ) : (
            <button key={value} className={value === page ? 'current' : ''} onClick={() => onPage(value)}>
              {value + 1}
            </button>
          ),
        )}
        <button className="edge" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Siguiente ›
        </button>
      </div>
    </div>
  );
}

/** Páginas visibles: las tres primeras alrededor de la actual y la última, con "…" en los huecos. */
// eslint-disable-next-line react/only-export-components -- utilidad pequeña que solo usa este componente y sus pruebas
export function pageNumbers(page: number, pages: number): (number | null)[] {
  const wanted = new Set([0, pages - 1, page - 1, page, page + 1, ...(page < 3 ? [1, 2] : [])]);
  const sorted = [...wanted].filter((value) => value >= 0 && value < pages).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1]! > 1) result.push(null);
    result.push(value);
  });
  return result;
}
