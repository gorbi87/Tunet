import { memo, useMemo, useState } from 'react';
import { Clock, Lightbulb, Plane, Plus } from '../../icons';
import { useHomeAssistantMeta } from '../../contexts';
import { scheduleActions, useSchedules } from '../../hooks/useSchedules';
import {
  activeInstance,
  eventVerb,
  formatClock,
  formatWhen,
  isSkipped,
  nextEvents,
  scheduleContext,
  scheduleTitle,
} from '../../utils/scheduleModel';
import { openScheduleEditor, openScheduleOverview } from '../../utils/scheduleEvents';
import DayStrip from '../schedule/DayStrip';

const stop = (e) => e.stopPropagation();

/** Ein Zeitplan als kompakte Zeile: Name + Schalter, Status mit Uhrzeiten, Tagesleiste. */
function ScheduleEntry({ schedule, entities, ctx, now, vacation, t }) {
  const [busy, setBusy] = useState(false);
  const running = schedule.enabled ? activeInstance(schedule, now, ctx, { vacation }) : null;
  const events = schedule.enabled ? nextEvents(schedule, now, ctx, { vacation }, { limit: 2 }) : [];
  const next = events[0];
  const skipped = next && isSkipped(schedule, next);
  const ids = schedule.targets?.entities || [];
  const litCount = ids.filter((id) => entities?.[id]?.state === 'on').length;

  const toggle = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      await scheduleActions.setEnabled(schedule, !schedule.enabled);
    } finally {
      setBusy(false);
    }
  };

  let status;
  if (!schedule.enabled) status = <span className="text-[var(--text-muted)]">{t('schedule.cardOff')}</span>;
  else if (running && next?.kind === 'end') {
    status = (
      <span className="font-semibold text-[var(--accent-color)]">
        {t('schedule.cardRunning')} · {t('schedule.cardUntil')} {formatClock(next.at, ctx.tz)}
      </span>
    );
  } else if (next?.kind === 'start') {
    const end = events[1]?.kind === 'end' && events[1].instanceKey === next.instanceKey ? events[1] : null;
    status = (
      <span className={skipped ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)]'}>
        {formatWhen(next.at, now, ctx.tz, t)}
        {end ? ` – ${formatClock(end.at, ctx.tz)}` : ` ${eventVerb(schedule, 'start', t)}`}
      </span>
    );
  } else if (next) {
    status = (
      <span className="text-[var(--text-secondary)]">
        {eventVerb(schedule, next.kind, t)} {formatWhen(next.at, now, ctx.tz, t)}
      </span>
    );
  } else status = <span className="text-[var(--text-muted)]">{t('schedule.nothingSoon')}</span>;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        openScheduleEditor({ schedule });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) openScheduleEditor({ schedule });
      }}
      className={`flex flex-col gap-1 rounded-xl px-2 py-1.5 transition-colors hover:bg-[var(--glass-bg-hover)] ${schedule.enabled ? '' : 'opacity-55'}`}
    >
      <div className="flex items-center gap-1.5">
        <Lightbulb
          className={`h-3.5 w-3.5 flex-shrink-0 ${litCount ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}
          aria-label={ids.length ? `${litCount}/${ids.length} ${t('schedule.cardLit')}` : undefined}
        />
        <p className="min-w-0 flex-1 truncate text-[13px] leading-tight font-bold text-[var(--text-primary)]">{scheduleTitle(schedule, entities)}</p>
        <button
          type="button"
          role="switch"
          aria-checked={schedule.enabled}
          aria-label={t('schedule.enabled')}
          disabled={busy}
          onClick={toggle}
          onPointerDown={stop}
          className={`relative h-[18px] w-8 flex-shrink-0 rounded-full transition-colors ${schedule.enabled ? 'bg-[var(--accent-color)]' : 'bg-[var(--glass-bg-hover)]'}`}
        >
          <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${schedule.enabled ? 'left-[16px]' : 'left-0.5'}`} />
        </button>
      </div>
      <p className="flex items-center gap-1 truncate text-[11px] leading-tight tabular-nums">
        {running && <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-[var(--accent-color)]" />}
        {status}
      </p>
      <DayStrip schedule={schedule} ctx={ctx} now={now} vacation={vacation} className="h-1" dim={!schedule.enabled} />
    </div>
  );
}

/** Karte „Zeitschaltuhr“: alle Zeitpläne mit Tagesleiste und Schalter; Tippen auf einen Eintrag bearbeitet ihn. */
function ZeitschaltuhrCard({ cardId, dragProps, controls, cardStyle, editMode, entities, t }) {
  const { haConfig } = useHomeAssistantMeta();
  const { schedules, settings, loaded, error } = useSchedules();
  const ctx = useMemo(() => scheduleContext(haConfig), [haConfig]);
  const now = Date.now();
  const minute = Math.floor(now / 60_000);
  const vacation = Boolean(settings?.vacation);

  // Laufende zuerst, dann nach nächster Schaltung; ausgeschaltete ans Ende
  const sorted = useMemo(() => {
    const at = minute * 60_000;
    const rank = (s) => {
      if (!s.enabled) return [2, 0];
      if (activeInstance(s, at, ctx, { vacation })) return [0, 0];
      return [1, nextEvents(s, at, ctx, { vacation }, { limit: 1 })[0]?.at ?? Infinity];
    };
    return schedules
      .map((s) => ({ s, r: rank(s) }))
      .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1])
      .map((x) => x.s);
  }, [schedules, ctx, vacation, minute]);

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`glass-texture touch-feedback relative flex h-full flex-col gap-1.5 overflow-hidden rounded-3xl border p-3 font-sans select-none ${editMode ? 'cursor-move' : 'cursor-pointer'}`}
      style={cardStyle}
      {...(!editMode
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': t('schedule.title'),
            onClick: openScheduleOverview,
            onKeyDown: (e) => e.key === 'Enter' && e.target === e.currentTarget && openScheduleOverview(),
          }
        : {})}
    >
      {controls}
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          {t('schedule.title')}
        </p>
        <div className="flex items-center gap-1.5">
          {vacation && <Plane className="h-3.5 w-3.5 text-amber-400" aria-label={t('schedule.vacation')} />}
          {!editMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openScheduleEditor({});
              }}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label={t('schedule.new')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!loaded ? (
        <span className="text-xs text-[var(--text-muted)]">…</span>
      ) : error ? (
        <span className="text-xs text-[var(--status-error-fg)]">{t('schedule.loadError')}</span>
      ) : sorted.length === 0 ? (
        <div className="flex flex-1 items-center">
          <span className="text-sm text-[var(--text-muted)]">{t('schedule.emptyHint')}</span>
        </div>
      ) : (
        <div className={`-mx-1.5 grid min-h-0 flex-1 content-start gap-x-3 gap-y-0.5 ${editMode ? 'pointer-events-none overflow-hidden' : 'overflow-y-auto'}`} style={{ scrollbarWidth: 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 100%), 1fr))' }}>
          {sorted.map((s) => (
            <ScheduleEntry key={s.id} schedule={s} entities={entities} ctx={ctx} now={now} vacation={vacation} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ZeitschaltuhrCard);
