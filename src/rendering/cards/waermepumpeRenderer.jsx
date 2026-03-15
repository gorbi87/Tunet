import GenericWaermepumpeCard from '../../components/cards/GenericWaermepumpeCard';
import { getSettings, renderMissingEntityWhenReady } from '../helpers';
import { WAERMEPUMPE_ENTITY_IDS } from '../../components/cards/GenericWaermepumpeCard';

export function renderWaermepumpeCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    isMobile,
    saveCardSetting,
    setShowWaermepumpeModal,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);

  // Show missing entity placeholder if primary entity is unavailable
  const primaryEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.warmwasser];
  if (!primaryEntity) {
    return renderMissingEntityWhenReady(ctx, {
      cardId,
      dragProps,
      controls: getControls(cardId),
      cardStyle,
      missingEntityId: WAERMEPUMPE_ENTITY_IDS.warmwasser,
      t,
    });
  }

  return (
    <GenericWaermepumpeCard
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      customNames={customNames}
      customIcons={customIcons}
      onOpen={() => setShowWaermepumpeModal && setShowWaermepumpeModal(cardId)}
      isMobile={isMobile}
      settings={settings}
      saveCardSetting={saveCardSetting}
      t={t}
    />
  );
}
