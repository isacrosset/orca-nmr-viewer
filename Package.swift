// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OrcaNMRViewer",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "OrcaNMRViewer", targets: ["OrcaNMRViewer"])
    ],
    targets: [
        .executableTarget(
            name: "OrcaNMRViewer",
            path: "Sources/OrcaNMRViewer"
        ),
        .testTarget(
            name: "OrcaNMRViewerTests",
            dependencies: ["OrcaNMRViewer"],
            path: "Tests/OrcaNMRViewerTests"
        )
    ]
)
