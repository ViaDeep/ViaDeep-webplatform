/** Aviso interno de que llegaron reportes nuevos: las pantallas con datos en vivo vuelven a pedir lo suyo. */
const EVENT = 'viadeep:data-changed';

export function announceDataChanged(): void {
  window.dispatchEvent(new Event(EVENT));
}

export function onDataChanged(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
