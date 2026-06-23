# Scientific notes

## Chemical-shift referencing

The application calculates:

`δ = σ(reference) − σ(molecule)`

The reference shielding should be calculated using a protocol consistent with
the molecule: method, basis set, geometry treatment, solvent model,
relativistic treatment, and other relevant settings.

The default values supplied by the application are examples and should not be
treated as universally valid TMS references.

## Coupling constants

The displayed total coupling and optional component values are read from the
ORCA output. Interpretation depends on the calculation setup and the nuclei
involved.

The 3D coupling overlay draws a line between every parsed pair involving the
selected nucleus. This is a visualization aid, not a representation of a
chemical bond.

## Connectivity and bond order

When explicit connectivity is unavailable, the molecular viewer estimates
bonds from interatomic distances and covalent radii. Multiple bonds are then
estimated using distance thresholds and normal valence constraints.

These inferred bonds can be incorrect for:

- transition-metal complexes;
- hypervalent compounds;
- unusual oxidation or spin states;
- delocalized and aromatic systems;
- geometries far from equilibrium.

Disable multiple-bond display when the inferred structure is misleading.

## Parser limitations

ORCA text output is primarily intended for human reading and may change between
versions. The `.property.txt` format is preferable when available, but it can
also vary by ORCA release and calculation type.

Always verify exported values against the original ORCA output before using
them in publications or decisions.
