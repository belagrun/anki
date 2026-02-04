# Note Type Export

Anki add-on for exporting and importing Note Types (models) as JSON files.

## Features

- **Export Note Types**: Save your note types to a portable JSON file
- **Import Note Types**: Load note types from JSON files into your collection
- **Conflict Resolution**: Smart handling when importing note types with existing names
  - Ask for each conflict
  - Auto-rename with "(imported)" suffix
  - Skip conflicting note types
- **Selective Export/Import**: Choose exactly which note types to export or import
- **Metadata**: Optional export metadata (date, Anki version)

## Installation

### From .ankiaddon file (recommended)
1. Build the addon: `python build.py -source 2 -dist`
2. Double-click the generated `dist/note-type-export.ankiaddon` file
3. Restart Anki

### Development installation
1. Run: `python build.py -source 2 -dev`
2. Restart Anki

## Usage

### Exporting Note Types

1. In Anki, go to **Tools → Export Note Types...**
2. Select the note types you want to export
3. Click **Export...** and choose a location
4. The file is saved as a `.json` file

### Importing Note Types

1. In Anki, go to **Tools → Import Note Types...**
2. Select a `.json` file exported by this add-on
3. Choose which note types to import
4. Configure how to handle name conflicts:
   - **Ask me each time**: A dialog will appear for each conflict
   - **Auto-rename**: Adds "(imported)" suffix to conflicting names
   - **Skip**: Doesn't import note types that already exist

## JSON Format

The exported JSON follows this structure:

```json
{
  "format_version": "1.0",
  "metadata": {
    "exported_at": "2026-02-04T12:00:00Z",
    "anki_version": "24.11",
    "addon_version": "1.0.0",
    "count": 2
  },
  "note_types": [
    {
      "name": "Basic",
      "type": 0,
      "css": ".card { font-family: arial; }",
      "fields": [
        {"name": "Front", "ord": 0, "font": "Arial", "size": 20}
      ],
      "templates": [
        {
          "name": "Card 1",
          "ord": 0,
          "qfmt": "{{Front}}",
          "afmt": "{{FrontSide}}<hr>{{Back}}"
        }
      ]
    }
  ]
}
```

## Configuration

Configuration is stored in Anki's addon manager. Available settings:

| Key | Default | Description |
|-----|---------|-------------|
| `default_conflict_action` | `"ask"` | Default action for name conflicts: `"ask"`, `"rename"`, `"skip"` |
| `export_include_metadata` | `true` | Include export metadata in JSON files |

## Compatibility

- Anki 23.10+ (Qt6)
- Windows, macOS, Linux

## Limitations (v1.0)

- Media files referenced in templates/CSS are **not** exported
- Deck associations are not preserved
- Tags associated with note types are not exported

## License

MIT License
