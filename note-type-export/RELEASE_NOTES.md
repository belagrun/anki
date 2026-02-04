# Release Notes

## v1.0.0 | 2026-02-04

### Initial Release 🎉

Export and import Anki note types (models) as portable JSON files.

#### Features

- **Export Note Types**
  - Select which note types to export
  - Exports fields, templates, CSS, and LaTeX settings
  - Optional metadata (export date, Anki version)
  - JSON format for maximum compatibility

- **Import Note Types**
  - Preview note types before importing
  - Conflict indicators (⚠️) for existing names
  - Selective import - choose which note types to import

- **Smart Conflict Resolution**
  - Ask for each conflict individually
  - Auto-rename with "(imported)" suffix
  - Skip conflicting note types
  - Overwrite existing (only if no notes are using it)
  - "Apply to all" option for batch handling

- **Configuration**
  - Configurable default conflict action
  - Remembers last used directories

#### Menu Integration

- **Tools → Export Note Types...**
- **Tools → Import Note Types...**

#### Compatibility

- Anki 23.10+ (Qt6)
- Windows, macOS, Linux

#### Known Limitations

- Media files referenced in templates/CSS are not exported
- Deck associations are not preserved
- Tags associated with note types are not exported

---

*Future versions may include media export and additional features based on user feedback.*
