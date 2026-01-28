# Copilot instructions for this repo

## Project overview (Fill the Blanks Expanded)
- Anki add-on located in fill-the-blanks-expanded/src; entrypoint is src/__init__.py which imports and runs binding.run().
- Integration with Anki happens in src/binding.py via hooks (anki.hooks, aqt.gui_hooks) and Reviewer method wrapping; JS/CSS are injected into the reviewer webview.
- HTML transformation lives in src/handler.py: it parses the card HTML with BeautifulSoup, replaces cloze spans with input fields, and formats answer feedback on “show answer”.
- Frontend behavior is in src/fill-blanks.js: input listeners, live feedback, typedWords collection, and reveal popup logic.
- Config defaults are in src/config.py; user-facing config keys documented in src/config.md.

## Data flow & boundaries
- field_filter hook uses filter name "fill-blanks" and is the only filter path that rewrites fields.
- handler._traverse_entries() only processes cloze spans whose data-ordinal matches the current card ord (rev_card.ord + 1).
- JS updates typedWords; Python retrieves it via Reviewer.web.evalWithCallback in handler.getTypedAnswer().
- Answer formatting in handler.handle_answer() depends on FieldsContext.answers and the count of cloze spans.

## Build and local install (root build.py)
- Build zip: python build.py -source 1 -dist (writes dist/ and creates zip).
- Install into local Anki add-ons (Windows): python build.py -source 1 -dev (copies to %APPDATA%\Anki2\addons21).

## Tests
- Pytest-based tests are under fill-the-blanks-expanded/tests with mocks in tests/anki_mocks_test.py.
- Tests import from src by appending ../src to sys.path (see tests/handler_test.py).

## Project-specific conventions
- Keep Anki integration in binding.py; keep HTML parsing and answer formatting in handler.py.
- JS is loaded from src/fill-blanks.js via reviewer.web.eval and should remain dependency-free (plain JS + jQuery from Anki).
- CSS for inputs and reveal popup is embedded in binding.py (CSS_STYLE).
- Config reads must go through ConfigService.read(ConfigKey.*, type).

## Key references
- Hook wiring: fill-the-blanks-expanded/src/binding.py
- HTML processing: fill-the-blanks-expanded/src/handler.py
- Frontend behavior: fill-the-blanks-expanded/src/fill-blanks.js
- Build script: build.py
