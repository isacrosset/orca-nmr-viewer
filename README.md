# ORCA NMR Viewer

Native macOS application for inspecting NMR results from
[ORCA](https://www.faccts.de/orca/).

ORCA NMR Viewer reads ORCA output files, extracts magnetic shielding and
spin-spin coupling data, calculates referenced chemical shifts, and displays
the molecular structure in an interactive 3D view.

> This project is independent and is not affiliated with or endorsed by the
> ORCA developers or FACCTs GmbH.

## Features

- Opens standard ORCA text outputs and `.property.txt` files.
- Extracts Cartesian coordinates, isotropic shieldings, anisotropies, and
  spin-spin coupling constants.
- Calculates chemical shifts using:

  `δ = σ(reference) − σ(molecule)`

- Editable reference shielding values for TMS or other references.
- Interactive 3D molecular view with:
  - arcball rotation and inertia;
  - mouse-wheel and trackpad zoom;
  - front, top, and side presets;
  - adjustable atom-label size;
  - atom selection synchronized with the shielding table;
  - estimated single, double, and triple bonds.
- Filters NMR overlays by ¹H, ¹³C, or other nuclei present in the output.
- Independently displays chemical shifts and pairwise coupling constants.
- Exports results as TXT or Excel-compatible CSV.

## Requirements

- Apple Silicon Mac.
- macOS 14 Sonoma or newer.

## Download and installation

1. Open the repository's **Releases** page.
2. Download `ORCA-NMR-Viewer-macOS-arm64.zip`.
3. Extract the ZIP and move **ORCA NMR Viewer.app** to `/Applications`.
4. On the first launch, Control-click the application and select **Open**.

Release builds are currently ad-hoc signed and are not notarized through the
Apple Developer Program. macOS may therefore show a security confirmation.

## Using the application

1. Open or drag an ORCA output into the application.
2. Enter reference shielding values calculated with the same computational
   protocol used for the molecule.
3. Select the nucleus and NMR overlays to display.
4. Rotate, zoom, and click atoms to inspect the corresponding table entries.
5. Export the processed values as TXT or CSV.

## Scientific limitations

- Reference shielding values must match the method, basis set, relativistic
  treatment, solvent model, and relevant settings used for the molecule.
- Bond orders are estimated from geometry and normal valence rules because
  standard ORCA outputs do not necessarily contain explicit connectivity.
- ORCA output formatting differs between versions and calculation types.
- The demonstration file contains synthetic values and is not scientific data.

See [Scientific notes](docs/SCIENTIFIC_NOTES.md) for additional details.

## Supported input

The parser recognizes:

- standard ORCA Cartesian-coordinate blocks;
- NMR isotropic-shielding summaries;
- detailed per-nucleus shielding blocks;
- common detailed and compact spin-spin coupling layouts.

If a valid ORCA output is not parsed correctly, please open a bug report and
attach a minimal, non-confidential example.

## Build from source

Install the current full version of Xcode, then run:

```sh
swift test
swift run OrcaNMRViewer
```

To build a local `.app` bundle:

```sh
./build-app.sh
```

The application will be created in `outputs/`.

## Demo file

`Examples/ethanol-nmr-demo.out` can be used to check the interface. Its values
are illustrative and must not be used scientifically.

## Contributing

Bug reports, ORCA-format compatibility improvements, and interface
contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
submitting a pull request.

## License

ORCA NMR Viewer is available under the [MIT License](LICENSE).
