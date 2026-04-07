import SecurityPanelCard from '../../components/cards/SecurityPanelCard';

export function renderSecurityPanelCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    callService,
    isMobile,
    setShowSecurityLockModal,
    setShowSecurityContactsModal,
  } = ctx;

  return (
    <SecurityPanelCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      entities={entities}
      callService={callService}
      isMobile={isMobile}
      setShowSecurityLockModal={setShowSecurityLockModal}
      setShowSecurityContactsModal={setShowSecurityContactsModal}
    />
  );
}
