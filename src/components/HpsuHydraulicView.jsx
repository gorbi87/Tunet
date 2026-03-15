import { useEffect, useRef } from 'react';
import hpsuSvgRaw from '../assets/hpsu.svg?raw';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Value rects: entity → SVG rect, positioning matches card.ts exactly
const SENSOR_MAP = [
  { entityId: 'sensor.daikin_heizung_aussentemperatur',                         rectId: 'ta_val',                  offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_expansionsventil',                         rectId: 'eev_val',                 offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_temperatur_fl_ssigkeitsleitung',           rectId: 'kondensat_value',         offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_umwaelzpumpe',                             rectId: 'uwp_value',               offset: 6, fontSize: '56' },
  { entityId: 'binary_sensor.daikin_heizung_status_kesselpumpe',                rectId: 'circ_pump_rect',          offset: 2, fontSize: '30', binary: true },
  { entityId: 'sensor.daikin_heizung_durchfluss',                               rectId: 'flow_rate_value',         offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_ruecklauftemperatur_heizung',              rectId: 'return_flow_can_value',   offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_r_cklauftemperatur',                       rectId: 'return_flow_uart_value',  offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_temperatur_lamellenw_rmetauscher',         rectId: 'evaporator_value',        offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_temperatur_nach_k_ltemittelverdichter',    rectId: 'hot_gas_value',           offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_spreizung',                                rectId: 'spread_value',            offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_heizkreis_vorlauf_tv',                     rectId: 'flow_can_value',          offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_vorlauftemeratur_tv',                      rectId: 'flow_uart_value',         offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_vorlauf_soll',                             rectId: 'flow_setpoint_value',     offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_wasserdruck',                              rectId: 'pressure_value',          offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_vorlauftemperatur_heizung_tvbh',           rectId: 'flow_bh_can_value',       offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_vorlauftemeratur_tvbh',                    rectId: 'flow_bh_uart_value',      offset: 6, fontSize: '56' },
  { entityId: 'binary_sensor.daikin_heizung_status_kompressor',                 rectId: 'comp_rect',               offset: 2, fontSize: '40', binary: true },
  { entityId: 'sensor.daikin_heizung_ventilatordrehzahl',                       rectId: 'fan_value',               offset: 6, fontSize: '44' },
  { entityId: 'sensor.daikin_heizung_kompressor_drehzahl',                      rectId: 'compressor_value',        offset: 6, fontSize: '44' },
  { entityId: 'sensor.daikin_heizung_warmwassertemperatur',                     rectId: 'storage_value',           offset: 6, fontSize: '56' },
  { entityId: 'select.daikin_heizung_t_ww_soll1',                              rectId: 'storage_setpoint_value',  offset: 6, fontSize: '56', digits: 0 },
  { entityId: 'select.daikin_heizung_heizst_be_f_r_pumpen_nach_oktober_2018',   rectId: 'buh_info_value',          offset: 6, fontSize: '56', text: true },
  { entityId: 'sensor.daikin_heizung_dhw_mischer_position',                     rectId: 'dhw_mixer_value',         offset: 6, fontSize: '40' },
  { entityId: 'sensor.daikin_heizung_bpv',                                      rectId: 'bypass_value',            offset: 6, fontSize: '40' },
  { entityId: 'sensor.daikin_heizung_fehlercode',                               rectId: 'fehlercode_value',        offset: 6, fontSize: '40', align: 'left', text: true,   prefix: 'Fehlercode: ' },
  { entityId: 'select.daikin_heizung_betriebsmodus',                            rectId: 'betriebsmodus_value',     offset: 6, fontSize: '40', align: 'left', text: true,   prefix: 'Modus: ' },
  { entityId: 'sensor.daikin_3_r_ech2o_seriell_can_betriebsart_can',           rectId: 'betriebsart_value',       offset: 6, fontSize: '40', align: 'left', text: true,   prefix: 'Betriebsart: ', shorten: true },
  { entityId: 'sensor.daikin_heizung_thermische_leistung',                      rectId: 'therm_leistung_value',    offset: 6, fontSize: '40', align: 'left', digits: 1,   prefix: 'Therm. Leistung: ' },
  { entityId: 'sensor.daikin_heizung_leistung',                                 rectId: 'el_power_value',          offset: 6, fontSize: '40', align: 'left', digits: 1,   prefix: 'Elektr. Leistung: ' },
  { entityId: 'sensor.daikin_heizung_cop',                                      rectId: 'cop_value',               offset: 6, fontSize: '40', align: 'left', digits: 2,   prefix: 'COP: ' },
  { entityId: 'sensor.klima_durchschnittliche_temperatur_haus',                 rectId: 't_room_is_value',         offset: 6, fontSize: '40', align: 'left', digits: 1,   prefix: 'Raum-Ist: ' },
];

// Label rects: static German labels, font-size=35, offset=3, fill=rgb(191,191,191)
// Mirrors card.ts createStateLabels label injection
const LABEL_MAP = [
  { rectId: 'ta_label',                label: 'TA' },
  { rectId: 'eev_label',               label: 'EEV' },
  { rectId: 'kondensat_label',         label: 'Kondensat' },
  { rectId: 'uwp_label',               label: 'Umwälzpumpe' },
  { rectId: 'flow_rate_label',         label: 'Durchfluss' },
  { rectId: 'return_flow_label',       label: 'Rücklauf' },
  { rectId: 'evaporator_label',        label: 'Verdampfer' },
  { rectId: 'hot_gas_label',           label: 'Heißgas' },
  { rectId: 'spread_label',            label: 'Spreizung' },
  { rectId: 'flow_label',              label: 'Vorlauf' },
  { rectId: 'flow_setpoint_label',     label: 'Vorlauf-Soll' },
  { rectId: 'pressure_label',          label: 'Druck' },
  { rectId: 'flow_bh_label',           label: 'Vorlauf BH' },
  { rectId: 'fan_label',               label: 'Lüfter' },
  { rectId: 'compressor_label',        label: 'Verdichter' },
  { rectId: 'storage_label',           label: 'Speicher' },
  { rectId: 'storage_setpoint_label',  label: 'Soll' },
  { rectId: 'buh_info_label',          label: 'Heizstab' },
];

// card.ts shortens this in SVG display
const BETRIEBSART_SHORT = {
  'Warmwasserbereitung': 'Warmwasser',
};

// Mirrors card.ts formatNumber: locale-aware decimal, unit_of_measurement appended
function formatNumber(entity, digits) {
  const v = Number(entity.state);
  if (isNaN(v)) return entity.state;
  const formatted = new Intl.NumberFormat('de', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
  const unit = entity.attributes?.unit_of_measurement;
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatState(entity, cfg) {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
    return { text: 'N/A', fill: 'orange', fontSize: '30' };
  }
  if (cfg.binary) {
    const on = entity.state === 'on';
    return { text: on ? 'An' : 'Aus', fill: on ? 'yellow' : 'silver' };
  }
  if (cfg.text) {
    const raw = cfg.shorten ? (BETRIEBSART_SHORT[entity.state] ?? entity.state) : entity.state;
    const text = cfg.prefix ? cfg.prefix + raw : raw;
    return { text, fill: 'silver' };
  }
  const value = formatNumber(entity, cfg.digits ?? 1);
  const text = cfg.prefix ? cfg.prefix + value : value;
  return { text, fill: 'silver' };
}

// Returns the rect's bounding box in SVG viewBox coordinates by using
// getBoundingClientRect — works correctly regardless of any transforms
// on the rect or its ancestor groups.
function getRectSVGBounds(rect, svgEl) {
  const rr = rect.getBoundingClientRect();
  const sr = svgEl.getBoundingClientRect();
  if (sr.width === 0 || sr.height === 0) return null;
  const vb = svgEl.viewBox.baseVal;
  const sx = vb.width / sr.width;
  const sy = vb.height / sr.height;
  return {
    x: (rr.left - sr.left) * sx + vb.x,
    y: (rr.top - sr.top) * sy + vb.y,
    w: rr.width * sx,
    h: rr.height * sy,
  };
}

function createTextEl(svgEl, rectId, x, y, anchor, fontSize, fill, content) {
  const textEl = document.createElementNS(SVG_NS, 'text');
  textEl.setAttribute('id', `${rectId}_text`);
  textEl.setAttribute('x', x);
  textEl.setAttribute('y', y);
  textEl.setAttribute('text-anchor', anchor);
  textEl.setAttribute('dominant-baseline', 'middle');
  textEl.setAttribute('font-size', fontSize);
  textEl.setAttribute('font-family', 'sans-serif');
  textEl.setAttribute('fill', fill);
  textEl.textContent = content;
  return textEl;
}

export function HpsuHydraulicView({ entities }) {
  const containerRef = useRef(null);
  const textMapRef = useRef({});
  const initializedRef = useRef(false);

  // Inject SVG and create all text elements once on mount
  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    containerRef.current.innerHTML = hpsuSvgRaw;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Hide unwanted rects (no entity mapped, not needed in display)
    ['ta2_label', 'ta2_val', 'hot_gas_condenser_label', 'hot_gas_condenser_value',
     'date_value', 'time_value'].forEach((id) => {
      const el = svgEl.getElementById(id);
      if (el) { el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'none'); }
    });

    // Inject static label texts into SVG root using actual rendered positions
    LABEL_MAP.forEach(({ rectId, label }) => {
      const rect = svgEl.getElementById(rectId);
      if (!rect) return;
      const b = getRectSVGBounds(rect, svgEl);
      if (!b) return;
      const textEl = createTextEl(
        svgEl, rectId,
        b.x + b.w / 2, b.y + b.h / 2 + 3,
        'middle', '35', 'rgb(191,191,191)', label
      );
      svgEl.appendChild(textEl);
    });

    // Inject dynamic value text placeholders into SVG root
    SENSOR_MAP.forEach((cfg) => {
      const rect = svgEl.getElementById(cfg.rectId);
      if (!rect) return;
      const b = getRectSVGBounds(rect, svgEl);
      if (!b) return;
      const x = cfg.align === 'left' ? b.x : b.x + b.w / 2;
      const anchor = cfg.align === 'left' ? 'start' : 'middle';
      const textEl = createTextEl(
        svgEl, cfg.rectId,
        x, b.y + b.h / 2 + cfg.offset,
        anchor, cfg.fontSize, 'silver', '…'
      );
      svgEl.appendChild(textEl);
      textMapRef.current[cfg.rectId] = { textEl, cfg };
    });
  }, []);

  // Update sensor values and arrow states whenever entities change
  useEffect(() => {
    if (!initializedRef.current) return;

    Object.values(textMapRef.current).forEach(({ textEl, cfg }) => {
      const entity = entities?.[cfg.entityId];
      const { text, fill, fontSize } = formatState(entity, cfg);
      textEl.textContent = text;
      textEl.setAttribute('fill', fill);
      textEl.setAttribute('font-size', fontSize ?? cfg.fontSize);
    });

    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    // Flow-dependent arrow opacity (mirrors card.ts updateOpacity exactly)
    const flowRate = parseFloat(entities?.['sensor.daikin_heizung_durchfluss']?.state) || 0;
    const mischerPct = parseFloat(entities?.['sensor.daikin_heizung_dhw_mischer_position']?.state) || 0;
    const bpvPct = parseFloat(entities?.['sensor.daikin_heizung_bpv']?.state) || 0;

    const dhwOpen   = svgEl.getElementById('dhw-open-arrows');
    const dhwClosed = svgEl.getElementById('dhw-closed-arrows');
    const bpvOpen   = svgEl.getElementById('bpv-open-arrows');
    const bpvClosed = svgEl.getElementById('bpv-closed-arrows');
    if (dhwOpen)   dhwOpen.style.opacity   = (flowRate > 0 ? mischerPct / 100 : 0).toString();
    if (dhwClosed) dhwClosed.style.opacity = (flowRate > 0 ? (100 - mischerPct) / 100 : 0).toString();
    if (bpvOpen)   bpvOpen.style.opacity   = (flowRate > 0 ? bpvPct / 100 : 0).toString();
    if (bpvClosed) bpvClosed.style.opacity = (flowRate > 0 ? (100 - bpvPct) / 100 : 0).toString();

    for (let i = 1; i <= 8; i++) {
      const arrow = svgEl.getElementById(`Flow-Arrow-${i}`);
      if (arrow) arrow.style.opacity = flowRate > 0 ? '1' : '0';
    }

    // Pressure equalization arrow fill (mirrors card.ts updateLabels)
    const pressEq = entities?.['binary_sensor.daikin_heizung_druckausgleich'];
    const eevColor = pressEq?.state === 'on' ? '#00ff0080' : '#7f7f7f';
    svgEl.getElementById('eev_arrow_left')?.setAttribute('fill', eevColor);
    svgEl.getElementById('eev_arrow_right')?.setAttribute('fill', eevColor);

    // Heizstab fill (mirrors card.ts updateLabels buh_power handling)
    const buhEntity = entities?.['select.daikin_heizung_heizst_be_f_r_pumpen_nach_oktober_2018'];
    const buhActive = buhEntity && parseFloat(buhEntity.state) > 0;
    svgEl.getElementById('buh-control')?.setAttribute('fill', buhActive ? '#d4aa00ff' : '#7f7f7f');
  }, [entities]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ aspectRatio: '2560 / 1570' }}
    />
  );
}
