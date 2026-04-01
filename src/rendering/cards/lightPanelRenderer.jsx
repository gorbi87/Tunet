import LightPanelCard from '../../components/cards/LightPanelCard';

export function renderLightPanelCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    callService,
    optimisticLightBrightness,
    setOptimisticLightBrightness,
    setShowLightModal,
    isMobile,
    t,
  } = ctx;

  const settings = cardSettings[settingsKey] || cardSettings[cardId] || {};

  return (
    <LightPanelCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      callService={callService}
      optimisticLightBrightness={optimisticLightBrightness}
      setOptimisticLightBrightness={setOptimisticLightBrightness}
      settings={settings}
      onOpenLightModal={setShowLightModal ? (entityId) => setShowLightModal(entityId) : null}
      isMobile={isMobile}
      t={t}
    />
  );
}
