import { userApi, type OperatorSummary } from '@/api/auth-api';
import { assigneeOptions } from '@/domain/assignment';

import { useLoader } from './use-loader';

type OperatorSelectProps = {
  value: string;
  onChange: (value: string) => void;
  /** Texto de la opción vacía, por ejemplo "Sin asignar". */
  emptyLabel: string;
  autoFocus?: boolean;
};

/**
 * Lista de operadores activos para elegir al responsable de una incidencia. Si no hay ninguno disponible lo dice, en
 * lugar de dejar asignar a un nombre inventado.
 */
export function OperatorSelect({ value, onChange, emptyLabel, autoFocus }: OperatorSelectProps) {
  const operators = useLoader<OperatorSummary[]>(() => userApi.operators(), 'operators');
  const options = assigneeOptions(operators.data ?? [], value || null);
  const noneAvailable = operators.data !== null && operators.data.length === 0;

  return (
    <>
      <select
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={operators.loading && !operators.data}
        autoFocus={autoFocus}
      >
        <option value="">{operators.loading && !operators.data ? 'Cargando operadores…' : emptyLabel}</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {operators.error ? <span className="error">No se pudo cargar la lista de operadores: {operators.error}</span> : null}
      {noneAvailable ? <span className="error">No hay operadores activos disponibles. Pide al administrador que registre uno.</span> : null}
    </>
  );
}
