import { MediaPlayerCard } from '../../components';
import { renderMissingEntityWhenReady } from '../helpers';

export function renderMediaPlayerCard(mpId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    customNames,
    customIcons,
    getA,
    getEntityImageUrl,
    callService,
    isMediaActive,
    openMediaModal,
    cardSettings,
    isMobile,
    t,
  } = ctx;
  if (!entities[mpId]) {
    return renderMissingEntityWhenReady(ctx, {
      cardId: mpId,
      dragProps,
      controls: getControls(mpId),
      cardStyle,
      missingEntityId: mpId,
      t,
    });
  }
  return (
    <MediaPlayerCard
      key={mpId}
      mpId={mpId}
      cardId={mpId}
      dragProps={dragProps}
      controls={getControls(mpId)}
      cardStyle={cardStyle}
      entities={entities}
      editMode={editMode}
      customNames={customNames}
      customIcons={customIcons}
      getA={getA}
      getEntityImageUrl={getEntityImageUrl}
      callService={callService}
      isMediaActive={isMediaActive}
      onOpen={openMediaModal}
      isMobile={isMobile}
      t={t}
      cardSettings={cardSettings}
      settingsKey={settingsKey}
    />
  );
}
