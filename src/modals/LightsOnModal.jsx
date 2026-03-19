import { useHomeAssistant } from '../contexts';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { X, Lightbulb, Power } from '../icons';
import { callService } from '../services/haClient';

export default function LightsOnModal({ show, onClose, lightEntityIds = [] }) {
  const { entities, conn } = useHomeAssistant();

  const activeLights = (
    lightEntityIds.length > 0
      ? lightEntityIds.map((id) => entities[id]).filter(Boolean)
      : Object.values(entities).filter((e) => {
          if (!e.entity_id.startsWith('light.') || e.state !== 'on') return false;
          const memberIds = e.attributes?.entity_id;
          if (Array.isArray(memberIds) && memberIds.length > 0) return false;
          return true;
        })
  ).filter((e) => e.state === 'on')
    .sort((a, b) => {
      const nameA = (a.attributes?.friendly_name || a.entity_id).toLowerCase();
      const nameB = (b.attributes?.friendly_name || b.entity_id).toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const count = activeLights.length;

  const turnOff = (entityId) => {
    callService(conn, 'light', 'turn_off', { entity_id: entityId });
  };

  const turnOffAll = () => {
    activeLights.forEach((light) => {
      callService(conn, 'light', 'turn_off', { entity_id: light.entity_id });
    });
    onClose();
  };

  const heading = count === 1 ? '1 Licht an' : `${count} Lichter an`;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      panelClassName="w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      panelStyle={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
        maxHeight: '80vh',
      }}
    >
      {(titleId) => (
        <>
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--glass-border)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-xl p-1.5"
                style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}
              >
                <Lightbulb className="h-4 w-4 text-amber-400" />
              </div>
              <span
                id={titleId}
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {heading}
              </span>
            </div>
            <button
              className="modal-close flex items-center justify-center rounded-xl p-1.5 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
              onClick={onClose}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Light list */}
          <div className="flex-1 overflow-y-auto px-3 py-2" style={{ minHeight: 0 }}>
            {activeLights.length === 0 ? (
              <p
                className="py-4 text-center text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Keine Lichter an
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {activeLights.map((light) => {
                  const friendlyName =
                    light.attributes?.friendly_name || light.entity_id;
                  return (
                    <li
                      key={light.entity_id}
                      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: '#fbbf24' }}
                        />
                        <span
                          className="truncate text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                          title={friendlyName}
                        >
                          {friendlyName}
                        </span>
                      </div>
                      <button
                        className="flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => turnOff(light.entity_id)}
                        aria-label={`${friendlyName} ausschalten`}
                        title={`${friendlyName} ausschalten`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {activeLights.length > 0 && (
            <div
              className="px-3 py-3"
              style={{ borderTop: '1px solid var(--glass-border)' }}
            >
              <button
                className="w-full rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: 'rgba(251,191,36,0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.3)',
                }}
                onClick={turnOffAll}
              >
                Alle ausschalten
              </button>
            </div>
          )}
        </>
      )}
    </AccessibleModalShell>
  );
}
