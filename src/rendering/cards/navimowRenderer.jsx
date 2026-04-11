import { NavimowCard } from '../../components';

export function renderNavimowCard(mowerId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    getA,
    callService,
    setShowNavimowModal,
    isMobile,
    t,
  } = ctx;
  return (
    <NavimowCard
      key={mowerId}
      mowerId={mowerId}
      dragProps={dragProps}
      controls={getControls(mowerId)}
      cardStyle={cardStyle}
      entities={entities}
      editMode={editMode}
      cardSettings={cardSettings}
      settingsKey={settingsKey}
      customNames={customNames}
      customIcons={customIcons}
      getA={getA}
      callService={callService}
      onOpen={() => { if (!editMode && setShowNavimowModal) setShowNavimowModal(mowerId); }}
      isMobile={isMobile}
      t={t}
    />
  );
}
