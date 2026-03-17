import { useState } from 'react';
import { Flame, X, Thermometer, Zap } from '../icons';
import { WAERMEPUMPE_ENTITY_IDS } from '../components/cards/GenericWaermepumpeCard';
import { HpsuHydraulicView } from '../components/HpsuHydraulicView';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

function SelectPills({ entityId, entity, onSelect }) {
  if (!entity) return null;
  const current = entity.state;
  const options = entity.attributes?.options || [];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = opt === current;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(entityId, opt)}
            className="rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all"
            style={
              isActive
                ? {
                    backgroundColor: 'var(--accent-bg)',
                    borderColor: 'var(--accent-color)',
                    color: 'var(--accent-color)',
                  }
                : {
                    backgroundColor: 'var(--glass-bg)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function WaermepumpeModal({
  show,
  onClose,
  entities,
  customNames,
  cardId,
  callService,
  t,
}) {
  const translate = t || ((key) => key);
  const [mainTab, setMainTab] = useState('overview');
  const [energyTab, setEnergyTab] = useState('today');
  const modalTitleId = 'waermepumpe-modal-title';

  if (!show) return null;

  const name = customNames?.[cardId] || translate('waermepumpe.title');

  const e = (id) => entities?.[id];
  const val = (id) => {
    const v = parseFloat(e(id)?.state);
    return Number.isFinite(v) ? v : null;
  };

  const selectOption = (entityId, option) => {
    callService?.('select', 'select_option', { entity_id: entityId, option });
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

  const aktivStrom = energyTab === 'today' ? stromHeute : stromMonat;
  const aktivWaerme = energyTab === 'today' ? waermeHeute : waermeMonat;
  const aktivCop = energyTab === 'today' ? copHeute : copMonat;

  const TempRow = ({ label, value, color = 'var(--text-primary)' }) => (
    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3">
      <p
        className="text-[10px] font-bold tracking-[0.15em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p className="text-xl font-light" style={{ color }}>
        {value != null ? `${value.toFixed(1)} °C` : '—'}
      </p>
    </div>
  );

  const mainTabs = [
    { key: 'overview', label: translate('waermepumpe.tab.overview') || 'Übersicht' },
    { key: 'hydraulik', label: translate('waermepumpe.tab.hydraulik') || 'Hydraulik' },
  ];

  // Compact mode: small screen height (tablet landscape) or touch device
  const isCompact = window.innerHeight < 900 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName={isCompact
        ? 'fixed inset-0 z-50 flex items-stretch'
        : 'fixed inset-0 z-50 flex items-center justify-center p-6'}
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName={isCompact
        ? 'popup-anim relative flex flex-col w-full h-full overflow-hidden rounded-none border font-sans backdrop-blur-xl'
        : 'popup-anim relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] border font-sans backdrop-blur-xl'}
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* ── Fixed header: close + icon/title + tabs ── */}
          <div
            className={`flex-shrink-0 border-b ${isCompact ? 'p-4 pb-3' : 'p-8 pb-5'}`}
            style={{ borderColor: 'var(--glass-border)' }}
          >
            {/* Close button */}
            <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Header row */}
            <div className="mb-4 flex items-center gap-3 pr-10 font-sans">
              <div
                className="rounded-2xl p-3 transition-all duration-500"
                style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', color: '#fb923c' }}
              >
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <h3
                  id={modalTitleId}
                  className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic"
                >
                  {name}
                </h3>
                <div
                  className="mt-1.5 inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
                  style={{
                    backgroundColor: kompressorAktiv ? 'var(--status-success-bg)' : 'var(--glass-bg)',
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
                      color: kompressorAktiv ? 'var(--status-success-fg)' : 'var(--text-secondary)',
                    }}
                  >
                    {kompressorAktiv
                      ? translate('waermepumpe.kompressor.on')
                      : translate('waermepumpe.kompressor.off')}
                  </p>
                </div>
              </div>
            </div>

            {/* Main tabs */}
            <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
              {mainTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMainTab(key)}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                  style={
                    mainTab === key
                      ? {
                          backgroundColor: 'var(--accent-bg)',
                          borderColor: 'var(--accent-color)',
                          color: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                        }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable content area ── */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>

            {/* Tab: Übersicht */}
            {mainTab === 'overview' && (
              <>
                {/* Temps + Energy grid — side-by-side from md */}
                <div className={`grid items-start gap-4 font-sans ${isCompact ? 'grid-cols-5' : 'grid-cols-1 lg:grid-cols-5'}`}>
                  {/* Left: Temperatures */}
                  <div className="space-y-2 md:col-span-3">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {translate('waermepumpe.temperatures')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <TempRow label={translate('waermepumpe.warmwasser')} value={wwTemp} color="#fb923c" />
                      <TempRow label={translate('waermepumpe.aussentemp')} value={aussentemp} />
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
                  <div className="space-y-2 md:col-span-2">
                    {/* Energy tab switcher */}
                    <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
                      {['today', 'month'].map((key) => (
                        <button
                          key={key}
                          onClick={() => setEnergyTab(key)}
                          className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                          style={
                            energyTab === key
                              ? {
                                  backgroundColor: 'var(--accent-bg)',
                                  borderColor: 'var(--accent-color)',
                                  color: 'var(--accent-color)',
                                  border: '1px solid var(--accent-color)',
                                }
                              : { color: 'var(--text-secondary)' }
                          }
                        >
                          {key === 'today'
                            ? translate('waermepumpe.heute')
                            : translate('waermepumpe.monat')}
                        </button>
                      ))}
                    </div>

                    {/* COP */}
                    <div className={`popup-surface transition-all ${isCompact
                        ? 'flex items-center justify-between gap-3 rounded-2xl px-4 py-3'
                        : 'flex flex-col items-center justify-center gap-2 rounded-3xl p-8'}`}>
                      <p className="text-xs font-bold tracking-[0.2em] text-[var(--accent-color)] uppercase">
                        COP
                      </p>
                      <span className={`leading-none font-light text-[var(--accent-color)] italic ${isCompact ? 'text-4xl' : 'text-6xl'}`}>
                        {aktivCop ?? '—'}
                      </span>
                    </div>

                    {/* Strom + Wärme */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3">
                        <Zap className="h-4 w-4 text-[var(--accent-color)]" />
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                          {translate('waermepumpe.strom')}
                        </p>
                        <p className="text-lg font-light text-[var(--text-primary)]">
                          {aktivStrom != null ? aktivStrom.toFixed(2) : '—'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">kWh</p>
                      </div>
                      <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3">
                        <Thermometer className="h-4 w-4 text-orange-400" />
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                          {translate('waermepumpe.waerme')}
                        </p>
                        <p className="text-lg font-light text-[var(--text-primary)]">
                          {aktivWaerme != null ? aktivWaerme.toFixed(2) : '—'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">kWh</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls section */}
                <div
                  className="mt-3 border-t pt-3 font-sans"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    {translate('waermepumpe.steuerung')}
                  </p>
                  <div className="flex flex-wrap gap-5">
                    {e(WAERMEPUMPE_ENTITY_IDS.betriebsmodus) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                          {translate('waermepumpe.betriebsmodus')}
                        </p>
                        <SelectPills
                          entityId={WAERMEPUMPE_ENTITY_IDS.betriebsmodus}
                          entity={e(WAERMEPUMPE_ENTITY_IDS.betriebsmodus)}
                          onSelect={selectOption}
                        />
                      </div>
                    )}
                    {e(WAERMEPUMPE_ENTITY_IDS.wwSoll) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                          {translate('waermepumpe.wwSoll')}
                        </p>
                        <SelectPills
                          entityId={WAERMEPUMPE_ENTITY_IDS.wwSoll}
                          entity={e(WAERMEPUMPE_ENTITY_IDS.wwSoll)}
                          onSelect={selectOption}
                        />
                      </div>
                    )}
                    {e(WAERMEPUMPE_ENTITY_IDS.heizstabSelect) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                          {translate('waermepumpe.heizstab')}
                        </p>
                        <SelectPills
                          entityId={WAERMEPUMPE_ENTITY_IDS.heizstabSelect}
                          entity={e(WAERMEPUMPE_ENTITY_IDS.heizstabSelect)}
                          onSelect={selectOption}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Hydraulik */}
            {mainTab === 'hydraulik' && (
              <HpsuHydraulicView entities={entities} />
            )}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
