import { memo, useMemo } from 'react';
import { Clock, Plane, Plus } from '../../icons';
import { useHomeAssistantMeta } from '../../contexts';
import { useSchedules } from '../../hooks/useSchedules';
import {
  eventVerb,
  formatWhen,
  isSkipped,
  nextEvents,
  scheduleContext,
  scheduleTitle,
} from '../../utils/scheduleModel';
import { openScheduleEditor, openScheduleOverview } from '../../utils/scheduleEvents';

/** Karte „Zeitschaltuhr“: die nächsten Schaltungen; Tippen öffnet die Übersicht, + einen neuen Zeitplan. */
function ZeitschaltuhrCard({ cardId, dragProps, controls, cardStyle, editMode, entities, t }) {
  const { haConfig } = useHomeAssistantMeta();
  const { schedules, settings, loaded, error } = useSchedules();
  const ctx = useMemo(() => scheduleContext(haConfig), [haConfig]);
  const now = Date.now();
  const vacation = Boolean(settings?.vacation);

  const upcoming = useMemo(
    () =>
      schedules
        .filter((s) => s.enabled)
        .flatMap((s) => nextEvents(s, now, ctx, { vacation }, { limit: 2, days: 3 }).map((e) => ({ ...e, schedule: s })))
        .sort((a, b) => a.at - b.at)
        .slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, ctx, vacation, Math.floor(now / 60_000)]
  );
  const activeCount = schedules.filter((s) => s.enabled).length;

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`glass-texture touch-feedback relative flex h-full flex-col gap-2 overflow-hidden rounded-3xl border p-3.5 font-sans select-none ${editMode ? 'cursor-move' : 'cursor-pointer'}`}
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
        <p className="flex items-center gap-1.5 truncate text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          <Clock className="h-3.5 w-3.5" />
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
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label={t('schedule.new')}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {!loaded ? (
          <span className="text-xs text-[var(--text-muted)]">…</span>
        ) : error ? (
          <span className="text-xs text-[var(--status-error-fg)]">{t('schedule.loadError')}</span>
        ) : upcoming.length === 0 ? (
          <span className="text-sm text-[var(--text-muted)]">{activeCount ? t('schedule.nothingSoon') : t('schedule.emptyHint')}</span>
        ) : (
          upcoming.map((e) => (
            <div key={`${e.instanceKey}-${e.kind}`} className={`flex items-baseline justify-between gap-2 ${isSkipped(e.schedule, e) ? 'opacity-40 line-through' : ''}`}>
              <span className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                {scheduleTitle(e.schedule, entities)} <span className="font-normal text-[var(--text-muted)]">{eventVerb(e.schedule, e.kind, t)}</span>
              </span>
              <span className="flex-shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">{formatWhen(e.at, now, ctx.tz, t)}</span>
            </div>
          ))
        )}
      </div>
      {activeCount > 0 && (
        <p className="text-[10px] text-[var(--text-muted)]">
          {activeCount} {activeCount === 1 ? t('schedule.activeOne') : t('schedule.activeMany')}
        </p>
      )}
    </div>
  );
}

export default memo(ZeitschaltuhrCard);
