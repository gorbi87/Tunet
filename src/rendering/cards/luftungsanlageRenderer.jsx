import GenericLuftungsanlageCard from '../../components/cards/GenericLuftungsanlageCard';
import { getSettings, renderMissingEntityWhenReady } from '../helpers';
import { LUFTUNGSANLAGE_ENTITY_IDS } from '../../components/cards/GenericLuftungsanlageCard';

export function renderLuftungsanlageCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    isMobile,
    saveCardSetting,
    setShowLuftungsanlageModal,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);

  // Show missing entity placeholder if primary entity is unavailable
  const primaryEntity = entities?.[LUFTUNGSANLAGE_ENTITY_IDS.climate];
  if (!primaryEntity) {
    return renderMissingEntityWhenReady(ctx, {
      cardId,
      dragProps,
      controls: getControls(cardId),
      cardStyle,
      missingEntityId: LUFTUNGSANLAGE_ENTITY_IDS.climate,
      t,
    });
  }

  return (
    <GenericLuftungsanlageCard
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      customNames={customNames}
      customIcons={customIcons}
      onOpen={() => setShowLuftungsanlageModal && setShowLuftungsanlageModal(cardId)}
      isMobile={isMobile}
      settings={settings}
      saveCardSetting={saveCardSetting}
      t={t}
    />
  );
}
