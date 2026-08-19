## [1.18.64] — 2026-08-19

### Added
- StatusPillsConfigModal: Entity-Count-Pills können jetzt direkt im Editor bearbeitet werden (Entity IDs, Zähler-Anzeige)
- SecurityPanel: FP300 Schuppen Bewegungsmelder in Bewegungsmelder-Liste aufgenommen


## [1.18.63] — 2026-08-18

### Changed
- WP-Karte: Padding p-7→p-6, WW-Temp text-4xl→text-3xl, ÜS/WW-Log nicht mehr auf Karte, Standby-Tagesmodus ausgeblendet (doppelt mit Badge)
- WP-Modal Automatik: Sperrzeiten (WW-Fenster 11:00–19:30) in Nächster-Zustand-Box und Warum-Bullets berücksichtigt
- Stundenplan: Glasfläche als Tabellenhintergrund, Zeitspalte leicht abgesetzt, Pausebalken volle Breite und Höhe
- Stundenplan Mobile-Legende: Emojis statt Farbpunkte


## [1.18.62] — 2026-08-16

### Changed
- Stundenplan: Zeiten aus Pausen-Zeilen entfernt


## [1.18.61] — 2026-08-16

### Changed
- Stundenplan: Pausen-Zeit eingerückt (1.5ch) auf Höhe der Uhrzeiten in den Stunden-Zeilen


## [1.18.60] — 2026-08-16

### Changed
- Stundenplan: Pausen-Zeile höher, Zeit eingerückt auf Höhe anderer Zeiten, "Pause" zentriert und fett


## [1.18.59] — 2026-08-16

### Changed
- Stundenplan: Pausen-Zeile geht über gesamte Plan-Breite (colSpan 5), Zeit links, Pause-Badge im Balken


## [1.18.58] — 2026-08-16

### Fixed
- Stundenplan: Pausen-Zeiten nicht mehr fett/weiß/groß — sp-time-range CSS ergänzt


## [1.18.57] — 2026-08-16

### Fixed
- Stundenplan: isMobile-Prop statt CSS-Breakpoint — Zeiten auf Mobile (07:51 / 08:40 gestapelt), Desktop inline


## [1.18.56] — 2026-08-16

### Fixed
- Stundenplan Mobile: Breakpoint auf 768px erhöht, Von/Bis gestapelt; Desktop weiter inline mit Strich


## [1.18.55] — 2026-08-16

### Fixed
- Stundenplan Mobile: Von/Bis als separate Spans — Strich per CSS ausgeblendet, echtes Stapeln statt CSS-Wrapping


## [1.18.54] — 2026-08-16

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.53] — 2026-08-16

### Changed
- Stundenplan-View: Zeiten inline (07:51–08:40), volle Tabellenbreite, Legende nur auf Mobile
- Stundenplan-Tab im Seiten-Dialog: Label "Stundenplan" statt i18n-Key, Icon BookOpen


## [1.18.52] — 2026-08-16

### Fixed
- Stundenplan-View: isStundenplanPage und createStundenplanPage korrekt in useAppViewModels destrukturiert — App-Crash beim Laden behoben


## [1.18.51] — 2026-08-16

### Added
- Stundenplan-View: neuer Page-Typ mit Wochenplan, Fach-Farben/Emojis, aktiver Stunden-Hervorhebung und Pausen-Zeilen
- WP-Blueprint: Kühlen → WW_Heizen Transition ergänzt (WP heizt jetzt WW wenn Zeitfenster öffnet, auch aus Kühlen-Modus heraus)
- WP-Entscheidungslog: WW-Ist-Temperatur bei WW_Heizen-Transitions mit geloggt

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.50] — 2026-08-16

### Fixed
- WP-Modal: Key-Mapping für tatsächliche Automation-Keys korrigiert — 'ÜS' wird als PV-Überschuss erkannt, 'WW-Ist' als WW-Temperatur; Standby-Einträge zeigen jetzt korrekte Vergleichsrichtung (z.B. "PV-Überschuss 0.0kW < Startschwelle 2kW")


## [1.18.49] — 2026-08-14

### Changed
- WP-Modal: Entscheidungsprotokoll zeigt Ist-vs-Soll-Vergleich pro Zeile (z.B. "PV-Überschuss 3.3kW ≥ Startschwelle 2kW · Raum 25.5°C ≥ Kühlschwelle 24°C")


## [1.18.48] — 2026-08-14

### Changed
- WP-Modal: Entscheidungsprotokoll zeigt jetzt Grund-Text pro Eintrag (z.B. "PV-Überschuss 3.3kW · Raum 25.5°C") aus der Entscheidungslog-History statt nur Modus-Chip


## [1.18.47] — 2026-08-14

### Added
- WP-Modal: "Nächster Zustand" Box neben dem State Badge (z.B. "WW BOOST — wenn WW ≥ 55°C")

### Changed
- WP-Modal: "Warum?"-Bullets zeigen jetzt Ist-vs-Ziel-Sätze mit konfigurierten Schwellen (z.B. "PV-Überschuss 3.3kW ≥ Startschwelle 2kW", "SOC 71% > Minimum 20%")


## [1.18.46] — 2026-08-14

### Added
- WP-Modal Automatik-Tab: 4 Live-Sensorkacheln (WW-Temp, SOC, PV-Überschuss, Raumtemp) mit Minibars
- WP-Modal Automatik-Tab: Entscheidungsprotokoll als formatierte Log-Zeilen (Uhrzeit + farbiger Modus-Chip) im Tagesverlauf-Block
- WP-Modal Automatik-Tab: "Warum dieser Zustand?" parsed Entscheidungslog in Bullet-Points mit grünen Dots

### Changed
- WP-Modal: State Badge und Sensor-Tiles auf kompakter Größe auf mobilen Geräten (isCompact)
- WP-Modal: Tagesverlauf-Timeline und Entscheidungsprotokoll in einem Block zusammengefasst; separates Akkordeon entfernt


## [1.18.45] — 2026-08-14

### Changed
- WP-Karte: Abstand der State-Machine-Sektion reduziert — COP/Strom-Zeile nicht mehr abgeschnitten
- WP-Modal Automatik-Tab: großes State Badge mit Border-Left-Akzent statt 3×2-Badge-Grid
- WP-Modal Automatik-Tab: "Warum dieser Zustand?"-Block zeigt geparsten Entscheidungslog (Zeit, Übergang, Sensordaten)
- WP-Modal Automatik-Tab: Tagesverlauf als farbiger Timeline-Balken (00:00 bis jetzt) aus Tagesmodus-Verlauf
- WP-Modal Automatik-Tab: WW-Temperatur und WW-Soll direkt im State Badge inline angezeigt


## [1.18.44] — 2026-08-14

### Changed
- WP-Karte: Phase-A/B/C-Logik durch State-Machine-Anzeige ersetzt — zeigt aktuellen Tagesmodus (Standby, WW Heizen, WW Pause, WW Boost, WW Fertig, Kühlen) farbig an
- WP-Karte: WW-Fortschrittsbalken läuft jetzt von 40→63°C während WW_Heizen / WW_Boost
- WP-Modal Automatik-Tab: neues Tagesplan-Badge-Grid mit allen 6 Modi; aktiver Modus farbig hervorgehoben
- WP-Modal Automatik-Tab: Entscheidungslog (letzte Automations-Entscheidung mit Sensordaten) prominent angezeigt
- WP-Modal Automatik-Tab: Tagesmodus-Verlauf (48h) ersetzt WW-Soll-Verlauf; Einträge mit Modus-Farben
- WP-Modal Automatik-Tab: BOH-Schutz-Balken sichtbar sobald Automatik aktiv (nicht mehr nur im Sommer)


## [1.18.43] — 2026-07-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.42] — 2026-06-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.41] — 2026-06-25

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.40] — 2026-06-24

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.39] — 2026-05-29

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [patch] — 2026-05-29

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.38] — 2026-05-28

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.37] — 2026-05-27

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.36] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.35] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.34] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.33] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.32] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.31] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.30] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.29] — 2026-05-26

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.28] — 2026-05-23

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.27] — 2026-05-23

### Fixed
- Pool-Modal: Durchfluss wird von l/min in l/h umgerechnet (×60) da der Sensor in l/min liefert.


## [1.18.26] — 2026-05-23

### Changed
- Dashboard grid repacks visible cards in view mode: conditionally hidden cards no longer leave empty gaps — remaining cards fill in automatically. Edit mode is unchanged (explicit positions for drag & drop).

### Fixed
- Haushaltsgeräte card is now correctly treated as hidden by logic when both washer and dishwasher are inactive, so the grid repack picks it up and adjacent cards fill its slot.


## [1.18.25] — 2026-05-23

### Fixed
- Server: fix Express 5 `req.query` immutability bug in shared mode — query-based API endpoints (`GET /api/settings/current`, `/history`, `/devices`, `GET /api/profiles`) now correctly normalize `ha_user_id` to `__shared__`, resolving 403 "Forbidden: user mismatch" errors that blocked dashboard sync and profile access.


## [1.18.24] — 2026-05-23

### Fixed
- Server: shared-slot migration no longer deletes rows that contain encrypted data (`data_enc` present), preventing accidental dashboard wipe on addon restart.


## [1.18.23] — 2026-05-23

### Changed
- Service worker cache names now include the app version so browsers detect updates on every release.
- Release script (`release:prep`) automatically updates `APP_VERSION` in `public/sw.js`.


## [1.18.22] — 2026-05-23

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.21] — 2026-05-22

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.20] — 2026-05-20

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.19] — 2026-05-03

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.18] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.17] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.16] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.15] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.14] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.13] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.12] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.11] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.10] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.9] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.8] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.7] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.6] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.5] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.4] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.3] — 2026-05-02

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.2] — 2026-05-01

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.18.1] — 2026-05-01

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.50] — 2026-05-01

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.49] — 2026-04-30

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.48] — 2026-04-30

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.47] — 2026-04-30

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.46] — 2026-04-30

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.45] — 2026-04-26

### Fixed
- WP-Karte: Kompressor-Status nutzt jetzt `binary_sensor.daikin_heizung_status_kompressor` statt Betriebsart (Betriebsart kann WW anzeigen obwohl Kompressor nicht läuft)

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.44] — 2026-04-26

### Added
- WP-Modal: BOH-Ablauf-Sektion mit 3-Phasen-Timeline (Heizstab → Übergabe → BOH Daikin) und Fortschrittsbalken
- WP-Modal: Minus-Preis-Banner zeigt jetzt WW-Soll, Leistung WW und BOH-Wartezeit direkt an
- WP-Modal: Phasen-Anzeige und Phase-B-Details werden während Minus-Preis ausgeblendet (BOH-Ablauf ersetzt sie)
- WP-Karte: Minus-Preis-Pill unterscheidet jetzt zwischen Heizstab (grün), BOH aktiv (blau) und WW voll (gelb)

### Changed
- WP-Modal: BOH-Wartezeit wird jetzt aus dem echten Entity-Wert gelesen statt hardcoded auf 95 min
- WP-Modal: WW-Soll-Verlauf zeigt 65°C als "Minus-Preis / Phase C" und 48°C als "Minus-Preis kommt"

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.43] — 2026-04-26

### Added
- WP-Karte: Countdown-Anzeige "⚡ in ~Xh" wenn negativer Octopus-Strompreis innerhalb der nächsten 12h erwartet wird
- WP-Modal: Banner mit Countdown und Hinweis "WW-Ziel: 48°C" wenn negativer Slot bevorsteht

## [1.15.42] — 2026-04-25

### Added
- Minus-Preis Modus: Heizstab 9kW läuft automatisch bei negativem Octopus-Strompreis, Kompressor bleibt aus
- Vorausschauende Logik: WP heizt WW nur bis 48°C wenn negativer Preisslot in den nächsten 12h kommt
- WP-Karte: Anzeige des aktuellen negativen Strompreises als grüne/gelbe Pill
- WP-Modal: Banner für aktiven Minus-Preis Modus mit Heizstab-Status

### Fixed
- Octopus-Karte: Negative Strompreise werden jetzt korrekt angezeigt (vorher 0 €/kWh)


## [1.15.41] — 2026-04-25

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.40] — 2026-04-25

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.39] — 2026-04-23

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.38] — 2026-04-23

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.37] — 2026-04-22

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.36] — 2026-04-22

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.35] — 2026-04-21

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.34] — 2026-04-21

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.33] — 2026-04-21

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.32] — 2026-04-20

### Added
- Frigate Events Card: Frigate-URL jetzt im Edit-Card-Modal konfigurierbar (kein Hardcode mehr).

### Fixed
- PvModal: Energy-Dashboard-Tab entfernt (war nur experimentell, wird separat geöffnet).
- Server: Energy-Dashboard-Proxy-Endpunkt entfernt.

## [1.15.31] — 2026-04-15

### Fixed
- Energy Dashboard Proxy: Wildcard-Syntax für Express v5 path-to-regexp korrigiert (Server-Crash behoben).


## [1.15.30] — 2026-04-15

### Fixed
- Energy Dashboard Iframe: Proxy-Endpoint über SUPERVISOR_TOKEN hinzugefügt, da HA Auth für Custom Component Static Paths erzwingt.


## [1.15.29] — 2026-04-15

### Fixed
- Energy Dashboard Iframe: Pfad korrigiert auf /ha-energy-dashboard/ (Custom Component Static Path).


## [1.15.28] — 2026-04-15

### Fixed
- Energy Dashboard Iframe: sandbox-Attribut entfernt, das CSS und Scripts blockiert hat.


## [1.15.27] — 2026-04-15

### Fixed
- Energy Dashboard Fullscreen: JSX-Fragment-Fehler behoben, dev-Platzhalter statt SPA-Fallback im Iframe.


## [1.15.26] — 2026-04-15

### Added
- PvModal: neuer Tab "Energy Dashboard" bettet das HA Energy Dashboard per Iframe ein.

### Fixed
- CSP frame-src um 'self' erweitert für HA-Panel-Iframes.


## [1.15.25] — 2026-04-14

### Fixed
- Frigate-Clips in der Produktivumgebung: CSP `media-src` um `blob:` erweitert, damit per fetch geladene Clips als Blob-URL abgespielt werden können.

## [1.15.24] — 2026-04-14

### Fixed
- Frigate-Clips: Statt direktem `<video src>` wird der Clip nun per fetch als Blob geladen und lokal abgespielt, um Probleme mit Range-Requests im Proxy zu umgehen.


## [1.15.23] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.22] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.21] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.20] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.19] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.18] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.17] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.16] — 2026-04-14

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.15] — 2026-04-13

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.14] — 2026-04-12

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.13] — 2026-04-12

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.12] — 2026-04-11

### Added
- NavimowCard: Neue Karte für Mähroboter (`lawn_mower`-Domain) mit Steuerung (Starten/Pausieren/Station) und Modal mit Mähhistorie als Balkendiagramm (14 Tage).
- Beschattungsview: Schnellaktionen "Alle runter", "EG runter", "EG ohne Tür", "OG runter" als Buttons über den Kacheln.
- StatusBar: Neuer Pill-Typ "Müllabholung" zeigt automatisch fällige Tonnen (Gelbe Tonne, Restmüll, Papier) wenn Abholung in ≤2 Tagen.

### Changed
- Sicherheitskarte: Simulation aus eigener Spalte entfernt und direkt unter Alarmo in die Alarm-Sektion integriert; Kachel-Label "Anwesenheit" → "Simulation".
- go2rtc-Kamera: Kameraname aus der Kachelansicht entfernt.

### Fixed
- NavimowModal: `AccessibleModalShell` korrekt mit `open`-Prop und children-Funktion verwendet (Modal öffnete sich vorher nicht).


## [1.15.11] — 2026-04-10

### Fixed
- Profil-Import: Konfiguration blieb nach einem Seitenneuladen nicht erhalten, da nach dem Import kein Server-Push ausgelöst wurde.


## [1.15.10] — 2026-04-10

### Fixed
- Header: Titel und Uhrzeit wurden auf dem iPhone in Desktop-Größe (~48px) dargestellt statt in der korrekten mobilen Größe (~20px).


## [1.15.9] — 2026-04-10

### Fixed
- Status-Pills: Alle Pills haben jetzt eine einheitliche Höhe (h-9 Desktop / h-8 Mobile), unabhängig vom Inhalt.


## [1.15.8] — 2026-04-10

### Fixed
- iOS: Doppel-Tap-Problem bei Buttons und Modals behoben — Touch-to-Click-Fix greift jetzt für alle Buttons, nicht nur für Karten.


## [1.15.7] — 2026-04-10

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.6] — 2026-04-10

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.5] — 2026-04-10

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.4] — 2026-04-10

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte


## [1.15.3] — 2026-04-10

### Added
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Changed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

### Fixed
- Stundenplan Mobile: Zeiten wieder gestapelt (52px Spalte), überlappen nicht mehr mit Fach-Spalte

## [1.20.9] — 2026-08-19

### Added
- Added per-card mobile width controls for supported dashboard cards.
- Added configurable ready and running text for script cards.

### Changed
- Redesigned the appearance, layout, and header sidebars with clearer shared controls.
- Improved automatic mobile sizing for media, climate, weather, cost, and Nordpool cards.

### Fixed
- Improved Home Assistant reconnect feedback and kept grid settings within usable device widths.
- Fixed custom card name updates and several mobile rendering details across sensor, status, lock, weather, and media cards.


## [1.20.8] — 2026-08-16

### Added
- Added optional person status text to the mobile header.

### Changed
- Moved mobile settings beside the person row and increased mobile header and navigation text sizes.
- Optimized power, climate, fan, light, car, weather, TV, and vacuum popups for phone-sized screens.

### Fixed
- Fixed PWA installation metadata when Tunet is served through Cloudflare Access.
- Improved Home Assistant reconnection after returning to the app and delayed offline or stale-data notices briefly while synchronization catches up.
- Fixed the mobile person status visibility setting and aligned the weather card icon with the other dashboard cards.


## [1.20.7] — 2026-08-13

### Added
- Added the Home Assistant add-on store icon and logo.

### Changed
- Updated better-sqlite3, express-rate-limit, lucide-react, and ws.

### Fixed
- Fixed Roborock vacuum consumables reporting remaining time as a percentage, and restored the sensor consumable reset action (#157).

### Security
- Patched advisories in ip-address, js-yaml, and react-router.


## [1.20.6] — 2026-08-05

### Added
- Added low-battery status pills with configurable thresholds and entity scoping.
- Added configurable decimal places for numeric Sensor pills.

### Changed
- Improved sensor charts with clearer summaries, labels, sizing, and accessibility.
- Improved Home Assistant connection setup and numeric unit formatting.

### Fixed
- Fixed numeric Sensor pills sometimes showing excessive decimal places.


## [1.20.5] — 2026-07-25

### Changed
- Migrated Home Assistant app build metadata into the Dockerfile and removed the unsupported `armv7` target.

### Fixed
- Restored App Store installs by updating the app base image to resolve the musl package conflict (#188).

## [1.20.4] — 2026-07-24

### Changed
- Updated production and development dependencies, GitHub Actions, and runtime versions.
- Moved CI to Node 24 and container builders to Node 26.

### Fixed
- Added native build tooling and deterministic npm installs for better-sqlite3 13.
- Updated the changed-file formatting check to parse JSON-safe filenames.

## [1.20.3] — 2026-06-08

### Changed
- Improved vacuum maintenance reset button matching so Home Assistant button entities with consumable-style names are detected more reliably.

### Fixed
- Fixed the Vacuum modal sensor reset action so maintenance resets call the Home Assistant `button.press` service again.


## [1.20.2] — 2026-05-20

### Added
- Add release notes.

### Changed
- Add release notes.

### Fixed
- Add release notes.


## [1.20.1] — 2026-05-20

### Changed
- Broadened vacuum map entity discovery to match both `camera.*` and `image.*` domains, and use friendly-name token matching for more reliable auto-detection.
- Persisted vacuum map zoom and pan position per vacuum to localStorage so the view is restored when reopening the modal.
- Cleaned map entity display names by stripping vacuum name tokens for a tidier multi-map selector.

### Fixed
- Fixed vacuum map entity matching for setups where the entity friendly name contains the vacuum name but the entity ID does not.
- Added Norwegian `kart` keyword to fallback map entity detection.
- Fixed ModernDropdown portal-aware click-outside handling so dropdown menus rendered through a portal no longer close unexpectedly.


## [1.20.0] — 2026-05-20

### Added

- Added support for native Home Assistant vacuum area cleaning. To use this, map your vacuum's native room numbers to Home Assistant Areas in the vacuum integration options (such as Roborock integration config). The dashboard will automatically detect these mappings and let you trigger cleaning for individual rooms under the "Romrein" tab.
- Added interactive Live Map Zoom overlay with full desktop/mobile pan and zoom controls (Plus, Minus, Reset).
- Added flexible room selection configuration allowing manual overrides for vacuum cleaning rooms using standard inputs.
- Integrated translation variables for controls, telemetries, and status messages in Nynorsk, Bokmål, German, English, French, Swedish, and Chinese.

### Changed

- Redesigned the Vacuum Popup Modal with a snug, content-fitted dynamic height matching panel content.
- Rewrote the History tab statistics grid into a clean, modern, extra-light typography style with uppercase tracking labels.
- Consolidated maintenance indicators into a single unified layout with thin `h-1` progress bars and low-profile confirmation reset counters.

### Fixed

- Fixed runtime ReferenceError crashes for undefined `layoutMode`, `handleStartCleaning`, and `handleStartRoomCleaning` parameters.
- Replaced incorrect SVG mappings to prevent render issues and crashes inside the active tabs.

## [1.19.0] — 2026-05-07

### Added

- Added smart Status Pills for lights that are on, open doors/windows, and open covers, including matching popups with quick actions (#143).
- Added per-pill entity scoping so smart pills can use all matches, selected entities, or all except selected.

### Changed

- Redesigned the Status Pills config modal with a cleaner split layout, flatter editor, clearer add menu, and preview-friendly controls.
- Refined the smart pill popup to better match the rest of the dashboard modals.

<p>
  <img src="public/release-assets/Pills.png" alt="Redesigned Status Pills and smart pill preview" width="430" />
</p>

## [1.18.1] — 2026-05-07

### Added

- Added a small project roadmap and closed the missing-roadmap follow-up (#151).

### Changed

- Reduced idle dashboard background work so the default theme no longer runs continuous heavy motion.
- Throttled animated visual effects and paused them more aggressively on hidden or low-power displays.

### Fixed

- Fixed the Docker healthcheck probe inside the container by using `127.0.0.1`.
- Avoided extra theme and brightness cleanup work on unrelated Home Assistant entity updates.

### Security

- Cleared the `ip-address` Dependabot advisory through the `express-rate-limit` update.

## [1.20.12] — 2026-08-19

### Removed
- Removed custom go2rtc_camera_card and Go2rtcCameraModal (replaced by the upstream CameraCard with native HA stream support). Proxy endpoints (go2rtc-proxy, go2rtc-ws) are kept for FrigateEvents and the upstream camera modal.


## [1.20.11] — 2026-08-19

### Fixed
- Restored WebSocket proxy (`/api/go2rtc-ws`) and switched server startup from `app.listen()` to `httpServer.listen()` so WebSocket upgrades are handled correctly.
- Restored `hls.js` dependency that was dropped during merge conflict resolution.


## [1.20.10] — 2026-08-19

### Fixed
- Restored addon slug (`tunet-gorbi87`) and name (`Casa`) in `hassio-addon/config.yaml` so Home Assistant update detection works correctly after upstream merge.
- Fixed COP display in Wärmepumpe card: now reads `sensor.daikin_heizung_cop` directly instead of computing from cumulative thermal energy counters (which produced unrealistic values like 361).
- Restored `/api/go2rtc-proxy` HTTP proxy endpoint for Frigate and camera stream proxying (removed by upstream merge).
