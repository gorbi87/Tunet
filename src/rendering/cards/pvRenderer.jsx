import GenericPvCard from '../../components/cards/GenericPvCard';
import { getSettings, renderMissingEntityWhenReady } from '../helpers';
import { PV_ENTITY_IDS } from '../../components/cards/GenericPvCard';

export function renderPvCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    isMobile,
    isTwoColMobile,
    saveCardSetting,
    setShowPvModal,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);

  const primaryEntity = entities?.[PV_ENTITY_IDS.pvW];
  if (!primaryEntity) {
    return renderMissingEntityWhenReady(ctx, {
      cardId,
      dragProps,
      controls: getControls(cardId),
      cardStyle,
      missingEntityId: PV_ENTITY_IDS.pvW,
      t,
    });
  }

  return (
    <GenericPvCard
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      customNames={customNames}
      customIcons={customIcons}
      onOpen={() => setShowPvModal && setShowPvModal(cardId)}
      isMobile={isMobile}
      isTwoColMobile={isTwoColMobile}
      settings={settings}
      saveCardSetting={saveCardSetting}
      t={t}
    />
  );
}
