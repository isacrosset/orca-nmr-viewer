import SwiftUI

@main
struct OrcaNMRViewerApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
        }
        .windowStyle(.titleBar)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Open ORCA File…") { model.openFile() }
                    .keyboardShortcut("o")
            }
            CommandMenu("Export") {
                Button("Export Text…") { model.exportText() }
                    .disabled(model.document == nil)
                Button("Export Excel-compatible CSV…") { model.exportCSV() }
                    .disabled(model.document == nil)
            }
        }
    }
}
