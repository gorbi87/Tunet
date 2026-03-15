import { useState } from 'react';
import { Flame, X, Thermometer, Zap } from '../icons';
import { WAERMEPUMPE_ENTITY_IDS } from '../components/cards/GenericWaermepumpeCard';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

export default function WaermepumpeModal({ show, onClose, entities, customNames, cardId, t }) {
  const translate = t || ((key) => key);
  const [tab, setTab] = useState('today');
  const modalTitleId = 'waermepumpe-modal-title';

  if (!show) return null;

  const name =
    customNames?.[cardId] || translate('waermepumpe.title');

  const e = (id) => entities?.[id];
  const val = (id) => {
    const v = parseFloat(e(id)?.state);
    return Number.isFinite(v) ? v : null;
  };

  const kompressorAktiv = e(WAERMEPUMPE_ENTITY_IDS.kompressor)?.state === 'on';
  const wwTemp = val(WAERMEPUMPE_ENTITY_IDS.warmwasser);
  const vorlauf = val(WAERMEPUMPE_ENTITY_IDS.vorlauf);
  const ruecklauf = val(WAERMEPUMPE_ENTITY_IDS.ruecklauf);
  const aussentemp = val(WAERMEPUMPE_ENTITY_IDS.aussentemp);

  const stromHeute = val(WAERMEPUMPE_ENTITY_IDS.stromTaglich);
  const waermeHeute = val(WAERMEPUMPE_ENTITY_IDS.waermeTaglich);
  const stromMonat = val(WAERMEPUMPE_ENTITY_IDS.stromMonatlich);
  const waermeMonat = val(WAERMEPUMPE_ENTITY_IDS.waermeMonatlich);
  const heizstab = val(WAERMEPUMPE_ENTITY_IDS.heizstab);
  const heizstabTaglich = val(WAERMEPUMPE_ENTITY_IDS.heizstabTaglich);

  const copHeute =
    stromHeute != null && waermeHeute != null && stromHeute > 0
      ? (waermeHeute / stromHeute).toFixed(2)
      : null;
  const copMonat =
    stromMonat != null && waermeMonat != null && stromMonat > 0
      ? (waermeMonat / stromMonat).toFixed(2)
      : null;

  const aktivStrom = tab === 'today' ? stromHeute : stromMonat;
  const aktivWaerme = tab === 'today' ? waermeHeute : waermeMonat;
  const aktivCop = tab === 'today' ? copHeute : copMonat;

  const TempRow = ({ label, value, color = 'var(--text-primary)' }) => (
    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
      <p
        className="text-[10px] font-bold tracking-[0.15em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p className="text-2xl font-light" style={{ color }}>
        {value != null ? `${value.toFixed(1)} °C` : '—'}
      </p>
    </div>
  );

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName="popup-anim relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-6 font-sans backdrop-blur-xl md:rounded-[3rem] md:p-12"
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Close button */}
          <div className="absolute top-6 right-6 z-20 md:top-10 md:right-10">
            <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center gap-4 font-sans">
            <div
              className="rounded-2xl p-4 transition-all duration-500"
              style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', color: '#fb923c' }}
            >
              <Flame className="h-8 w-8" />
            </div>
            <div>
              <h3
                id={modalTitleId}
                className="text-2xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic"
              >
                {name}
              </h3>
              <div
                className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
                style={{
                  backgroundColor: kompressorAktiv
                    ? 'var(--status-success-bg)'
                    : 'var(--glass-bg)',
                  borderColor: kompressorAktiv
                    ? 'var(--status-success-border)'
                    : 'var(--glass-border)',
                }}
              >
                <span
                  className={`h-2 w-2 rounded-full ${kompressorAktiv ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--text-muted)]'}`}
                />
                <p
                  className="text-[10px] font-bold tracking-widest uppercase italic"
                  style={{
                    color: kompressorAktiv
                      ? 'var(--status-success-fg)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {kompressorAktiv
                    ? translate('waermepumpe.kompressor.on')
                    : translate('waermepumpe.kompressor.off')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 font-sans lg:grid-cols-5">
            {/* Left: Temperatures */}
            <div className="space-y-4 lg:col-span-3">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                {translate('waermepumpe.temperatures')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TempRow
                  label={translate('waermepumpe.warmwasser')}
                  value={wwTemp}
                  color="#fb923c"
                />
                <TempRow
                  label={translate('waermepumpe.aussentemp')}
                  value={aussentemp}
                  color="var(--text-primary)"
                />
                <TempRow
                  label={translate('waermepumpe.vorlauf')}
                  value={vorlauf}
                  color="var(--status-error-fg)"
                />
                <TempRow
                  label={translate('waermepumpe.ruecklauf')}
                  value={ruecklauf}
                  color="var(--accent-color)"
                />
              </div>

              {heizstab != null && heizstab > 0 && (
                <div
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{
                    backgroundColor: 'var(--status-error-bg)',
                    borderColor: 'var(--status-error-border)',
                  }}
                >
                  <Zap className="h-4 w-4 text-[var(--status-error-fg)]" />
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-[var(--status-error-fg)] uppercase">
                      {translate('waermepumpe.heizstab')}
                    </p>
                    <p className="text-sm font-light text-[var(--text-primary)]">
                      {heizstab} W
                      {heizstabTaglich != null && (
                        <span className="ml-2 text-[var(--text-muted)]">
                          · {heizstabTaglich.toFixed(2)} kWh {translate('waermepumpe.heute')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Energy stats */}
            <div className="space-y-4 lg:col-span-2">
              {/* Tab switcher */}
              <div
                className="flex rounded-2xl p-1"
                style={{ backgroundColor: 'var(--glass-bg)' }}
              >
                {['today', 'month'].map((key) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                    style={
                      tab === key
                        ? {
                            backgroundColor: 'var(--accent-bg)',
                            borderColor: 'var(--accent-color)',
                            color: 'var(--accent-color)',
                            border: '1px solid var(--accent-color)',
                          }
                        : {
                            color: 'var(--text-secondary)',
                          }
                    }
                  >
                    {key === 'today'
                      ? translate('waermepumpe.heute')
                      : translate('waermepumpe.monat')}
                  </button>
                ))}
              </div>

              {/* COP */}
              <div className="popup-surface flex flex-col items-center gap-2 rounded-3xl p-8 transition-all">
                <p className="text-xs font-bold tracking-[0.2em] text-[var(--accent-color)] uppercase">
                  COP
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl leading-none font-light text-[var(--accent-color)] italic">
                    {aktivCop ?? '—'}
                  </span>
                </div>
              </div>

              {/* Strom + Wärme */}
              <div className="grid grid-cols-2 gap-3">
                <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
                  <Zap className="h-4 w-4 text-[var(--accent-color)]" />
                  <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                    {translate('waermepumpe.strom')}
                  </p>
                  <p className="text-xl font-light text-[var(--text-primary)]">
                    {aktivStrom != null ? `${aktivStrom.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">kWh</p>
                </div>
                <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                    {translate('waermepumpe.waerme')}
                  </p>
                  <p className="text-xl font-light text-[var(--text-primary)]">
                    {aktivWaerme != null ? `${aktivWaerme.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">kWh</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
