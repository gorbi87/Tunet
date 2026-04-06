import CoverPanelCard from '../../components/cards/CoverPanelCard';

export function renderCoverPanelCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const { entities, editMode, cardSettings, callService, isMobile, setShowCoverModal } = ctx;
  const settings = cardSettings[settingsKey] || cardSettings[cardId] || {};

  return (
    <CoverPanelCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      callService={callService}
      settings={settings}
      isMobile={isMobile}
      setShowCoverModal={setShowCoverModal}
    />
  );
}
