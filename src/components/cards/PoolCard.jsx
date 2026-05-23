import { memo } from 'react';
import { FaWaterLadder } from 'react-icons/fa6';

const VORLAUF    = 'sensor.poolsteuerung_d1_blueconnect_vorlauf';
const FILTERPUMPE = 'switch.poolsteuerung_d1_blueconnect_filterpumpe';
const WAERMEPUMPE = 'switch.poolsteuerung_d1_blueconnect_w_rmepumpe';
const BLUERIIOT_CONNECTION = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_connection_state';
const BLUERIIOT_PH  = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_ph';
const BLUERIIOT_ORP = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_orp';
const BLUERIIOT_PH_STATE  = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_ph_state';
const BLUERIIOT_ORP_STATE = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_orp_state';

function StatusChip({ label, active, warn }) {
  const color = warn
    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : active
      ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-border)]'
      : 'bg-[var(--glass-bg)] text-[var(--text-muted)] border-[var(--glass-border)]';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${color}`}>
      {label}
    </span>
  );
}

const PoolCard = memo(function PoolCard({
  cardId,
  dragProps,
  controls,
  cardStyle,
  entities,
  editMode,
  customNames,
  isMobile,
  isTwoColMobile,
  onOpen,
  t,
}) {
  const name = customNames?.[cardId] || 'Pool';
  const isUltraCompact = isTwoColMobile;
  const isDenseMobile = isMobile && !isTwoColMobile;

  const vorlauf    = entities[VORLAUF];
  const filterpumpe = entities[FILTERPUMPE];
  const waermepumpe = entities[WAERMEPUMPE];
  const blueConnected = entities[BLUERIIOT_CONNECTION]?.state === 'on';
  const ph  = entities[BLUERIIOT_PH];
  const orp = entities[BLUERIIOT_ORP];
  const phState  = entities[BLUERIIOT_PH_STATE]?.state;
  const orpState = entities[BLUERIIOT_ORP_STATE]?.state;

  const temp = vorlauf ? parseFloat(vorlauf.state) : null;
  const tempDisplay = Number.isFinite(temp) ? temp.toFixed(1) : '–';

  const filterOn = filterpumpe?.state === 'on';
  const waermeOn = waermepumpe?.state === 'on';

  if (isUltraCompact) {
    return (
      <div
        key={cardId}
        {...dragProps}
        data-haptic={editMode ? undefined : 'card'}
        onClick={(e) => { e.stopPropagation(); if (!editMode && onOpen) onOpen(); }}
        className={`glass-texture touch-feedback group relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-3xl border p-3 pl-4 font-sans transition-colors duration-500 ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
        style={cardStyle}
      >
        {controls}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <FaWaterLadder className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">{name}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-light text-[var(--text-primary)]">{tempDisplay}</span>
              <span className="text-[10px] text-[var(--text-muted)]">°C</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={cardId}
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      onClick={(e) => { e.stopPropagation(); if (!editMode && onOpen) onOpen(); }}
      className={`glass-texture touch-feedback group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border font-sans transition-colors duration-500 ${isDenseMobile ? 'p-5' : 'p-7'} ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
      style={cardStyle}
    >
      {controls}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={`transition-transform duration-500 group-hover:scale-110 ${isDenseMobile ? 'rounded-xl p-2.5' : 'rounded-2xl p-3'}`}
            style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
          >
            <FaWaterLadder className={isDenseMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {filterOn && <StatusChip label="Filter" active />}
            {waermeOn && <StatusChip label="Heizung" active />}
          </div>
        </div>

        <div className={isDenseMobile ? 'mt-3' : 'mt-4'}>
          <p className={`${isDenseMobile ? 'mb-1 text-[10px]' : 'mb-0.5 text-xs'} leading-none font-bold text-[var(--text-secondary)] uppercase opacity-60`} style={{ letterSpacing: '0.05em' }}>
            {name}
          </p>
          <div className="flex items-baseline gap-1 leading-none">
            <span className={`font-thin text-[var(--text-primary)] ${isDenseMobile ? 'text-3xl' : 'text-4xl'}`}>{tempDisplay}</span>
            <span className={`font-medium text-[var(--text-muted)] ${isDenseMobile ? 'text-sm' : 'text-base'}`}>°C</span>
          </div>
        </div>

        {blueConnected && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ph && (
              <StatusChip
                label={`pH ${parseFloat(ph.state).toFixed(1)}`}
                active={phState === 'on'}
                warn={phState === 'off'}
              />
            )}
            {orp && (
              <StatusChip
                label={`ORP ${Math.round(parseFloat(orp.state))}`}
                active={orpState === 'on'}
                warn={orpState === 'off'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PoolCard;
