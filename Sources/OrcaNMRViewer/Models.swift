import Foundation

struct Atom: Identifiable, Hashable {
    let id: Int
    let element: String
    let x: Double
    let y: Double
    let z: Double
}

struct Shielding: Identifiable, Hashable {
    let atomIndex: Int
    let element: String
    let isotropic: Double
    let anisotropy: Double?
    var id: Int { atomIndex }
}

struct Coupling: Identifiable, Hashable {
    let atomA: Int
    let elementA: String
    let atomB: Int
    let elementB: String
    let totalHz: Double
    let fermiContactHz: Double?
    let spinDipoleHz: Double?
    let paramagneticSOHz: Double?
    let diamagneticSOHz: Double?
    var id: String { "\(atomA)-\(atomB)" }
}

struct NMRDocument {
    var sourceName: String
    var atoms: [Atom]
    var shieldings: [Shielding]
    var couplings: [Coupling]
    var warnings: [String]
}

enum AtomLabelMode: String, CaseIterable, Identifiable {
    case none = "None"
    case symbol = "Symbol"
    case number = "Number"
    case shift = "Shift"
    case full = "Symbol + number + shift"
    var id: String { rawValue }
}

enum MoleculeViewPreset {
    case reset
    case front
    case top
    case side
}

enum NMRParseError: LocalizedError {
    case unsupported
    case unreadable

    var errorDescription: String? {
        switch self {
        case .unsupported:
            return "No ORCA coordinates, NMR shieldings, or coupling constants were found."
        case .unreadable:
            return "The selected file could not be read as text."
        }
    }
}
