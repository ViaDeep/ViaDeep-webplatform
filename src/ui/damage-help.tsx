import { useState, type MouseEvent } from 'react';

import { DAMAGE_DRAWINGS, DRAWING_SIZE, ROAD } from '@/domain/damage-drawing';
import { DAMAGE_INFO } from '@/domain/damage-info';
import { TYPE_LABELS, type IncidentType } from '@/domain/incident';

import { Icon } from './badges';
import { Modal } from './modal';

/** Tramo de pista visto desde arriba con el daño marcado en ámbar. */
export function DamageDrawing({ type }: { type: IncidentType }) {
  const drawing = DAMAGE_DRAWINGS[type];
  const { highlight } = drawing;
  return (
    <svg
      viewBox={`0 0 ${DRAWING_SIZE.width} ${DRAWING_SIZE.height}`}
      role="img"
      aria-label={`Dibujo de referencia: ${TYPE_LABELS[type]}`}
      className="damage-drawing"
    >
      <rect width={DRAWING_SIZE.width} height={DRAWING_SIZE.height} fill={ROAD.shoulder} />
      <rect {...ROAD.asphaltRect} fill={ROAD.asphalt} />
      {ROAD.edgeLines.map((d) => (
        <path key={d} d={d} stroke={ROAD.paint} strokeWidth={3} />
      ))}
      <path d={ROAD.centerLine} stroke={ROAD.paint} strokeWidth={3} strokeDasharray="22 14" />
      {ROAD.arrows.map((d) => (
        <path key={d} d={d} stroke={ROAD.paint} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      ))}
      {drawing.ellipses.map((e) => (
        <ellipse key={`${e.cx}-${e.cy}-${e.rx}`} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={e.fill} stroke={e.stroke} strokeWidth={e.stroke ? 3 : 0} />
      ))}
      {drawing.cracks.map((d) => (
        <path key={d} d={d} stroke={ROAD.crack} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {highlight.kind === 'rect' ? (
        <rect x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx={6} fill="none" stroke={ROAD.mark} strokeWidth={2.5} strokeDasharray="7 5" />
      ) : (
        <ellipse cx={highlight.cx} cy={highlight.cy} rx={highlight.rx} ry={highlight.ry} fill="none" stroke={ROAD.mark} strokeWidth={2.5} strokeDasharray="7 5" />
      )}
    </svg>
  );
}

export function DamageHelpModal({ type, onClose }: { type: IncidentType; onClose: () => void }) {
  const info = DAMAGE_INFO[type];
  return (
    <Modal
      title={TYPE_LABELS[type]}
      subtitle={`Clase ${type} del modelo LMD-YOLO`}
      icon={<Icon name="help" style={{ color: 'var(--primary)', fontSize: 24 }} />}
      onClose={onClose}
      footer={
        <button className="btn btn-navy" onClick={onClose}>
          Entendido
        </button>
      }
    >
      <p className="damage-summary">{info.summary}</p>
      <figure className="damage-figure">
        <DamageDrawing type={type} />
        <figcaption>Dibujo de referencia: pista vista desde arriba, los vehículos avanzan hacia la derecha. El daño está marcado en ámbar.</figcaption>
      </figure>
      <div>
        <div className="modal-label">
          <Icon name="visibility" size={18} /> Cómo reconocerlo en la foto
        </div>
        <ul className="damage-list">
          {info.howToSpot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="modal-label">
          <Icon name="construction" size={18} /> Por qué aparece
        </div>
        <p className="damage-cause">{info.cause}</p>
      </div>
    </Modal>
  );
}

/** Ícono de información junto al nombre de un tipo de daño; al presionarlo explica qué significa. */
export function DamageHelpButton({ type }: { type: IncidentType }) {
  const [open, setOpen] = useState(false);
  const show = (event: MouseEvent) => {
    // Dentro de un <label> (filtros del mapa) el clic no debe marcar la casilla.
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };
  return (
    <>
      <button type="button" className="damage-help-btn" onClick={show} aria-label={`¿Qué es ${TYPE_LABELS[type].toLowerCase()}?`} title="¿Qué significa?">
        <Icon name="info" size={16} />
      </button>
      {open ? <DamageHelpModal type={type} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** Nombre del tipo de daño con su ícono de ayuda. */
export function DamageTypeLabel({ type }: { type: IncidentType }) {
  return (
    <span className="damage-type-label">
      {TYPE_LABELS[type]}
      <DamageHelpButton type={type} />
    </span>
  );
}
