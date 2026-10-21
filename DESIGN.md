# District OS design context

District OS is an English-language administrative workspace for Kanyakumari district, section, church, and member accounts. Its screens prioritize clear actions and readable operational records on desktop and narrow mobile widths.

## Visual system

- `src/styles/app.css` owns the runtime tokens. The shared palette uses ink `#17253d`, muted text `#8290a5`, lines `#e6ebf1`, blue `#2b65d9`, and navy `#122548`.
- DM Sans is the interface typeface; DM Mono is used sparingly for figures and utility labels. Lucide supplies icons.
- White panels, pale blue selection states, modest rounded corners, and restrained shadows establish the app's administrative look. Destructive actions use red only where they are actionable or confirmed.
- Forms and dialogs reuse the existing `.panel`, `.primary`, `.subtle`, and `.meeting-dialog-backdrop` patterns. Keep labels explicit, loading states visible, and errors next to the active task.
- Tailwind CSS v4 is introduced incrementally through `src/styles/index.css`. Its `@theme` values mirror the established District OS palette and typography. Existing selectors in `app.css` remain authoritative until each component is migrated and verified; legacy rules are removed only after their last consumer is converted.

## Messaging extension

The People and Groups tabs share the same page heading and panel rhythm. Group names, account labels, member counts, and message timestamps carry the hierarchy. Group access is determined by account membership on the server. The creator alone can delete a group; deletion requires an explicit confirmation dialog.

Long lists and conversations scroll within their panel, with keyboard focus visible. Narrow screens stack the group list above the conversation. Maintain the existing blue identity and avoid introducing a separate color system for groups.
