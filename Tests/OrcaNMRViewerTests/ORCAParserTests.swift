import Testing
@testable import OrcaNMRViewer

@Test func parsesCoordinatesShieldingsAndCouplings() throws {
    let sample = """
    CARTESIAN COORDINATES (ANGSTROEM)
    ---------------------------------
    C      0.000000  0.000000  0.000000
    H      0.000000  0.000000  1.089000

    Nucleus  Element    Isotropic     Anisotropy
    -------  -------  ------------   ------------
        0       C          184.300         59.356
        1       H           30.100         12.469

    NUCLEUS A = 0C   NUCLEUS B = 1H   COUPLING
    Fermi contact contribution                         120.250
    Spin dipole contribution                            -1.100
    Paramagnetic spin orbit contribution                 0.300
    Diamagnetic spin orbit contribution                  0.050
    Total isotropic coupling iso=                      119.500
    """

    let result = try ORCAParser().parse(text: sample)
    #expect(result.atoms.count == 2)
    #expect(result.shieldings.count == 2)
    #expect(result.shieldings[0].isotropic == 184.3)
    #expect(result.couplings.count == 1)
    #expect(result.couplings[0].totalHz == 119.5)
}

@Test func calculatesExportedChemicalShift() throws {
    let sample = """
    C 0.0 0.0 0.0
    H 0.0 0.0 1.0
    Nucleus Element Isotropic Anisotropy
    0 C 180.000 10.000
    """
    let result = try ORCAParser().parse(text: sample)
    let export = Exporter.text(document: result, references: ["C": 188.1])
    #expect(export.contains("8.100000"))
}
