/**
 * Prepare Octopus Energy price data for the NordpoolModal.
 * Returns { fullPriceData, currentPriceIndex, priceStats, name, settings, entity } or null.
 */
export function prepareOctopusData(
  cardId,
  { getCardSettingsKey, cardSettings, entities, customNames }
) {
  const settingsKey = getCardSettingsKey(cardId);
  const settings = cardSettings[settingsKey] || cardSettings[cardId] || {};
  const entity = entities[settings.octopusId];
  if (!entity) return null;

  const rates = Array.isArray(entity.attributes?.rates) ? entity.attributes.rates : [];
  if (rates.length === 0) return null;

  const now = new Date();

  // Map rates to { start, end, value } and find current index
  const fullPriceData = rates.map((r) => ({
    start: r.start,
    end: r.end,
    value: typeof r.value_inc_vat === 'number' ? r.value_inc_vat : 0,
  }));

  const currentPriceIndex = fullPriceData.findIndex((d) => {
    const start = new Date(d.start);
    const end = new Date(d.end);
    return now >= start && now < end;
  });

  const values = fullPriceData.map((d) => d.value).filter((v) => !Number.isNaN(v));
  const priceStats =
    values.length > 0
      ? {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        }
      : { min: 0, max: 0, avg: 0 };

  const name = customNames?.[cardId] || entity.attributes?.friendly_name || cardId;

  return { entity, settings, fullPriceData, currentPriceIndex, priceStats, name };
}
