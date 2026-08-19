import { useEffect, useMemo, useState } from 'react';
import { Fan, RefreshCw, X, MoveHorizontal, RotateCw } from '../icons';
import M3Slider from '../components/ui/M3Slider';
import ModernDropdown from '../components/ui/ModernDropdown';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const FAN_FEATURE = {
  SET_SPEED: 1,
  OSCILLATE: 2,
  DIRECTION: 4,
  PRESET_MODE: 8,
  TURN_OFF: 16,
  TURN_ON: 32,
};

const supportsFeature = (supportedFeatures, bitMask) => {
  if (!Number.isFinite(supportedFeatures)) return false;
  return (supportedFeatures & bitMask) !== 0;
};

export default function GenericFanModal({ show, onClose, entityId, entity, callService, t }) {
  const activeEntityId = entityId || '';
  const activeEntity = entity || { state: 'unknown', attributes: {} };

  const state = String(activeEntity.state || 'unknown').toLowerCase();
  const isOn = state === 'on';
  const isUnavailable = state === 'unavailable' || state === 'unknown';

  const supportedFeatures = Number(activeEntity.attributes?.supported_features || 0);
  const canTurnOn = supportsFeature(supportedFeatures, FAN_FEATURE.TURN_ON);
  const canTurnOff = supportsFeature(supportedFeatures, FAN_FEATURE.TURN_OFF);
  const hasPowerControl = canTurnOn || canTurnOff;
  const hasPercentageControl = supportsFeature(supportedFeatures, FAN_FEATURE.SET_SPEED);
  const hasOscillationControl = supportsFeature(supportedFeatures, FAN_FEATURE.OSCILLATE);
  const hasDirectionControl = supportsFeature(supportedFeatures, FAN_FEATURE.DIRECTION);
  const hasPresetControl = supportsFeature(supportedFeatures, FAN_FEATURE.PRESET_MODE);

  const percentageStep = Number(activeEntity.attributes?.percentage_step || 1);
  const minimumStep = Number.isFinite(percentageStep) && percentageStep > 0 ? percentageStep : 1;
  const percentageRaw = Number(activeEntity.attributes?.percentage ?? 0);
  const percentage = Number.isFinite(percentageRaw)
    ? Math.max(0, Math.min(100, Math.round(percentageRaw)))
    : 0;
  const oscillating =
    activeEntity.attributes?.oscillating === true || activeEntity.attributes?.oscillating === 'on';
  const direction = activeEntity.attributes?.direction || null;
  const presetMode = activeEntity.attributes?.preset_mode || null;
  const presetModes = Array.isArray(activeEntity.attributes?.preset_modes)
    ? activeEntity.attributes.preset_modes
    : [];
  const fanName = activeEntity.attributes?.friendly_name || activeEntityId;
  const modalTitleId = `fan-modal-title-${activeEntityId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  const [sliderValue, setSliderValue] = useState(percentage);

  useEffect(() => {
    if (!show) return;
    setSliderValue(percentage);
  }, [percentage, show]);

  useEffect(() => {
    if (!show || !activeEntityId || !entity || !hasPercentageControl) return undefined;
    const timeoutId = setTimeout(() => {
      if (sliderValue !== percentage) {
        callService('fan', 'set_percentage', {
          entity_id: activeEntityId,
          percentage: sliderValue,
        });
      }
    }, 180);
    return () => clearTimeout(timeoutId);
  }, [sliderValue, percentage, hasPercentageControl, activeEntityId, callService, show, entity]);

  const statusText = useMemo(() => {
    if (isUnavailable) return t('common.unknown');
    if (!isOn) return t('status.off');
    if (hasPresetControl && presetMode) return String(presetMode);
    if (hasPercentageControl) return `${percentage}%`;
    return t('status.on');
  }, [isUnavailable, isOn, presetMode, percentage, t, hasPresetControl, hasPercentageControl]);

  const handlePowerToggle = () => {
    if (!activeEntityId || !entity || !hasPowerControl || isUnavailable) return;
    if (isOn) {
      if (!canTurnOff) return;
      callService('fan', 'turn_off', { entity_id: activeEntityId });
      return;
    }
    if (!canTurnOn) return;
    callService('fan', 'turn_on', { entity_id: activeEntityId });
  };

  const directionMap = {
    forward: t('fan.direction.forward'),
    reverse: t('fan.direction.reverse'),
  };

  if (!show || !activeEntityId || !entity) return null;

  return (
    <AccessibleModalShell
      open={show && !!activeEntityId && !!entity}
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
        <button
          onClick={onClose}
          className="modal-close absolute top-4 right-4 sm:top-6 sm:right-6 md:top-10 md:right-10"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3 pr-12 font-sans sm:mb-6 sm:gap-4 sm:pr-0">
          <div
            className="rounded-2xl p-3 transition-all duration-500 sm:p-4"
            style={{
              backgroundColor: isOn
                ? 'color-mix(in srgb, var(--accent-color) 18%, transparent)'
                : 'var(--glass-bg)',
              color: isOn ? 'var(--accent-color)' : 'var(--text-secondary)',
            }}
          >
            <Fan className={`h-6 w-6 sm:h-8 sm:w-8 ${isOn ? 'animate-spin [animation-duration:2.4s]' : ''}`} />
          </div>
          <div>
            <h3
              id={modalTitleId}
              className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic sm:text-2xl"
            >
              {fanName}
            </h3>
            <div className="mt-2 inline-block rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1 text-[var(--text-secondary)] transition-all duration-500">
              <p className="text-[10px] font-bold tracking-widest uppercase italic">{statusText}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 font-sans sm:gap-12 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="popup-surface flex flex-col gap-4 rounded-3xl p-4 sm:gap-8 sm:p-8">
              <div className="flex w-full gap-4">
                {hasPowerControl && (
                  <button
                    onClick={handlePowerToggle}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold tracking-widest uppercase transition-all sm:gap-3 sm:py-5 sm:text-sm ${isOn ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]' : 'bg-[var(--accent-color)] text-white shadow-lg hover:bg-[var(--accent-color)]'}`}
                  >
                    <Fan className="h-5 w-5" />
                    {isOn ? t('fan.turnOff') : t('fan.turnOn')}
                  </button>
                )}
                {hasOscillationControl && (
                  <button
                    onClick={() =>
                      callService('fan', 'oscillate', {
                        entity_id: activeEntityId,
                        oscillating: !oscillating,
                      })
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold tracking-widest uppercase transition-all sm:gap-3 sm:py-5 sm:text-sm ${hasPowerControl ? 'flex-1' : 'w-full'} ${oscillating ? 'border border-[var(--accent-color)] bg-[var(--accent-bg)] text-[var(--accent-color)] shadow-lg hover:opacity-90' : 'bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'}`}
                  >
                    <MoveHorizontal className="h-5 w-5" />
                    {t('fan.oscillate')}
                  </button>
                )}
              </div>

              {hasPercentageControl && (
                <div>
                  <div className="mb-4 flex items-center justify-between px-1">
                    <span className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                      {t('fan.speed')}
                    </span>
                    <span className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                      {sliderValue}%
                    </span>
                  </div>
                  <M3Slider
                    min={0}
                    max={100}
                    step={minimumStep}
                    value={sliderValue}
                    onChange={(event) => setSliderValue(Number(event.target.value))}
                    colorClass="bg-[var(--accent-color)]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-start space-y-4 font-sans italic sm:space-y-10 sm:py-4 lg:col-span-2">
            {hasDirectionControl && (
              <ModernDropdown
                label={t('fan.direction')}
                icon={RotateCw}
                options={['forward', 'reverse']}
                current={direction}
                onChange={(value) =>
                  callService('fan', 'set_direction', {
                    entity_id: activeEntityId,
                    direction: value,
                  })
                }
                placeholder={t('dropdown.noneSelected')}
                map={directionMap}
              />
            )}

            {hasPresetControl && (
              <ModernDropdown
                label={t('fan.preset')}
                icon={RefreshCw}
                options={presetModes}
                current={presetMode}
                onChange={(value) =>
                  callService('fan', 'set_preset_mode', {
                    entity_id: activeEntityId,
                    preset_mode: value,
                  })
                }
                placeholder={t('dropdown.noneSelected')}
                map={{}}
              />
            )}
          </div>
        </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
