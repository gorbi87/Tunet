import SecurityPanelCard from '../../components/cards/SecurityPanelCard';

export function renderSecurityPanelCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const { entities, editMode, isMobile } = ctx;

  return (
    <SecurityPanelCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      isMobile={isMobile}
    />
  );
}
