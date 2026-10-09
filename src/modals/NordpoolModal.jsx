import { useState, useEffect } from 'react';
import { X, Zap, ToggleLeft, ToggleRight } from '../icons';
import InteractivePowerGraph from '../components/charts/InteractivePowerGraph';
import { useHomeAssistantMeta } from '../contexts';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const SIM_VARIANTS = [
  { key: '0ct', label: '0 ct', minSpanne: 0 },
  { key: '4ct', label: '4 ct', minSpanne: 4 },
  { key: '8ct', label: '8 ct', minSpanne: 8 },
];

const MAX_SPEICHER_KWH = 3.3;

function getSimVariantData(v, entities) {
  const e = (id) => entities?.[id];
  const num = (id) => {
    const val = parseFloat(e(id)?.state);
    return isNaN(val) ? null : val;
  };
  const ersparnis = num(`sensor.netzladung_sim_${v}_ersparnis`);
  const kosten = num(`input_number.netzladung_sim_${v}_kosten`);
  const erlos = num(`input_number.netzladung_sim_${v}_erlos`);
  const speicher = num(`input_number.netzladung_sim_${v}_speicher`);

  const now = Date.now();
  const changedMs = (entityId) => {
    const lc = e(entityId)?.last_changed;
    if (!lc) return Infinity;
    return now - new Date(lc).getTime();
  };
  const isLaden = changedMs(`input_number.netzladung_sim_${v}_kosten`) < 90000;
  const isNutzen = changedMs(`input_number.netzladung_sim_${v}_erlos`) < 90000;
  const isHalten = !isLaden && !isNutzen && speicher != null && speicher > 0.05;

  return { ersparnis, kosten, erlos, speicher, isLaden, isNutzen, isHalten };
}

function parseSimStatus(raw) {
  if (!raw || raw === 'unavailable' || raw === 'unknown') {
    return { type: 'unavailable', label: '—', detail: '' };
  }
  if (raw.startsWith('Pausiert')) {
    return { type: 'paused', label: 'Pausiert', detail: raw.replace(/^Pausiert\s*[–-]\s*/, '') };
  }
  if (raw.startsWith('Kein Laden:')) {
    const after = raw.replace('Kein Laden:', '').trim();
    const [reason, ...rest] = after.split('·');
    return { type: 'idle', label: 'Kein Laden', detail: reason.trim(), sub: rest.join('·').trim() };
  }
  if (raw.startsWith('Ladefenster:')) {
    const after = raw.replace('Ladefenster:', '').trim();
    return { type: 'active', label: 'Ladefenster', detail: after };
  }
  return { type: 'neutral', label: raw, detail: '' };
}

function SimStatusBadge({ raw }) {
  const { type, label, detail, sub } = parseSimStatus(raw);

  const colors = {
    paused: {
      bg: 'rgba(107,114,128,0.12)',
      border: 'rgba(107,114,128,0.3)',
      dot: '#6b7280',
      text: '#9ca3af',
    },
    idle: {
      bg: 'rgba(96,165,250,0.1)',
      border: 'rgba(96,165,250,0.3)',
      dot: '#60a5fa',
      text: '#93c5fd',
    },
    active: {
      bg: 'rgba(34,197,94,0.1)',
      border: 'rgba(34,197,94,0.3)',
      dot: '#22c55e',
      text: '#4ade80',
    },
    unavailable: {
      bg: 'rgba(107,114,128,0.08)',
      border: 'rgba(107,114,128,0.2)',
      dot: '#4b5563',
      text: '#6b7280',
    },
    neutral: {
      bg: 'rgba(156,163,175,0.1)',
      border: 'rgba(156,163,175,0.2)',
      dot: '#9ca3af',
      text: '#d1d5db',
    },
  };
  const c = colors[type] || colors.neutral;

  return (
    <div
      className="flex w-full items-start gap-3 rounded-2xl border p-3 sm:p-4"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <span
        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${type === 'active' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: c.dot }}
      />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: c.text }}>
          {label}
        </span>
        {detail && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-snug">{detail}</p>
        )}
        {sub && (
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{sub}</p>
        )}
      </div>
    </div>
  );
}

function SpeicherBar({ kwh }) {
  const pct = kwh != null ? Math.min(100, (kwh / MAX_SPEICHER_KWH) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          backgroundColor: pct > 10 ? '#38bdf8' : 'rgba(56,189,248,0.3)',
        }}
      />
    </div>
  );
}

function ActivityChip({ isLaden, isNutzen, isHalten }) {
  if (isLaden) return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase animate-pulse"
      style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
      Laden
    </span>
  );
  if (isNutzen) return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase animate-pulse"
      style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
      Nutzen
    </span>
  );
  if (isHalten) return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
      Halten
    </span>
  );
  return null;
}

function VariantCard({ variant, entities }) {
  const d = getSimVariantData(variant.key, entities);
  const ersparnisColor =
    d.ersparnis == null
      ? 'var(--text-muted)'
      : d.ersparnis >= 0
      ? '#4ade80'
      : '#f87171';

  return (
    <div
      className="popup-surface flex flex-col gap-2 rounded-2xl p-3 sm:rounded-3xl sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
          {variant.label}
        </span>
        <ActivityChip isLaden={d.isLaden} isNutzen={d.isNutzen} isHalten={d.isHalten} />
      </div>

      {/* Ersparnis */}
      <div>
        <p className="text-[9px] font-bold tracking-wide text-[var(--text-muted)] uppercase">Ersparnis</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light leading-none" style={{ color: ersparnisColor }}>
            {d.ersparnis != null
              ? `${d.ersparnis >= 0 ? '+' : ''}${d.ersparnis.toFixed(2)}`
              : '—'}
          </span>
          {d.ersparnis != null && (
            <span className="text-xs text-[var(--text-muted)]">€</span>
          )}
        </div>
      </div>

      {/* Kosten / Erlös */}
      <div className="flex gap-3 border-t border-[var(--glass-border)] pt-2">
        <div>
          <p className="text-[9px] font-bold tracking-wide text-[var(--text-muted)] uppercase">Kosten</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {d.kosten != null ? `${d.kosten.toFixed(2)} €` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-wide text-[var(--text-muted)] uppercase">Erlös</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {d.erlos != null ? `${d.erlos.toFixed(2)} €` : '—'}
          </p>
        </div>
      </div>

      {/* Schatten-Speicher */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold tracking-wide text-[var(--text-muted)] uppercase">Speicher</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {d.speicher != null ? `${d.speicher.toFixed(2)} / ${MAX_SPEICHER_KWH} kWh` : '—'}
          </p>
        </div>
        <SpeicherBar kwh={d.speicher} />
      </div>
    </div>
  );
}

export default function NordpoolModal({
  show,
  onClose,
  entity: _entity,
  fullPriceData,
  currentPriceIndex,
  priceStats,
  name,
  t,
  language,
  saveCardSetting,
  cardId,
  settings,
  hideSupport,
  entities,
}) {
  const { haConfig } = useHomeAssistantMeta();
  const translate = t || ((key) => key);
  const currency = settings?.currency || haConfig?.currency || 'kr';
  const [showWithSupport, setShowWithSupport] = useState(settings?.showWithSupport ?? false);
  const [tab, setTab] = useState('preise');
  const modalTitleId = 'nordpool-modal-title';

  useEffect(() => {
    if (!show) return;
    setShowWithSupport(settings?.showWithSupport ?? false);
  }, [show, settings?.showWithSupport]);

  useEffect(() => {
    if (!show) setTab('preise');
  }, [show]);

  if (!show) return null;

  const applyElStøtte = (priceInclMva) => {
    const threshold = 93.75;
    if (priceInclMva <= threshold) return priceInclMva;
    const priceExMva = priceInclMva / 1.25;
    const support = (priceExMva - 75) * 0.9 * 1.25;
    return priceInclMva - support;
  };

  const displayPriceData = fullPriceData.map((d) => ({
    ...d,
    value: showWithSupport ? applyElStøtte(d.value) : d.value,
  }));

  const displayPriceStats = {
    min: showWithSupport ? applyElStøtte(priceStats.min) : priceStats.min,
    avg: showWithSupport ? applyElStøtte(priceStats.avg) : priceStats.avg,
    max: showWithSupport ? applyElStøtte(priceStats.max) : priceStats.max,
  };

  const simStatusRaw = entities?.['input_text.netzladung_sim_status']?.state || '';
  const sim4ct = getSimVariantData('4ct', entities);

  const tabBtnClass = (active) =>
    `px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
      active
        ? 'bg-[var(--glass-bg-hover)] text-[var(--text-primary)] border border-[var(--glass-border)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
    }`;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName="popup-anim relative max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border p-4 font-sans backdrop-blur-xl sm:max-h-[90vh] sm:p-6 md:rounded-[3rem] md:p-12"
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Top-right controls */}
          <div className="absolute top-4 right-4 z-20 flex gap-2 sm:top-6 sm:right-6 sm:gap-3 md:top-10 md:right-10">
            {!hideSupport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = !showWithSupport;
                  setShowWithSupport(newValue);
                  if (saveCardSetting && cardId) {
                    saveCardSetting(cardId, 'showWithSupport', newValue);
                  }
                }}
                className={`flex h-9 items-center gap-2 rounded-full border px-4 shadow-lg backdrop-blur-md transition-all ${showWithSupport ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)] hover:opacity-90' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]'}`}
              >
                {showWithSupport ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                <span className="hidden text-[10px] font-bold tracking-widest uppercase sm:inline">
                  {showWithSupport ? t('nordpool.withSupport') : t('nordpool.withoutSupport')}
                </span>
              </button>
            )}
            <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3 pr-24 font-sans sm:mb-6 sm:gap-4 sm:pr-0">
            <div
              className="rounded-2xl p-3 transition-all duration-500 sm:p-4"
              style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#fbbf24' }}
            >
              <Zap className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h3
                id={modalTitleId}
                className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic sm:text-2xl"
              >
                {name}
              </h3>
              <div
                className="mt-2 inline-block rounded-full border px-3 py-1 transition-all duration-500"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  borderColor: 'var(--glass-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <p className="text-[10px] font-bold tracking-widest uppercase italic">
                  {translate('power.title')}
                </p>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mb-4 flex gap-2 sm:mb-6">
            <button className={tabBtnClass(tab === 'preise')} onClick={() => setTab('preise')}>
              Preise
            </button>
            <button className={tabBtnClass(tab === 'automatisierung')} onClick={() => setTab('automatisierung')}>
              Automatisierung
            </button>
          </div>

          {/* Tab: Preise */}
          {tab === 'preise' && (
            <div className="grid grid-cols-1 items-start gap-4 font-sans sm:gap-12 lg:grid-cols-5">
              <div className="lg:col-span-3">
                {displayPriceData && displayPriceData.length > 0 && (
                  <div className="w-full">
                    <InteractivePowerGraph
                      key={`graph-${showWithSupport}`}
                      data={displayPriceData}
                      currentIndex={currentPriceIndex}
                      priceStats={displayPriceStats}
                      t={translate}
                      language={language}
                      unit={currency}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:col-span-2 lg:grid-cols-2">
                {displayPriceStats && (
                  <>
                    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3 transition-all sm:gap-2 sm:rounded-3xl sm:p-8 lg:col-span-2">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--accent-color)] uppercase sm:text-xs sm:tracking-[0.2em]">
                        {translate('power.avg')}
                      </p>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-2xl leading-none font-light text-[var(--accent-color)] italic sm:text-6xl">
                          {displayPriceStats.avg.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--text-muted)] sm:text-xl">
                          {currency}
                        </span>
                      </div>
                    </div>
                    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3 sm:rounded-3xl sm:p-6">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--status-success-fg)] uppercase sm:mb-1 sm:text-xs sm:tracking-[0.2em]">
                        {translate('power.low')}
                      </p>
                      <p className="text-2xl font-light text-[var(--text-primary)] sm:text-3xl">
                        {displayPriceStats.min.toFixed(2)}
                      </p>
                    </div>
                    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3 sm:rounded-3xl sm:p-6">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--status-error-fg)] uppercase sm:mb-1 sm:text-xs sm:tracking-[0.2em]">
                        {translate('power.high')}
                      </p>
                      <p className="text-2xl font-light text-[var(--text-primary)] sm:text-3xl">
                        {displayPriceStats.max.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab: Automatisierung */}
          {tab === 'automatisierung' && (
            <div className="flex flex-col gap-4 font-sans">
              {/* Status + 4ct-Ersparnis */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <SimStatusBadge raw={simStatusRaw} />
                </div>
                <div
                  className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 sm:w-36 sm:rounded-3xl sm:p-5"
                >
                  <p className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                    Ersparnis 4 ct
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-3xl font-light leading-none"
                      style={{
                        color:
                          sim4ct.ersparnis == null
                            ? 'var(--text-muted)'
                            : sim4ct.ersparnis >= 0
                            ? '#4ade80'
                            : '#f87171',
                      }}
                    >
                      {sim4ct.ersparnis != null
                        ? `${sim4ct.ersparnis >= 0 ? '+' : ''}${sim4ct.ersparnis.toFixed(2)}`
                        : '—'}
                    </span>
                    {sim4ct.ersparnis != null && (
                      <span className="text-sm text-[var(--text-muted)]">€</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Varianten-Vergleich */}
              <div>
                <p className="mb-2 text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                  Varianten-Vergleich
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {SIM_VARIANTS.map((v) => (
                    <VariantCard key={v.key} variant={v} entities={entities} />
                  ))}
                </div>
              </div>

              {/* Hinweis */}
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                Simulation läuft seit 09.10.2026 — belastbare Zahlen ab ca. November (weniger PV).
              </p>
            </div>
          )}
        </>
      )}
    </AccessibleModalShell>
  );
}
