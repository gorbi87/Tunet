import { useEffect, useRef } from 'react';
import hpsuSvgRaw from '../assets/hpsu.svg?raw';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Maps HA entity IDs → SVG rect IDs with display params
// Positioning/colors match card.ts from wrfz/daikin-rotex-hpsu-dashboard exactly
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
  { entityId: 'sensor.daikin_heizung_ventilatordrehzahl',                       rectId: 'fan_value',               offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_kompressor_drehzahl',                      rectId: 'compressor_value',        offset: 6, fontSize: '56' },
  { entityId: 'sensor.daikin_heizung_warmwassertemperatur',                     rectId: 'storage_value',           offset: 6, fontSize: '56' },
  { entityId: 'select.daikin_heizung_t_ww_soll1',                              rectId: 'storage_setpoint_value',  offset: 6, fontSize: '56', digits: 0 },
  { entityId: 'select.daikin_heizung_heizst_be_f_r_pumpen_nach_oktober_2018',   rectId: 'buh_info_value',          offset: 6, fontSize: '56', text: true },
  { entityId: 'sensor.daikin_heizung_dhw_mischer_position',                     rectId: 'dhw_mixer_value',         offset: 6, fontSize: '40' },
  { entityId: 'sensor.daikin_heizung_bpv',                                      rectId: 'bypass_value',            offset: 6, fontSize: '40' },
  { entityId: 'sensor.daikin_heizung_fehlercode',                               rectId: 'fehlercode_value',        offset: 6, fontSize: '40', align: 'left', text: true },
  { entityId: 'select.daikin_heizung_betriebsmodus',                            rectId: 'betriebsmodus_value',     offset: 6, fontSize: '40', align: 'left', text: true },
  { entityId: 'sensor.daikin_3_r_ech2o_seriell_can_betriebsart_can',           rectId: 'betriebsart_value',       offset: 6, fontSize: '40', align: 'left', text: true },
  { entityId: 'sensor.daikin_heizung_thermische_leistung',                      rectId: 'therm_leistung_value',    offset: 6, fontSize: '40', align: 'left', digits: 2, prefix: 'Therm. Leistung: ' },
  { entityId: 'sensor.daikin_heizung_leistung',                                 rectId: 'el_power_value',          offset: 6, fontSize: '40', align: 'left', digits: 2, prefix: 'Elektr. Leistung: ' },
  { entityId: 'sensor.daikin_heizung_cop',                                      rectId: 'cop_value',               offset: 6, fontSize: '40', align: 'left', digits: 2, prefix: 'COP: ' },
  { entityId: 'sensor.klima_durchschnittliche_temperatur_haus',                 rectId: 't_room_is_value',         offset: 6, fontSize: '40', align: 'left', digits: 1, prefix: 'Raum-Ist: ' },
];

function formatState(entity, cfg) {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
    return { text: 'N/A', fill: 'orange', fontSize: '30' };
  }
  if (cfg.binary) {
    const on = entity.state === 'on';
    return { text: on ? 'An' : 'Aus', fill: on ? 'yellow' : 'silver' };
  }
  if (cfg.text) {
    return { text: entity.state, fill: 'silver' };
  }
  const v = parseFloat(entity.state);
  const formatted = Number.isFinite(v) ? v.toFixed(cfg.digits ?? 1) : entity.state;
  // card.ts shortens "Warmwasserbereitung" → "Warmwasser" in the SVG
  const shortened = formatted === 'Warmwasserbereitung' ? 'Warmwasser' : formatted;
  const text = cfg.prefix ? cfg.prefix + shortened : shortened;
  return { text, fill: 'silver' };
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

    SENSOR_MAP.forEach((cfg) => {
      const rect = svgEl.getElementById(cfg.rectId);
      if (!rect) return;

      const rx = parseFloat(rect.getAttribute('x') || 0);
      const ry = parseFloat(rect.getAttribute('y') || 0);
      const rw = parseFloat(rect.getAttribute('width') || 0);
      const rh = parseFloat(rect.getAttribute('height') || 0);

      const textEl = document.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('id', `${cfg.rectId}_text`);
      if (cfg.align === 'left') {
        textEl.setAttribute('x', rx);
        textEl.setAttribute('text-anchor', 'start');
      } else {
        textEl.setAttribute('x', rx + rw / 2);
        textEl.setAttribute('text-anchor', 'middle');
      }
      textEl.setAttribute('y', ry + rh / 2 + cfg.offset);
      textEl.setAttribute('dominant-baseline', 'middle');
      textEl.setAttribute('font-size', cfg.fontSize);
      textEl.setAttribute('font-family', 'sans-serif');
      textEl.setAttribute('fill', 'silver');
      textEl.textContent = '…';

      rect.parentNode.insertBefore(textEl, rect.nextSibling);
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
      if (fontSize) textEl.setAttribute('font-size', fontSize);
      else textEl.setAttribute('font-size', cfg.fontSize);
    });

    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    // Flow-dependent arrow opacity (mirrors card.ts updateOpacity exactly)
    const flowRate = parseFloat(entities?.['sensor.daikin_heizung_durchfluss']?.state) || 0;
    const mischerPct = parseFloat(entities?.['sensor.daikin_heizung_dhw_mischer_position']?.state) || 0;
    const bpvPct = parseFloat(entities?.['sensor.daikin_heizung_bpv']?.state) || 0;

    const dhwOpen = svgEl.getElementById('dhw-open-arrows');
    const dhwClosed = svgEl.getElementById('dhw-closed-arrows');
    const bpvOpen = svgEl.getElementById('bpv-open-arrows');
    const bpvClosed = svgEl.getElementById('bpv-closed-arrows');
    if (dhwOpen)   dhwOpen.style.opacity   = (flowRate > 0 ? mischerPct / 100 : 0).toString();
    if (dhwClosed) dhwClosed.style.opacity = (flowRate > 0 ? (100 - mischerPct) / 100 : 0).toString();
    if (bpvOpen)   bpvOpen.style.opacity   = (flowRate > 0 ? bpvPct / 100 : 0).toString();
    if (bpvClosed) bpvClosed.style.opacity = (flowRate > 0 ? (100 - bpvPct) / 100 : 0).toString();

    for (let i = 1; i <= 8; i++) {
      const arrow = svgEl.getElementById(`Flow-Arrow-${i}`);
      if (arrow) arrow.style.opacity = flowRate > 0 ? '1' : '0';
    }

    // Pressure equalization arrows (fill color, mirrors card.ts)
    const pressEq = entities?.['binary_sensor.daikin_heizung_druckausgleich'];
    const eevColor = pressEq?.state === 'on' ? '#00ff0080' : '#7f7f7f';
    const arrowL = svgEl.getElementById('eev_arrow_left');
    const arrowR = svgEl.getElementById('eev_arrow_right');
    if (arrowL) arrowL.setAttribute('fill', eevColor);
    if (arrowR) arrowR.setAttribute('fill', eevColor);

    // Heizstab (buh-control) fill color
    const buhEntity = entities?.['select.daikin_heizung_heizst_be_f_r_pumpen_nach_oktober_2018'];
    const buhActive = buhEntity && parseFloat(buhEntity.state) > 0;
    const buhEl = svgEl.getElementById('buh-control');
    if (buhEl) buhEl.setAttribute('fill', buhActive ? '#d4aa00ff' : '#7f7f7f');
  }, [entities]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ aspectRatio: '2560 / 1570' }}
    />
  );
}
