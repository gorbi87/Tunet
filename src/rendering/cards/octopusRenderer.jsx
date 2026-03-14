import { GenericOctopusCard } from '../../components';
import { getSettings, renderMissingEntityWhenReady } from '../helpers';

export function renderOctopusCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    isMobile,
    saveCardSetting,
    setShowNordpoolModal,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);
  const entity = entities[settings.octopusId];
  if (!entity) {
    return renderMissingEntityWhenReady(ctx, {
      cardId,
      dragProps,
      controls: getControls(cardId),
      cardStyle,
      missingEntityId: settings.octopusId || cardId,
      t,
    });
  }

  return (
    <GenericOctopusCard
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entity={entity}
      customNames={customNames}
      customIcons={customIcons}
      onOpen={() => setShowNordpoolModal(cardId)}
      isMobile={isMobile}
      settings={settings}
      saveCardSetting={saveCardSetting}
      t={t}
    />
  );
}
