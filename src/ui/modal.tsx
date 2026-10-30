import { useEffect, type ReactNode } from 'react';

import { Icon } from './badges';

type ModalProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

/** Ventana modal de los mockups (Asignar incidencia, Nuevo usuario). Se cierra con Escape o con la X. */
export function Modal({ title, subtitle, icon, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          {icon}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{title}</div>
            {subtitle ? <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</div> : null}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}
