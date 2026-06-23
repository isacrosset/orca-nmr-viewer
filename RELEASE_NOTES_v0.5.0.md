# ORCA NMR Viewer 0.5.0

First public release candidate for Apple Silicon Macs.

## Highlights

- ORCA NMR shielding and spin-spin coupling extraction.
- Editable TMS/reference shielding values and calculated chemical shifts.
- Interactive 3D molecular viewer with rotation, inertia, zoom, and presets.
- Atom selection synchronized between the 3D model and result table.
- Estimated single, double, and triple bond visualization.
- NMR overlays filtered by ¹H, ¹³C, or other available nuclei.
- Independent chemical-shift and coupling-constant overlays.
- TXT and Excel-compatible CSV export.

## Installation

1. Download `ORCA-NMR-Viewer-macOS-arm64.zip`.
2. Extract it and move the application to `/Applications`.
3. Control-click the application, choose **Open**, and confirm.

## Requirements

- Apple Silicon Mac.
- macOS 14 or newer.

## Important

This build is ad-hoc signed but not notarized. Bond orders are inferred from
geometry. Reference shielding values must be validated for the computational
method used.

SHA-256 checksums are provided in `SHA256SUMS.txt`.
