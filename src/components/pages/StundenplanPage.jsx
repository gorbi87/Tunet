import { memo, useMemo } from 'react';

// ── Stundenplan-Daten ────────────────────────────────────────────────────

const STUNDEN = [
  { nr: 1, von: '07:51', bis: '08:40' },
  { nr: 2, von: '08:45', bis: '09:35' },
  { nr: 'P1', von: '09:35', bis: '09:55', isPause: true },
  { nr: 3, von: '09:55', bis: '10:40' },
  { nr: 4, von: '10:45', bis: '11:30' },
  { nr: 'P2', von: '11:30', bis: '11:45', isPause: true },
  { nr: 5, von: '11:45', bis: '12:30' },
];

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

// Mo=0, Di=1, Mi=2, Do=3, Fr=4
const FAECHER = {
  // 1. Stunde
  '1-0': 'Lernzeit', '1-1': 'Lernzeit', '1-2': 'Lernzeit', '1-3': 'Lernzeit', '1-4': 'Religion',
  // 2. Stunde
  '2-0': 'Lernzeit', '2-1': 'Musik', '2-2': 'Sport', '2-3': 'Lernzeit', '2-4': 'Lernzeit',
  // 3. Stunde
  '3-0': 'Lernzeit', '3-1': 'Lernzeit', '3-2': 'Sachunterricht', '3-3': 'Sachunterricht', '3-4': 'Sport',
  // 4. Stunde
  '4-0': 'Kunst', '4-1': 'Lernzeit', '4-2': 'Religion', '4-3': 'Lernzeit', '4-4': 'SichBasis',
  // 5. Stunde (nur Dienstag)
  '5-0': null, '5-1': 'Kunst', '5-2': null, '5-3': null, '5-4': null,
};

const FACH_META = {
  Lernzeit:       { emoji: '📚', label: 'Lernzeit',       color: '#6366f1', bg: 'rgba(99,102,241,0.13)'  },
  Musik:          { emoji: '🎵', label: 'Musik',           color: '#a855f7', bg: 'rgba(168,85,247,0.13)'  },
  Sport:          { emoji: '⚽', label: 'Sport',           color: '#22c55e', bg: 'rgba(34,197,94,0.13)'   },
  Sachunterricht: { emoji: '🔭', label: 'Sachunterricht',  color: '#f59e0b', bg: 'rgba(245,158,11,0.13)'  },
  Religion:       { emoji: '✝️', label: 'Religion',        color: '#f43f5e', bg: 'rgba(244,63,94,0.13)'   },
  Kunst:          { emoji: '🎨', label: 'Kunst',           color: '#ec4899', bg: 'rgba(236,72,153,0.13)'  },
  SichBasis:      { emoji: '🤝', label: 'Sichere Basis',   color: '#14b8a6', bg: 'rgba(20,184,166,0.13)'  },
};

// ── Hilfsfunktionen ──────────────────────────────────────────────────────

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function useNow() {
  const now = new Date();
  return {
    day:     now.getDay(),        // 0=So, 1=Mo … 5=Fr, 6=Sa
    minutes: now.getHours() * 60 + now.getMinutes(),
  };
}

function isStundeActive(stunde, minutes) {
  return minutes >= timeToMinutes(stunde.von) && minutes < timeToMinutes(stunde.bis);
}

// ── Sub-Komponenten ──────────────────────────────────────────────────────

const FachCell = memo(function FachCell({ fach, isToday, isActive }) {
  if (!fach) return <td className="sp-cell sp-empty" />;
  const meta = FACH_META[fach];
  if (!meta) return <td className="sp-cell"><span className="sp-fach-label">{fach}</span></td>;

  return (
    <td
      className={`sp-cell${isToday ? ' sp-today' : ''}${isActive ? ' sp-active' : ''}`}
      style={{ '--fach-color': meta.color, '--fach-bg': meta.bg }}
    >
      <div className="sp-fach">
        <span className="sp-fach-emoji">{meta.emoji}</span>
        <span className="sp-fach-label">{meta.label}</span>
        {isActive && <span className="sp-live-dot" aria-hidden="true" />}
      </div>
    </td>
  );
});

const PauseRow = memo(function PauseRow({ stunde, todayColIdx }) {
  return (
    <tr className="sp-pause-row">
      <td className="sp-time-cell">
        <span className="sp-pause-badge">Pause</span>
        <span className="sp-time-range">{stunde.von}–{stunde.bis}</span>
      </td>
      {TAGE.map((_, di) => (
        <td
          key={di}
          className={`sp-pause-cell${di === todayColIdx ? ' sp-today' : ''}`}
        />
      ))}
    </tr>
  );
});

// ── Haupt-Komponente ─────────────────────────────────────────────────────

function StundenplanPage() {
  const { day, minutes } = useNow();
  // day: 1=Mo,2=Di,3=Mi,4=Do,5=Fr → colIdx 0–4
  const todayColIdx = useMemo(() => (day >= 1 && day <= 5 ? day - 1 : -1), [day]);

  return (
    <div className="sp-root">
      <div className="sp-header">
        <h2 className="sp-title">Stundenplan</h2>
        <p className="sp-subtitle">Grundschule · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="sp-table-wrap">
        <table className="sp-table">
          <thead>
            <tr>
              <th className="sp-th sp-th-time">Zeit</th>
              {TAGE.map((tag, di) => (
                <th
                  key={tag}
                  className={`sp-th${di === todayColIdx ? ' sp-th-today' : ''}`}
                >
                  <span className="sp-day-full">{tag}</span>
                  <span className="sp-day-short">{tag.slice(0, 2)}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {STUNDEN.map((stunde) => {
              if (stunde.isPause) {
                return <PauseRow key={stunde.nr} stunde={stunde} todayColIdx={todayColIdx} />;
              }

              const isRowActive = isStundeActive(stunde, minutes);

              return (
                <tr key={stunde.nr} className={`sp-row${isRowActive ? ' sp-row-active' : ''}`}>
                  <td className="sp-time-cell">
                    <span className="sp-stunde-nr">{stunde.nr}.</span>
                    <span className="sp-time-von">{stunde.von}</span>
                    <span className="sp-time-sep">–</span>
                    <span className="sp-time-bis">{stunde.bis}</span>
                  </td>
                  {TAGE.map((_, di) => {
                    const key = `${stunde.nr}-${di}`;
                    const fach = FAECHER[key] ?? null;
                    const isToday = di === todayColIdx;
                    const isActive = isToday && isRowActive;
                    return (
                      <FachCell
                        key={di}
                        fach={fach}
                        isToday={isToday}
                        isActive={isActive}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legende */}
      <div className="sp-legend">
        {Object.entries(FACH_META).map(([key, meta]) => (
          <div
            key={key}
            className="sp-legend-item"
            style={{ '--fach-color': meta.color, '--fach-bg': meta.bg }}
          >
            <span className="sp-legend-dot" />
            <span className="sp-legend-label">{meta.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .sp-root {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .sp-header { display: flex; flex-direction: column; gap: 0.25rem; }
        .sp-title {
          font-size: 1.5rem;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-primary);
        }
        .sp-subtitle { font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.05em; }

        /* Table wrapper */
        .sp-table-wrap { overflow-x: auto; border-radius: 1.25rem; }
        .sp-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 3px;
          table-layout: fixed;
        }

        /* Header */
        .sp-th {
          padding: 0.6rem 0.5rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-align: center;
        }
        .sp-th-time { width: 130px; text-align: left; }
        .sp-th-today {
          color: var(--accent-color, #6366f1);
          background: var(--accent-bg, rgba(99,102,241,0.08));
          border-radius: 0.75rem 0.75rem 0 0;
        }

        /* Responsive day names */
        .sp-day-short { display: none; }
        @media (max-width: 540px) {
          .sp-day-full { display: none; }
          .sp-day-short { display: inline; }
          .sp-th-time { width: 52px; }
          .sp-time-cell { white-space: normal; padding: 0.4rem 0.3rem; }
          .sp-stunde-nr { display: block; margin-right: 0; }
          .sp-time-sep { display: none; }
          .sp-time-von, .sp-time-bis { display: block; font-size: 0.55rem; line-height: 1.3; }
        }

        /* Time cell */
        .sp-time-cell {
          padding: 0.5rem 0.6rem;
          text-align: left;
          vertical-align: middle;
          white-space: nowrap;
        }
        .sp-stunde-nr {
          display: inline;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-right: 0.3rem;
        }
        .sp-time-von, .sp-time-sep, .sp-time-bis {
          display: inline;
          font-size: 0.62rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        /* Subject cells */
        .sp-cell {
          padding: 0.35rem;
          vertical-align: middle;
          border-radius: 0.75rem;
          transition: background 0.2s;
        }
        .sp-cell.sp-today {
          background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
        }
        .sp-cell.sp-active {
          background: var(--fach-bg, rgba(99,102,241,0.13));
          outline: 1.5px solid color-mix(in srgb, var(--fach-color, #6366f1) 50%, transparent);
        }
        .sp-empty { background: transparent; }

        /* Fach pill */
        .sp-fach {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--fach-bg, var(--glass-bg));
          border-radius: 0.6rem;
          padding: 0.45rem 0.5rem;
          min-height: 2.4rem;
        }
        .sp-cell.sp-active .sp-fach {
          background: var(--fach-bg, rgba(99,102,241,0.13));
        }
        .sp-fach-emoji { font-size: 0.95rem; flex-shrink: 0; line-height: 1; }
        .sp-fach-label {
          font-size: 0.62rem;
          font-weight: 600;
          color: var(--fach-color, var(--text-secondary));
          letter-spacing: 0.02em;
          line-height: 1.2;
          flex: 1;
        }
        @media (max-width: 540px) {
          .sp-fach-label { display: none; }
          .sp-fach { justify-content: center; padding: 0.4rem; min-height: 2rem; }
          .sp-fach-emoji { font-size: 1.1rem; }
        }

        /* Live dot */
        .sp-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--fach-color, #6366f1);
          flex-shrink: 0;
          animation: sp-pulse 1.4s ease-in-out infinite;
        }
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        /* Row highlight */
        .sp-row { transition: background 0.2s; }
        .sp-row-active > .sp-time-cell .sp-stunde-nr {
          color: var(--accent-color, #6366f1);
        }

        /* Pause row */
        .sp-pause-row { height: 1.5rem; }
        .sp-pause-row .sp-time-cell { padding: 0.15rem 0.4rem; }
        .sp-pause-badge {
          display: inline-block;
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: var(--glass-bg);
          border-radius: 999px;
          padding: 0.1rem 0.4rem;
        }
        .sp-pause-cell {
          background: transparent;
        }
        .sp-pause-cell.sp-today {
          background: color-mix(in srgb, var(--glass-bg) 40%, transparent);
        }

        /* Legend — nur auf Mobile (Desktop: Fachname steht in der Zelle) */
        .sp-legend {
          display: none;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        @media (max-width: 540px) {
          .sp-legend { display: flex; }
        }
        .sp-legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--fach-bg);
          border-radius: 999px;
          padding: 0.25rem 0.6rem;
        }
        .sp-legend-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--fach-color);
          flex-shrink: 0;
        }
        .sp-legend-label {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--fach-color);
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}

export default memo(StundenplanPage);
