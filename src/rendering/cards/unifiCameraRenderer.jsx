import { CameraCard } from '../../components';
import { getSettings, renderMissingEntityWhenReady } from '../helpers';

export function renderUnifiCameraCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    entities,
    editMode,
    cardSettings,
    customNames,
    customIcons,
    getEntityImageUrl,
    setShowUnifiCameraModal,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);
  const entityId = settings.cameraId;
  const entity = entityId ? entities[entityId] : null;
  const sizeSetting = settings.size;

  if (!entity || !entityId) {
    return renderMissingEntityWhenReady(ctx, {
      cardId,
      dragProps,
      controls: getControls(cardId),
      cardStyle,
      missingEntityId: entityId || cardId,
      t,
    });
  }

  return (
    <CameraCard
      key={cardId}
      cardId={cardId}
      entityId={entityId}
      entity={entity}
      settings={settings}
      entities={entities}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      customNames={customNames}
      customIcons={customIcons}
      getEntityImageUrl={getEntityImageUrl}
      onOpen={() => setShowUnifiCameraModal && setShowUnifiCameraModal(cardId)}
      size={sizeSetting}
      t={t}
    />
  );
}
