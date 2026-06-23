# Contributing

Thank you for helping improve ORCA NMR Viewer.

## Bug reports

Include:

- macOS version and Mac model;
- ORCA version;
- calculation type and relevant NMR keywords;
- expected and observed behavior;
- a minimal non-confidential output file, when possible.

Remove confidential molecular structures, file paths, usernames, and other
sensitive information before uploading an output.

## Development

Requirements:

- Apple Silicon Mac;
- macOS 14 or newer;
- current full Xcode installation.

Run the test suite before submitting changes:

```sh
swift test
```

Build a local application bundle with:

```sh
./build-app.sh
```

## Pull requests

- Keep changes focused.
- Add tests for parser changes.
- Document user-visible changes in `CHANGELOG.md`.
- Do not commit build products, `.DS_Store`, private ORCA outputs, or credentials.
- Preserve the English-language application interface.

## Parser compatibility

ORCA formats can differ by version and job type. Parser contributions should
include a reduced fixture that demonstrates the format without disclosing
private scientific data.
