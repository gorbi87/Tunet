import { PoolCard } from '../../components';

const FILTERPUMPE = 'switch.poolsteuerung_d1_blueconnect_filterpumpe';

export function renderPoolCard(cardId, dragProps, getControls, cardStyle, _settingsKey, ctx) {
  const { entities, editMode, customNames, isMobile, isTwoColMobile, setShowPoolModal, t } = ctx;

  const filterpumpe = entities[FILTERPUMPE];
  if (!filterpumpe || filterpumpe.state === 'unavailable') return null;

  return (
    <PoolCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      entities={entities}
      editMode={editMode}
      customNames={customNames}
      isMobile={isMobile}
      isTwoColMobile={isTwoColMobile}
      onOpen={() => { if (!editMode && setShowPoolModal) setShowPoolModal(cardId); }}
      t={t}
    />
  );
}
