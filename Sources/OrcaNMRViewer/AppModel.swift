import AppKit
import Foundation
import SwiftUI
import UniformTypeIdentifiers

@MainActor
final class AppModel: ObservableObject {
    @Published var document: NMRDocument?
    @Published var references: [String: Double] = ["H": 31.77, "C": 188.10]
    @Published var labelMode: AtomLabelMode = .full
    @Published var labelSize = 0.42
    @Published var zoom = 1.0
    @Published var showMultipleBonds = true
    @Published var nucleusFilter = "*"
    @Published var showChemicalShifts = true
    @Published var showCouplingLabels = false
    @Published var viewPreset: MoleculeViewPreset = .reset
    @Published var viewPresetRevision = 0
    @Published var resultsTab = 0
    @Published var selectedAtom: Int?
    @Published var errorMessage: String?
    @Published var showingError = false

    func openFile() {
        let panel = NSOpenPanel()
        panel.title = "Open ORCA NMR Output"
        panel.allowedContentTypes = [.plainText, .json, .data]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        if panel.runModal() == .OK, let url = panel.url {
            load(url)
        }
    }

    func load(_ url: URL) {
        do {
            document = try ORCAParser().parse(url: url)
            selectedAtom = nil
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
        }
    }

    func shift(for shielding: Shielding) -> Double? {
        guard let reference = references[shielding.element] else { return nil }
        return reference - shielding.isotropic
    }

    func selectAtom(_ atomIndex: Int) {
        selectedAtom = atomIndex
        resultsTab = 0
    }

    func applyViewPreset(_ preset: MoleculeViewPreset) {
        viewPreset = preset
        viewPresetRevision += 1
    }

    func exportText() {
        guard let document else { return }
        save(contents: Exporter.text(document: document, references: references),
             suggestedName: document.sourceName + "-NMR.txt",
             type: .plainText)
    }

    func exportCSV() {
        guard let document else { return }
        save(contents: Exporter.csv(document: document, references: references),
             suggestedName: document.sourceName + "-NMR.csv",
             type: .commaSeparatedText)
    }

    private func save(contents: String, suggestedName: String, type: UTType) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedName
        panel.allowedContentTypes = [type]
        if panel.runModal() == .OK, let url = panel.url {
            do {
                try contents.write(to: url, atomically: true, encoding: .utf8)
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

enum Exporter {
    static func text(document: NMRDocument, references: [String: Double]) -> String {
        var rows = [
            "ORCA NMR Viewer Export",
            "Source: \(document.sourceName)",
            "",
            "SHIELDINGS AND CHEMICAL SHIFTS",
            "Atom\tElement\tIsotropic shielding (ppm)\tAnisotropy (ppm)\tReference (ppm)\tChemical shift (ppm)"
        ]
        for s in document.shieldings {
            let ref = references[s.element]
            rows.append([
                "\(s.atomIndex)", s.element, format(s.isotropic),
                s.anisotropy.map(format) ?? "",
                ref.map(format) ?? "",
                ref.map { format($0 - s.isotropic) } ?? ""
            ].joined(separator: "\t"))
        }
        rows += ["", "SPIN-SPIN COUPLINGS",
                 "Atom A\tElement A\tAtom B\tElement B\tTotal J (Hz)\tFC (Hz)\tSD (Hz)\tPSO (Hz)\tDSO (Hz)"]
        for c in document.couplings {
            rows.append([
                "\(c.atomA)", c.elementA, "\(c.atomB)", c.elementB, format(c.totalHz),
                c.fermiContactHz.map(format) ?? "", c.spinDipoleHz.map(format) ?? "",
                c.paramagneticSOHz.map(format) ?? "", c.diamagneticSOHz.map(format) ?? ""
            ].joined(separator: "\t"))
        }
        return rows.joined(separator: "\n")
    }

    static func csv(document: NMRDocument, references: [String: Double]) -> String {
        text(document: document, references: references)
            .replacingOccurrences(of: ",", with: ".")
            .replacingOccurrences(of: "\t", with: ",")
    }

    private static func format(_ value: Double) -> String {
        String(format: "%.6f", value)
    }
}
