import LightPanelCard from '../../components/cards/LightPanelCard';

export function renderLightPanelCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    callService,
    optimisticLightBrightness,
    setOptimisticLightBrightness,
    t,
  } = ctx;

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
      t={t}
    />
  );
}
