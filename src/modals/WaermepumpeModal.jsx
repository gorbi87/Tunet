import { useState, useEffect } from 'react';
import { Flame, X, Thermometer, Zap } from '../icons';
import { WAERMEPUMPE_ENTITY_IDS, MODUS_META } from '../components/cards/GenericWaermepumpeCard';
import { HpsuHydraulicView } from '../components/HpsuHydraulicView';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { getHistoryRest, getHistory } from '../services/haClient';

const ACCENT = '#fb923c';

function SelectDropdown({ entityId, entity, onSelect }) {
  if (!entity) return null;
  const current = entity.state;
  const options = entity.attributes?.options || [];

  return (
    <select
      value={current}
      onChange={(e) => onSelect(entityId, e.target.value)}
      className="w-full rounded-xl border px-3 py-2 text-sm font-medium transition-all"
      style={{
        backgroundColor: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} style={{ backgroundColor: 'var(--card-bg)' }}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TagesmodusBadges({ tagesmodus }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {Object.entries(MODUS_META).map(([key, meta]) => {
        const isActive = tagesmodus === key;
        return (
          <div
            key={key}
            className="rounded-xl border p-2 text-center transition-all"
            style={
              isActive
                ? { backgroundColor: `${meta.color}22`, borderColor: meta.color }
                : { backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }
            }
          >
            <p
              className="text-[10px] font-bold leading-tight"
              style={{ color: isActive ? meta.color : 'var(--text-muted)' }}
            >
              {meta.label}
            </p>
          </div>
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
  conn,
  haUrl,
  haToken,
  onOpenSensorModal,
  t,
}) {
  const translate = t || ((key) => key);
  const [mainTab, setMainTab] = useState('overview');
  const [energyTab, setEnergyTab] = useState('today');
  const [wwHistory, setWwHistory] = useState([]);
  const [wwHistoryOpen, setWwHistoryOpen] = useState(false);
  const [wwHistoryLoading, setWwHistoryLoading] = useState(false);
  const modalTitleId = 'waermepumpe-modal-title';

  useEffect(() => {
    if (!show || mainTab !== 'automatik') return;
    if (!conn && !haUrl) return;

    const fetchHistory = async () => {
      setWwHistoryLoading(true);
      const end = new Date();
      const start = new Date(end.getTime() - 48 * 60 * 60 * 1000);
      try {
        let raw = [];
        try {
          const data = await getHistoryRest(haUrl, haToken, {
            entityId: WAERMEPUMPE_ENTITY_IDS.tagesmodus,
            start,
            end,
            minimal_response: false,
            no_attributes: false,
            significant_changes_only: false,
          });
          raw = Array.isArray(data?.[0]) ? data[0] : (Array.isArray(data) ? data : []);
        } catch (_e) {
          const wsData = await getHistory(conn, {
            entityId: WAERMEPUMPE_ENTITY_IDS.tagesmodus,
            start,
            end,
          });
          raw = Array.isArray(wsData?.[0]) ? wsData[0] : (Array.isArray(wsData) ? wsData : []);
        }
        const toMs = (v) => (v != null && v < 1e12 ? v * 1000 : v);
        const parsed = raw
          .map((d) => ({
            state: d.state ?? d.s,
            time: new Date(d.last_changed ?? d.last_updated ?? toMs(d.lc) ?? toMs(d.lu)),
          }))
          .filter(
            (d) =>
              d.state &&
              d.state !== 'unknown' &&
              d.state !== 'unavailable' &&
              !isNaN(d.time.getTime())
          )
          .reverse();
        setWwHistory(parsed);
      } catch (_e) {
        setWwHistory([]);
      }
      setWwHistoryLoading(false);
    };

    fetchHistory();
  }, [show, mainTab, conn, haUrl, haToken]);

  if (!show) return null;

  const name = customNames?.[cardId] || translate('waermepumpe.title');

  const e = (id) => entities?.[id];
  const val = (id) => {
    const v = parseFloat(e(id)?.state);
    return Number.isFinite(v) ? v : null;
  };
  const str = (id) => e(id)?.state || null;

  const selectOption = (entityId, option) => {
    callService?.('select', 'select_option', { entity_id: entityId, option });
  };

  // Overview values
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

  // Automatik tab values
  const saisonState = str(WAERMEPUMPE_ENTITY_IDS.saison);
  const automationState = str(WAERMEPUMPE_ENTITY_IDS.automationWp);
  const tagesmodus = str(WAERMEPUMPE_ENTITY_IDS.tagesmodus) || 'Standby';
  const entscheidungslog = str(WAERMEPUMPE_ENTITY_IDS.entscheidungslog) || '';
  const modusColor = MODUS_META[tagesmodus]?.color || '#94a3b8';
  const minusPreisAktiv = e(WAERMEPUMPE_ENTITY_IDS.minusPreisBoolean)?.state === 'on';
  const kuehlungAktiv = e(WAERMEPUMPE_ENTITY_IDS.kuehlung)?.state === 'on';
  const octopusPreisVal = parseFloat(e(WAERMEPUMPE_ENTITY_IDS.octopusPreis)?.state);
  const octopusPreisAktuell = Number.isFinite(octopusPreisVal) ? octopusPreisVal : null;
  const kompressorStartStr = str(WAERMEPUMPE_ENTITY_IDS.kompressorStart);
  const wwSollState = str(WAERMEPUMPE_ENTITY_IDS.wwSoll);
  const betriebsartState = str(WAERMEPUMPE_ENTITY_IDS.betriebsart);
  const heizstabSelectState = str(WAERMEPUMPE_ENTITY_IDS.heizstabSelect);
  const heizstabLaeuft = heizstabSelectState != null && heizstabSelectState !== 'Aus';
  const leistungWwVal = val(WAERMEPUMPE_ENTITY_IDS.leistungWw);
  const bohWartezeitVal = val(WAERMEPUMPE_ENTITY_IDS.bohWartezeit) ?? 95;
  const autoOn = automationState === 'on';

  // Upcoming negative price within 12h
  const octopusRatesModal = e(WAERMEPUMPE_ENTITY_IDS.octopusPreis)?.attributes?.rates;
  const minusPreisKommtInH = (() => {
    if (!Array.isArray(octopusRatesModal) || octopusPreisAktuell < 0) return null;
    const nowTs = Date.now();
    const lookaheadMs = 12 * 3600 * 1000;
    let earliest = null;
    for (const r of octopusRatesModal) {
      if (typeof r.value_inc_vat === 'number' && r.value_inc_vat < 0) {
        const startTs = new Date(r.start).getTime();
        if (startTs > nowTs && startTs < nowTs + lookaheadMs) {
          if (earliest === null || startTs < earliest) earliest = startTs;
        }
      }
    }
    if (earliest === null) return null;
    return Math.ceil((earliest - nowTs) / 3600000 * 10) / 10;
  })();

  // BOH Kompressor-Laufzeit
  let kompressorLaufzeitMin = 0;
  const istWWZyklus = betriebsartState === 'Warmwasserbereitung';
  if (kompressorStartStr && istWWZyklus && kompressorAktiv) {
    const startTs = new Date(kompressorStartStr.replace(' ', 'T')).getTime();
    if (!isNaN(startTs)) {
      kompressorLaufzeitMin = Math.max(0, (Date.now() - startTs) / 60000);
    }
  }
  // Blueprint re-triggers heizstab off at boh_wartezeit - 3 min so Daikin BOH takes over at boh_wartezeit
  const bohSchwelle = bohWartezeitVal - 3;
  const bohPct = Math.min(100, (kompressorLaufzeitMin / bohSchwelle) * 100);
  const bohColor =
    bohPct >= 100 ? '#ef9a9a' : bohPct >= 75 ? '#ffb74d' : '#64b5f6';

  // Minus-Preis BOH phase derivation
  const bohAblaufPhase = (() => {
    if (!minusPreisAktiv) return null;
    if (!istWWZyklus || !kompressorAktiv) return 'waiting';
    if (kompressorLaufzeitMin < bohSchwelle) return 'heizstab';
    if (kompressorLaufzeitMin < bohWartezeitVal) return 'uebergabe';
    return 'boh';
  })();

  const saisonColor = saisonState?.startsWith('Win') ? '#64b5f6' : '#ffb74d';

  const toggleAutomation = () => {
    callService?.('automation', 'toggle', {
      entity_id: WAERMEPUMPE_ENTITY_IDS.automationWp,
    });
  };
  const setSaison = (option) => {
    callService?.('input_select', 'select_option', {
      entity_id: WAERMEPUMPE_ENTITY_IDS.saison,
      option,
    });
  };
  const toggleKuehlung = () => {
    callService?.('input_boolean', kuehlungAktiv ? 'turn_off' : 'turn_on', {
      entity_id: WAERMEPUMPE_ENTITY_IDS.kuehlung,
    });
  };

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
    { key: 'automatik', label: 'Automatik' },
    { key: 'hydraulik', label: translate('waermepumpe.tab.hydraulik') || 'Hydraulik' },
  ];

  const isCompact =
    window.innerHeight < 900 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const isPhone = window.innerWidth < 640;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName={
        isCompact
          ? 'fixed inset-0 z-50 flex items-stretch justify-center'
          : 'fixed inset-0 z-50 flex items-center justify-center p-6'
      }
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName={
        isCompact
          ? 'popup-anim relative flex flex-col w-full max-w-2xl h-full overflow-hidden rounded-none border font-sans backdrop-blur-xl'
          : 'popup-anim relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] border font-sans backdrop-blur-xl'
      }
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* ── Fixed header ── */}
          <div
            className={`flex-shrink-0 border-b ${isCompact ? 'p-4 pb-3' : 'p-8 pb-5'}`}
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 pr-10 font-sans">
              <div
                className="rounded-2xl p-3 transition-all duration-500"
                style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', color: ACCENT }}
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

            <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
              {mainTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMainTab(key)}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                  style={
                    mainTab === key
                      ? {
                          backgroundColor: 'rgba(234,88,12,0.15)',
                          borderColor: ACCENT,
                          color: ACCENT,
                          border: `1px solid ${ACCENT}`,
                        }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>

            {/* ── Tab: Übersicht ── */}
            {mainTab === 'overview' && (
              <>
                <div
                  className={`grid items-start gap-4 font-sans ${
                    isPhone ? 'grid-cols-1' : isCompact ? 'grid-cols-5' : 'grid-cols-1 lg:grid-cols-5'
                  }`}
                >
                  <div className={`space-y-2 ${isPhone ? '' : 'md:col-span-3'}`}>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {translate('waermepumpe.temperatures')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onOpenSensorModal?.(WAERMEPUMPE_ENTITY_IDS.warmwasser)}
                        className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all hover:opacity-80 active:scale-[0.98]"
                      >
                        <p
                          className="text-[10px] font-bold tracking-[0.15em] uppercase"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {translate('waermepumpe.warmwasser')}
                        </p>
                        <p className="text-xl font-light" style={{ color: ACCENT }}>
                          {wwTemp != null ? `${wwTemp.toFixed(1)} °C` : '—'}
                        </p>
                        <span className="text-[9px] text-[var(--text-muted)] opacity-50">
                          ↗ Verlauf
                        </span>
                      </button>
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
                                · {heizstabTaglich.toFixed(2)} kWh{' '}
                                {translate('waermepumpe.heute')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`space-y-2 ${isPhone ? '' : 'md:col-span-2'}`}>
                    <div
                      className="flex rounded-2xl p-1"
                      style={{ backgroundColor: 'var(--glass-bg)' }}
                    >
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

                    <div
                      className={`popup-surface transition-all ${
                        isCompact
                          ? 'flex items-center justify-between gap-3 rounded-2xl px-4 py-3'
                          : 'flex flex-col items-center justify-center gap-2 rounded-3xl p-8'
                      }`}
                    >
                      <p className="text-xs font-bold tracking-[0.2em] text-[var(--accent-color)] uppercase">
                        COP
                      </p>
                      <span
                        className={`leading-none font-light text-[var(--accent-color)] italic ${
                          isCompact ? 'text-4xl' : 'text-6xl'
                        }`}
                      >
                        {aktivCop ?? '—'}
                      </span>
                    </div>

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

                {/* Controls */}
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
                        <SelectDropdown
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
                        <SelectDropdown
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
                        <SelectDropdown
                          entityId={WAERMEPUMPE_ENTITY_IDS.heizstabSelect}
                          entity={e(WAERMEPUMPE_ENTITY_IDS.heizstabSelect)}
                          onSelect={selectOption}
                        />
                      </div>
                    )}
                    {e(WAERMEPUMPE_ENTITY_IDS.raumsoll) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                          Raumsoll
                        </p>
                        <SelectDropdown
                          entityId={WAERMEPUMPE_ENTITY_IDS.raumsoll}
                          entity={e(WAERMEPUMPE_ENTITY_IDS.raumsoll)}
                          onSelect={selectOption}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: Automatik ── */}
            {mainTab === 'automatik' && (
              <div className="space-y-5 font-sans">

                {/* Automation toggle + Saison */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleAutomation}
                      className="rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all"
                      style={
                        autoOn
                          ? {
                              backgroundColor: 'rgba(74,222,128,0.15)',
                              borderColor: '#4ade80',
                              color: '#4ade80',
                            }
                          : {
                              backgroundColor: 'var(--glass-bg)',
                              borderColor: 'var(--glass-border)',
                              color: 'var(--text-muted)',
                            }
                      }
                    >
                      Automatik {autoOn ? 'Ein' : 'Aus'}
                    </button>
                    {saisonState === 'Sommer' && (
                      <button
                        type="button"
                        onClick={toggleKuehlung}
                        className="rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all"
                        style={
                          kuehlungAktiv
                            ? {
                                backgroundColor: 'rgba(56,189,248,0.15)',
                                borderColor: '#38bdf8',
                                color: '#38bdf8',
                              }
                            : {
                                backgroundColor: 'var(--glass-bg)',
                                borderColor: 'var(--glass-border)',
                                color: 'var(--text-muted)',
                              }
                        }
                      >
                        Kühlung {kuehlungAktiv ? 'Ein' : 'Aus'}
                      </button>
                    )}
                    {saisonState && (
                      <span
                        className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
                        style={{
                          backgroundColor: `${saisonColor}22`,
                          borderColor: `${saisonColor}66`,
                          color: saisonColor,
                        }}
                      >
                        {saisonState}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {['Sommer', 'Winter'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSaison(opt)}
                        className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all"
                        style={
                          saisonState === opt
                            ? {
                                backgroundColor: `${saisonColor}22`,
                                borderColor: saisonColor,
                                color: saisonColor,
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
                    ))}
                  </div>
                </div>

                {/* Minus-Preis Banner */}
                {(minusPreisAktiv || (octopusPreisAktuell !== null && octopusPreisAktuell < 0)) && (() => {
                  const isBoh = bohAblaufPhase === 'boh' || bohAblaufPhase === 'uebergabe';
                  const pillColor = heizstabLaeuft ? '#4ade80' : isBoh ? '#38bdf8' : '#fbbf24';
                  const pillBg = heizstabLaeuft ? 'rgba(74,222,128,0.08)' : isBoh ? 'rgba(56,189,248,0.08)' : 'rgba(251,191,36,0.08)';
                  const pillBorder = heizstabLaeuft ? 'rgba(74,222,128,0.4)' : isBoh ? 'rgba(56,189,248,0.4)' : 'rgba(251,191,36,0.4)';
                  const pillLabel = heizstabLaeuft
                    ? `Heizstab ${heizstabSelectState}`
                    : isBoh
                    ? 'BOH aktiv · Daikin intern'
                    : bohAblaufPhase === 'waiting'
                    ? 'Kompressor startet …'
                    : 'WW voll · pausiert';
                  return (
                    <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: pillBg, borderColor: pillBorder }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: pillColor }}>
                          ⚡ Minus-Preis Modus aktiv
                        </span>
                        <span
                          className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                          style={{ backgroundColor: `${pillColor}26`, borderColor: pillColor, color: pillColor }}
                        >
                          {pillLabel}
                        </span>
                      </div>
                      {octopusPreisAktuell != null && (
                        <p className="text-sm font-light" style={{ color: pillColor }}>
                          {octopusPreisAktuell.toFixed(4)} €/kWh · WW-Soll {wwSollState} · Leistung WW {leistungWwVal ?? '—'} kW
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Minus-Preis BOH-Ablauf Timeline */}
                {minusPreisAktiv && (
                  <div className="popup-surface rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      Minus-Preis · BOH-Ablauf
                    </p>

                    {/* Three-phase indicator */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'heizstab', label: 'Heizstab', sub: `0 – ${bohSchwelle.toFixed(0)} min`, color: '#4ade80' },
                        { key: 'uebergabe', label: 'Übergabe', sub: `${bohSchwelle.toFixed(0)} – ${bohWartezeitVal} min`, color: '#fbbf24' },
                        { key: 'boh', label: 'BOH Daikin', sub: `${bohWartezeitVal} min+`, color: '#38bdf8' },
                      ].map(({ key, label, sub, color }) => {
                        const isActive = bohAblaufPhase === key;
                        const isDone =
                          (key === 'heizstab' && (bohAblaufPhase === 'uebergabe' || bohAblaufPhase === 'boh')) ||
                          (key === 'uebergabe' && bohAblaufPhase === 'boh');
                        return (
                          <div
                            key={key}
                            className="rounded-xl border p-2 text-center transition-all"
                            style={
                              isActive
                                ? { backgroundColor: `${color}22`, borderColor: color }
                                : isDone
                                ? { backgroundColor: `${color}10`, borderColor: `${color}44` }
                                : { backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }
                            }
                          >
                            <p className="text-[11px] font-bold" style={{ color: isActive ? color : isDone ? `${color}99` : 'var(--text-muted)' }}>
                              {label}
                            </p>
                            <p className="text-[9px] leading-tight mt-0.5" style={{ color: isActive ? color : 'var(--text-muted)' }}>
                              {sub}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress bar: 0 → boh_wartezeit, marker at bohSchwelle */}
                    {istWWZyklus && (
                      <div className="space-y-1">
                        <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                          {/* Progress fill */}
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (kompressorLaufzeitMin / bohWartezeitVal) * 100)}%`,
                              backgroundColor:
                                bohAblaufPhase === 'boh' ? '#38bdf8' :
                                bohAblaufPhase === 'uebergabe' ? '#fbbf24' : '#4ade80',
                            }}
                          />
                          {/* Marker at Übergabe threshold */}
                          <div
                            className="absolute inset-y-0 w-0.5"
                            style={{
                              left: `${(bohSchwelle / bohWartezeitVal) * 100}%`,
                              backgroundColor: 'rgba(251,191,36,0.7)',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          <span>{kompressorLaufzeitMin.toFixed(0)} min</span>
                          <span>/ {bohWartezeitVal} min BOH-Wartezeit</span>
                        </div>
                      </div>
                    )}
                    {!istWWZyklus && (
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {bohAblaufPhase === 'waiting'
                          ? 'Kompressor startet WW-Zyklus …'
                          : 'WW-Zyklus abgeschlossen · Kompressor Standby'}
                      </p>
                    )}

                    {/* Config summary */}
                    <div className="flex gap-4 pt-1 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Leistung WW</p>
                        <p className="text-sm font-light" style={{ color: leistungWwVal === 9 ? '#4ade80' : 'var(--text-primary)' }}>
                          {leistungWwVal ?? '—'} kW
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>BOH-Wartezeit</p>
                        <p className="text-sm font-light" style={{ color: bohWartezeitVal <= 20 ? '#4ade80' : 'var(--text-primary)' }}>
                          {bohWartezeitVal} min
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>WW-Soll</p>
                        <p className="text-sm font-light" style={{ color: '#38bdf8' }}>
                          {wwSollState || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minus-Preis kommt bald */}
                {minusPreisKommtInH !== null && (
                  <div
                    className="rounded-2xl border p-4 space-y-1"
                    style={{ backgroundColor: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.4)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#fbbf24' }}>
                        ⚡ Minus-Preis in ~{minusPreisKommtInH}h
                      </span>
                      <span
                        className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                        style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24', color: '#fbbf24' }}
                      >
                        WW-Ziel: 48°C
                      </span>
                    </div>
                    <p className="text-sm font-light" style={{ color: '#fbbf24' }}>
                      WP heizt nur bis 48°C mit PV – Heizstab 9kW startet beim negativen Slot.
                    </p>
                  </div>
                )}

                {/* State Machine Status */}
                <div className="popup-surface rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    Tagesplan · Aktueller Modus
                  </p>
                  <TagesmodusBadges tagesmodus={tagesmodus} />

                  {entscheidungslog && (
                    <div
                      className="rounded-xl border p-2.5"
                      style={{ borderColor: `${modusColor}44`, backgroundColor: `${modusColor}0d` }}
                    >
                      <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                        Letzte Entscheidung
                      </p>
                      <p className="text-[11px] font-light leading-relaxed" style={{ color: modusColor }}>
                        {entscheidungslog}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-2 text-center" style={{ borderColor: 'var(--glass-border)' }}>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>WW-Ist</p>
                      <p className="text-lg font-light" style={{ color: ACCENT }}>
                        {wwTemp != null ? `${wwTemp.toFixed(1)}°C` : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border p-2 text-center" style={{ borderColor: 'var(--glass-border)' }}>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>WW-Soll</p>
                      <p className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                        {wwSollState || '—'}
                      </p>
                    </div>
                  </div>

                  {/* WW progress bar for WW_Heizen / WW_Boost */}
                  {(tagesmodus === 'WW_Heizen' || tagesmodus === 'WW_Boost') && wwTemp != null && (
                    <div>
                      <div className="mb-1 flex justify-between" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        <span>{wwTemp.toFixed(1)}°C</span>
                        <span style={{ color: modusColor }}>→ 63°C</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--glass-border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, Math.max(0, (wwTemp - 40) / 23 * 100))}%`,
                            backgroundColor: modusColor,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {betriebsartState && (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: kompressorAktiv ? '#4ade80' : 'var(--text-muted)' }}
                      />
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {betriebsartState}
                      </span>
                      {heizstabSelectState && heizstabLaeuft && (
                        <span className="ml-auto flex items-center gap-1 text-[11px]" style={{ color: '#ef9a9a' }}>
                          <Zap className="h-3 w-3" />
                          {heizstabSelectState}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* BOH-Schutz (Kompressor-Laufzeit) */}
                {autoOn && !minusPreisAktiv && (
                  <div className="popup-surface rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      BOH-Schutz · Kompressor-Laufzeit
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative flex-1 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--glass-border)' }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{ width: `${bohPct}%`, backgroundColor: bohColor }}
                        />
                      </div>
                      <span
                        className="flex-shrink-0 text-[11px] font-medium tabular-nums"
                        style={{ color: bohColor, minWidth: '80px', textAlign: 'right' }}
                      >
                        {kompressorLaufzeitMin.toFixed(0)} / {bohSchwelle} min
                      </span>
                    </div>
                    {bohPct >= 75 && (
                      <p className="text-[11px]" style={{ color: bohColor }}>
                        {bohPct >= 100
                          ? '⚠️ BOH-Schwelle erreicht – Heizstab-Schutz aktiv'
                          : `Noch ~${(bohSchwelle - kompressorLaufzeitMin).toFixed(0)} min bis BOH-Eingriff`}
                      </p>
                    )}
                    {!istWWZyklus && (
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Kein aktiver WW-Zyklus · Timer pausiert
                      </p>
                    )}
                  </div>
                )}

                {/* Tagesmodus Verlauf */}
                <div className="popup-surface rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWwHistoryOpen((o) => !o)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <p
                      className="text-[10px] font-bold tracking-[0.2em] uppercase"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Tagesmodus Verlauf (48h)
                    </p>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {wwHistoryOpen ? '▲' : '▼'}
                    </span>
                  </button>
                  {wwHistoryOpen && (
                    <div
                      className="border-t px-4 pb-4 pt-3 space-y-1"
                      style={{ borderColor: 'var(--glass-border)' }}
                    >
                      {wwHistoryLoading ? (
                        <div className="flex h-12 items-center justify-center">
                          <div
                            className="h-5 w-5 animate-spin rounded-full border-b-2 opacity-30"
                            style={{ borderColor: ACCENT }}
                          />
                        </div>
                      ) : wwHistory.length === 0 ? (
                        <p
                          className="py-2 text-center text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Keine Daten
                        </p>
                      ) : (
                        wwHistory.map((entry, i) => {
                          const now = new Date();
                          const isToday = entry.time.toDateString() === now.toDateString();
                          const yesterday = new Date(now);
                          yesterday.setDate(yesterday.getDate() - 1);
                          const isYesterday = entry.time.toDateString() === yesterday.toDateString();
                          const timeStr = isToday
                            ? entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : isYesterday
                            ? `gestern ${entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : `${entry.time.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                          const dotColor = MODUS_META[entry.state]?.color || 'var(--text-muted)';
                          const modusLabel = MODUS_META[entry.state]?.label || entry.state;

                          return (
                            <div key={i} className="flex items-center gap-3 py-1.5">
                              <div
                                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: dotColor }}
                              />
                              <span
                                className="flex-1 text-[11px] font-semibold"
                                style={{ color: dotColor }}
                              >
                                {modusLabel}
                              </span>
                              <span
                                className="flex-shrink-0 text-[10px] tabular-nums"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {timeStr}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Hydraulik ── */}
            {mainTab === 'hydraulik' && <HpsuHydraulicView entities={entities} />}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
