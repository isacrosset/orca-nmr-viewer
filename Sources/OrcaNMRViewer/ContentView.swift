import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        Group {
            if let document = model.document {
                loadedView(document)
            } else {
                welcomeView
            }
        }
        .frame(minWidth: 1050, minHeight: 680)
        .toolbar {
            ToolbarItemGroup {
                Button("Open ORCA File", systemImage: "folder") { model.openFile() }
                if model.document != nil {
                    Menu("Export", systemImage: "square.and.arrow.up") {
                        Button("Text (.txt)") { model.exportText() }
                        Button("Excel-compatible CSV (.csv)") { model.exportCSV() }
                    }
                }
            }
        }
        .alert("Could Not Open File", isPresented: $model.showingError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.errorMessage ?? "Unknown error")
        }
        .onDrop(of: [.fileURL], isTargeted: nil) { providers in
            guard let provider = providers.first else { return false }
            _ = provider.loadObject(ofClass: URL.self) { url, _ in
                if let url { Task { @MainActor in model.load(url) } }
            }
            return true
        }
    }

    private var welcomeView: some View {
        VStack(spacing: 18) {
            Image(systemName: "atom")
                .font(.system(size: 72, weight: .thin))
                .foregroundStyle(.blue)
            Text("ORCA NMR Viewer")
                .font(.largeTitle.bold())
            Text("Open or drop an ORCA output or .property.txt file to inspect\nNMR shieldings, chemical shifts, couplings, and molecular geometry.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            Button("Open ORCA File…") { model.openFile() }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
        }
    }

    private func loadedView(_ document: NMRDocument) -> some View {
        HSplitView {
            VStack(spacing: 0) {
                MoleculeView(
                    atoms: document.atoms,
                    shieldings: document.shieldings,
                    couplings: document.couplings,
                    references: model.references,
                    labelMode: model.labelMode,
                    labelSize: model.labelSize,
                    zoom: model.zoom,
                    showMultipleBonds: model.showMultipleBonds,
                    nucleusFilter: model.nucleusFilter,
                    showChemicalShifts: model.showChemicalShifts,
                    showCouplingLabels: model.showCouplingLabels,
                    viewPreset: model.viewPreset,
                    viewPresetRevision: model.viewPresetRevision,
                    selectedAtom: Binding(
                        get: { model.selectedAtom },
                        set: { value in
                            if let value { model.selectAtom(value) }
                            else { model.selectedAtom = nil }
                        }
                    )
                )
                .overlay(alignment: .topLeading) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.sourceName).font(.headline)
                        Text("\(document.atoms.count) atoms")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    .padding(12)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
                    .padding()
                }
                .overlay(alignment: .bottomLeading) {
                    Text("Drag to rotate • Mouse wheel/trackpad to zoom • Click an atom to select it")
                        .font(.caption).foregroundStyle(.secondary)
                        .padding(10)
                }

                controls(document)
                    .padding(12)
                    .background(.bar)
            }
            .frame(minWidth: 480)

            ResultsView(document: document)
                .frame(minWidth: 500)
        }
    }

    private func controls(_ document: NMRDocument) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Atom labels").font(.headline)
                Picker("", selection: $model.labelMode) {
                    ForEach(AtomLabelMode.allCases) { Text($0.rawValue).tag($0) }
                }
                .labelsHidden()
                Text("Size")
                Slider(value: $model.labelSize, in: 0.20...0.90)
                    .frame(width: 90)
                Text(model.labelSize, format: .number.precision(.fractionLength(2)))
                    .monospacedDigit()
                    .frame(width: 34)
                Divider().frame(height: 20)
                Text("Zoom")
                Button {
                    model.zoom = max(0.45, model.zoom - 0.15)
                } label: {
                    Image(systemName: "minus.magnifyingglass")
                }
                Slider(value: $model.zoom, in: 0.45...2.5)
                    .frame(width: 90)
                Button {
                    model.zoom = min(2.5, model.zoom + 0.15)
                } label: {
                    Image(systemName: "plus.magnifyingglass")
                }
                Button("Reset") { model.zoom = 1.0 }
                Spacer()
            }
            HStack {
                Text("View").font(.headline)
                Button("Reset") { model.applyViewPreset(.reset) }
                Button("Front") { model.applyViewPreset(.front) }
                Button("Top") { model.applyViewPreset(.top) }
                Button("Side") { model.applyViewPreset(.side) }
                Text("Arcball rotation with inertia; use the mouse wheel or trackpad to zoom.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            HStack {
                Toggle("Estimate and show double/triple bonds", isOn: $model.showMultipleBonds)
                Spacer()
                Text("Bond orders are inferred from geometry and normal valence rules.")
                    .foregroundStyle(.secondary)
            }
            .font(.caption)
            HStack {
                Text("NMR overlays").font(.headline)
                Picker("Nuclei", selection: $model.nucleusFilter) {
                    Text("All nuclei").tag("*")
                    ForEach(nmrElements(document), id: \.self) { element in
                        Text(isotopeName(element)).tag(element)
                    }
                }
                .frame(width: 150)
                Toggle("Chemical shifts", isOn: $model.showChemicalShifts)
                Toggle("Coupling constants", isOn: $model.showCouplingLabels)
                Spacer()
            }
            Text("The nucleus filter affects NMR values only. Couplings include every pair involving the selected nucleus.")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text("References").font(.headline)
                ForEach(referenceElements(document), id: \.self) { element in
                    HStack(spacing: 4) {
                        Text("σ \(element)")
                        TextField("ppm", value: referenceBinding(element), format: .number.precision(.fractionLength(4)))
                            .frame(width: 82)
                        Text("ppm").foregroundStyle(.secondary)
                    }
                }
            }
            Text("Use TMS shielding values calculated with the same method, basis set, and solvent model as the molecule.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    private func referenceElements(_ document: NMRDocument) -> [String] {
        let found = Set(document.shieldings.map(\.element))
        return Array(found.union(["H", "C"])).sorted()
    }

    private func nmrElements(_ document: NMRDocument) -> [String] {
        let shieldingElements = document.shieldings.map(\.element)
        let couplingElements = document.couplings.flatMap { [$0.elementA, $0.elementB] }
        return Array(Set(shieldingElements + couplingElements).filter { $0 != "?" }).sorted {
            nucleusPriority($0) < nucleusPriority($1)
        }
    }

    private func nucleusPriority(_ element: String) -> String {
        switch element {
        case "H": return "00"
        case "C": return "01"
        default: return "10-\(element)"
        }
    }

    private func isotopeName(_ element: String) -> String {
        switch element {
        case "H": return "¹H"
        case "C": return "¹³C"
        case "N": return "¹⁵N"
        case "F": return "¹⁹F"
        case "P": return "³¹P"
        case "Si": return "²⁹Si"
        default: return element
        }
    }

    private func referenceBinding(_ element: String) -> Binding<Double> {
        Binding(
            get: { model.references[element] ?? 0 },
            set: { model.references[element] = $0 }
        )
    }
}

private struct ResultsView: View {
    @EnvironmentObject private var model: AppModel
    let document: NMRDocument

    var body: some View {
        VStack(spacing: 0) {
            if !document.warnings.isEmpty {
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(document.warnings, id: \.self) {
                        Label($0, systemImage: "exclamationmark.triangle")
                    }
                }
                .font(.caption)
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.12))
            }
            TabView(selection: $model.resultsTab) {
                shieldingTable
                    .tabItem { Label("Shieldings", systemImage: "tablecells") }
                    .tag(0)
                couplingTable
                    .tabItem { Label("Couplings", systemImage: "link") }
                    .tag(1)
            }
            .padding(8)
        }
    }

    private var shieldingTable: some View {
        Table(document.shieldings, selection: $model.selectedAtom) {
            TableColumn("Atom") { s in Text("\(s.element)\(s.atomIndex)") }
                .width(min: 65, ideal: 78)
            TableColumn("Shielding / ppm") { s in Text(s.isotropic, format: .number.precision(.fractionLength(3))) }
            TableColumn("Anisotropy / ppm") { s in
                if let value = s.anisotropy {
                    Text(value, format: .number.precision(.fractionLength(3)))
                } else { Text("—").foregroundStyle(.secondary) }
            }
            TableColumn("TMS ref. / ppm") { s in
                if let value = model.references[s.element] {
                    Text(value, format: .number.precision(.fractionLength(3)))
                } else { Text("—").foregroundStyle(.secondary) }
            }
            TableColumn("Shift δ / ppm") { s in
                if let value = model.shift(for: s) {
                    Text(value, format: .number.precision(.fractionLength(3))).fontWeight(.semibold)
                } else { Text("—").foregroundStyle(.secondary) }
            }
        }
    }

    private var couplingTable: some View {
        Table(document.couplings) {
            TableColumn("Atom A") { c in Text("\(c.elementA)\(c.atomA)") }
            TableColumn("Atom B") { c in Text("\(c.elementB)\(c.atomB)") }
            TableColumn("Total J / Hz") { c in Text(c.totalHz, format: .number.precision(.fractionLength(3))) }
            TableColumn("FC / Hz") { c in optional(c.fermiContactHz) }
            TableColumn("SD / Hz") { c in optional(c.spinDipoleHz) }
            TableColumn("PSO / Hz") { c in optional(c.paramagneticSOHz) }
            TableColumn("DSO / Hz") { c in optional(c.diamagneticSOHz) }
        }
        .overlay {
            if document.couplings.isEmpty {
                ContentUnavailableView("No Couplings Found", systemImage: "link.badge.plus",
                                       description: Text("The file does not contain recognized spin-spin coupling results."))
            }
        }
    }

    private func optional(_ value: Double?) -> some View {
        Group {
            if let value { Text(value, format: .number.precision(.fractionLength(3))) }
            else { Text("—").foregroundStyle(.secondary) }
        }
    }
}
