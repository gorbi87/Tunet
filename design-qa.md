# Design QA — mobile settings placement

- Source visual truth: `C:/Hassen/.codex-remote-attachments/01a006ac-8f67-77f2-8b57-d526b3348978/ee89cc7c-5e2b-4d83-9d0d-a378d8433c6f/1-Photo-1.jpg`
- Implementation: local Vite preview at `http://192.168.10.150:5173/#/page/home`
- Implementation screenshot: captured and inspected in the Codex in-app browser; not persisted to the workspace
- Viewport: 390 × 844 CSS px, device scale factor 1
- Source pixels: 575 × 1280
- Implementation pixels: 390 × 844
- State: mobile dashboard without a loaded Home Assistant profile; onboarding modal present

## Evidence

- The mobile settings trigger is the only settings trigger in the rendered DOM.
- Its measured bounds are 44 × 44 CSS px at x=338, leaving an 8 px right margin.
- The settings menu still exposes Edit, Appearance, Layout, Header, and System.
- Unit coverage confirms that the navigation toolbar hides its settings copy on mobile and retains it on desktop/tablet.

## Fidelity surfaces

- Fonts and typography: unchanged by this change.
- Spacing and layout rhythm: the settings trigger is pinned to the right of the mobile person row; exact spacing beside real person cards could not be compared because the local preview had no HA profile.
- Colors and visual tokens: existing settings control tokens are preserved.
- Image quality and assets: person images are unchanged.
- Copy and content: unchanged.

## Findings

- No code-level or measured responsive issue was found in the new mobile placement.
- Full visual comparison is blocked because the implementation preview cannot reproduce the authenticated dashboard state shown in the source screenshot.
- Tablet geometry could not be captured reliably while the onboarding modal was active; unit coverage confirms the desktop/tablet branch remains unchanged.

## Comparison history

- Initial implementation: one 44 × 44 settings trigger at the far right of the 390 px mobile viewport.
- No P0, P1, or P2 issue was found in the measurable mobile placement.

final result: blocked
