import SceneKit
import SwiftUI

struct MoleculeView: NSViewRepresentable {
    let atoms: [Atom]
    let shieldings: [Shielding]
    let couplings: [Coupling]
    let references: [String: Double]
    let labelMode: AtomLabelMode
    let labelSize: Double
    let zoom: Double
    let showMultipleBonds: Bool
    let nucleusFilter: String
    let showChemicalShifts: Bool
    let showCouplingLabels: Bool
    let viewPreset: MoleculeViewPreset
    let viewPresetRevision: Int
    @Binding var selectedAtom: Int?

    private struct BondSpec {
        let atomA: Int
        let atomB: Int
        let order: Int
    }

    final class Coordinator {
        var lastPresetRevision = -1
        var lastZoom = 1.0
    }

    final class AtomPickingSCNView: SCNView {
        var atomPicked: ((Int) -> Void)?
        private var mouseDownLocation: NSPoint?

        override func scrollWheel(with event: NSEvent) {
            guard let camera = pointOfView else { return }
            let rawDelta = event.hasPreciseScrollingDeltas ? event.scrollingDeltaY : event.deltaY * 8
            let factor = CGFloat(exp(Double(-rawDelta) * 0.012))
            let clampedFactor = min(1.35, max(0.74, factor))
            let position = camera.position
            let currentDistance = sqrt(
                position.x * position.x +
                position.y * position.y +
                position.z * position.z
            )
            let targetDistance = min(80, max(1.4, currentDistance * clampedFactor))
            guard currentDistance > 0 else { return }
            let scale = targetDistance / currentDistance
            camera.position = SCNVector3(
                position.x * scale,
                position.y * scale,
                position.z * scale
            )
            defaultCameraController.pointOfView = camera
            defaultCameraController.target = SCNVector3Zero
        }

        override func mouseDown(with event: NSEvent) {
            mouseDownLocation = convert(event.locationInWindow, from: nil)
            super.mouseDown(with: event)
        }

        override func mouseUp(with event: NSEvent) {
            super.mouseUp(with: event)
            let location = convert(event.locationInWindow, from: nil)
            if let start = mouseDownLocation,
               hypot(location.x - start.x, location.y - start.y) <= 5,
               let hit = hitTest(location).first,
               let name = atomNodeName(from: hit.node),
               let index = Int(name.dropFirst("atom:".count)) {
                atomPicked?(index)
            }
            mouseDownLocation = nil
        }

        private func atomNodeName(from node: SCNNode) -> String? {
            var current: SCNNode? = node
            while let candidate = current {
                if let name = candidate.name, name.hasPrefix("atom:") { return name }
                current = candidate.parent
            }
            return nil
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeNSView(context: Context) -> SCNView {
        let view = AtomPickingSCNView()
        view.backgroundColor = NSColor(calibratedWhite: 0.055, alpha: 1)
        view.allowsCameraControl = true
        view.autoenablesDefaultLighting = false
        view.antialiasingMode = .multisampling4X
        view.defaultCameraController.interactionMode = .orbitCenteredArcball
        view.defaultCameraController.automaticTarget = false
        view.defaultCameraController.target = SCNVector3Zero
        view.defaultCameraController.inertiaEnabled = true
        view.defaultCameraController.inertiaFriction = 0.08
        view.atomPicked = { index in
            DispatchQueue.main.async { selectedAtom = index }
        }
        return view
    }

    func updateNSView(_ view: SCNView, context: Context) {
        let previousTransform = view.pointOfView?.transform
        let scene = makeScene()
        view.scene = scene
        view.pointOfView = scene.rootNode.childNode(withName: "camera", recursively: false)

        if context.coordinator.lastPresetRevision != viewPresetRevision {
            applyPreset(viewPreset, to: view)
            context.coordinator.lastPresetRevision = viewPresetRevision
            context.coordinator.lastZoom = zoom
        } else if let previousTransform {
            view.pointOfView?.transform = previousTransform
            if abs(context.coordinator.lastZoom - zoom) > 0.0001 {
                scaleCameraDistance(
                    by: context.coordinator.lastZoom / zoom,
                    camera: view.pointOfView
                )
                context.coordinator.lastZoom = zoom
            }
        }
        view.defaultCameraController.pointOfView = view.pointOfView
        view.defaultCameraController.target = SCNVector3Zero
    }

    private func makeScene() -> SCNScene {
        let scene = SCNScene()
        let root = scene.rootNode
        let center = centroid(atoms)

        for atom in atoms {
            let position = SCNVector3(
                Float(atom.x - center.x),
                Float(atom.y - center.y),
                Float(atom.z - center.z)
            )
            let sphere = SCNSphere(radius: atomicRadius(atom.element) * (atom.id == selectedAtom ? 1.28 : 1))
            sphere.segmentCount = 36
            if atom.id == selectedAtom {
                sphere.firstMaterial?.diffuse.contents = NSColor.systemYellow
                sphere.firstMaterial?.emission.contents = NSColor(
                    calibratedRed: 0.55, green: 0.43, blue: 0.02, alpha: 1
                )
            } else {
                sphere.firstMaterial?.diffuse.contents = elementColor(atom.element)
                sphere.firstMaterial?.emission.contents = NSColor.black
            }
            sphere.firstMaterial?.roughness.contents = 0.28
            sphere.firstMaterial?.metalness.contents = 0.05
            let node = SCNNode(geometry: sphere)
            node.name = "atom:\(atom.id)"
            node.position = position
            root.addChildNode(node)

            if labelMode != .none,
               let label = labelNode(for: atom, position: position) {
                root.addChildNode(label)
            }
        }

        for bond in inferredBonds() {
            let a = atoms[bond.atomA], b = atoms[bond.atomB]
            let pa = SCNVector3(
                Float(a.x-center.x),
                Float(a.y-center.y),
                Float(a.z-center.z)
            )
            let pb = SCNVector3(
                Float(b.x-center.x),
                Float(b.y-center.y),
                Float(b.z-center.z)
            )
            root.addChildNode(bondGroup(from: pa, to: pb, order: showMultipleBonds ? bond.order : 1))
        }

        if showCouplingLabels {
            addCouplingOverlays(to: root, center: center)
        }

        let camera = SCNNode()
        camera.name = "camera"
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 42
        let span = max(6.0, molecularSpan(atoms) * 1.8)
        camera.position = SCNVector3(0, 0, Float(span / zoom))
        root.addChildNode(camera)

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .omni
        key.light?.intensity = 1050
        key.position = SCNVector3(8, 10, 12)
        root.addChildNode(key)
        let fill = SCNNode()
        fill.light = SCNLight()
        fill.light?.type = .ambient
        fill.light?.intensity = 520
        fill.light?.color = NSColor(calibratedRed: 0.50, green: 0.58, blue: 0.75, alpha: 1)
        root.addChildNode(fill)
        return scene
    }

    private func applyPreset(_ preset: MoleculeViewPreset, to view: SCNView) {
        guard let camera = view.pointOfView else { return }
        let distance = Float(max(6.0, molecularSpan(atoms) * 1.8) / zoom)
        switch preset {
        case .reset, .front:
            camera.position = SCNVector3(0, 0, distance)
            camera.look(at: SCNVector3Zero, up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 0, -1))
        case .top:
            camera.position = SCNVector3(0, distance, 0.001)
            camera.look(at: SCNVector3Zero, up: SCNVector3(0, 0, -1), localFront: SCNVector3(0, 0, -1))
        case .side:
            camera.position = SCNVector3(distance, 0, 0)
            camera.look(at: SCNVector3Zero, up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 0, -1))
        }
    }

    private func scaleCameraDistance(by factor: Double, camera: SCNNode?) {
        guard let camera else { return }
        camera.position = SCNVector3(
            camera.position.x * factor,
            camera.position.y * factor,
            camera.position.z * factor
        )
    }

    private func labelNode(for atom: Atom, position: SCNVector3) -> SCNNode? {
        let shielding = shieldings.first { $0.atomIndex == atom.id }
        let filterMatches = nucleusFilter == "*" || nucleusFilter == atom.element
        let shift = showChemicalShifts && filterMatches
            ? shielding.flatMap { s in references[s.element].map { $0 - s.isotropic } }
            : nil
        let text: String
        switch labelMode {
        case .none: text = ""
        case .symbol: text = atom.element
        case .number: text = "\(atom.id)"
        case .shift:
            guard filterMatches, showChemicalShifts, let shift else { return nil }
            text = String(format: "%.2f ppm", shift)
        case .full:
            text = "\(atom.element)\(atom.id)" + (shift.map { String(format: "\n%.2f ppm", $0) } ?? "")
        }
        let geometry = SCNText(string: text, extrusionDepth: 0.01)
        geometry.font = NSFont.systemFont(ofSize: labelSize, weight: .semibold)
        geometry.flatness = 0.08
        geometry.firstMaterial?.diffuse.contents = NSColor.white
        geometry.firstMaterial?.emission.contents = NSColor(calibratedWhite: 0.18, alpha: 1)
        let node = SCNNode(geometry: geometry)
        let bounds = geometry.boundingBox
        node.pivot = SCNMatrix4MakeTranslation((bounds.max.x + bounds.min.x) / 2, bounds.min.y, 0)
        node.position = SCNVector3(position.x, position.y + atomicRadius(atom.element) + 0.22, position.z)
        node.constraints = [SCNBillboardConstraint()]
        return node
    }

    private func addCouplingOverlays(
        to root: SCNNode,
        center: (x: Double, y: Double, z: Double)
    ) {
        for coupling in couplingsForCurrentFilter() {
            guard let atomA = atoms.first(where: { $0.id == coupling.atomA }),
                  let atomB = atoms.first(where: { $0.id == coupling.atomB }) else { continue }
            let a = SCNVector3(
                Float(atomA.x-center.x), Float(atomA.y-center.y), Float(atomA.z-center.z)
            )
            let b = SCNVector3(
                Float(atomB.x-center.x), Float(atomB.y-center.y), Float(atomB.z-center.z)
            )
            root.addChildNode(couplingLine(from: a, to: b))
            root.addChildNode(couplingLabel(coupling, from: a, to: b))
        }
    }

    private func couplingsForCurrentFilter() -> [Coupling] {
        guard nucleusFilter != "*" else { return couplings }
        return couplings.filter {
            $0.elementA == nucleusFilter || $0.elementB == nucleusFilter
        }
    }

    private func couplingLine(from a: SCNVector3, to b: SCNVector3) -> SCNNode {
        let node = bondNode(from: a, to: b, multiple: true)
        if let cylinder = node.geometry as? SCNCylinder {
            cylinder.radius = 0.025
            cylinder.firstMaterial?.diffuse.contents = NSColor.systemTeal.withAlphaComponent(0.55)
            cylinder.firstMaterial?.emission.contents = NSColor.systemTeal.withAlphaComponent(0.18)
            cylinder.firstMaterial?.transparency = 0.72
        }
        return node
    }

    private func couplingLabel(_ coupling: Coupling, from a: SCNVector3, to b: SCNVector3) -> SCNNode {
        let text = String(
            format: "J %@%d–%@%d\n%.2f Hz",
            coupling.elementA, coupling.atomA,
            coupling.elementB, coupling.atomB,
            coupling.totalHz
        )
        let geometry = SCNText(string: text, extrusionDepth: 0.006)
        geometry.font = NSFont.systemFont(ofSize: max(0.20, labelSize * 0.82), weight: .medium)
        geometry.flatness = 0.08
        geometry.firstMaterial?.diffuse.contents = NSColor.systemTeal
        geometry.firstMaterial?.emission.contents = NSColor(
            calibratedRed: 0.02, green: 0.24, blue: 0.25, alpha: 1
        )
        let node = SCNNode(geometry: geometry)
        let bounds = geometry.boundingBox
        node.pivot = SCNMatrix4MakeTranslation(
            (bounds.max.x + bounds.min.x) / 2,
            (bounds.max.y + bounds.min.y) / 2,
            0
        )
        node.position = SCNVector3(
            (a.x+b.x)/2,
            (a.y+b.y)/2 + 0.16,
            (a.z+b.z)/2
        )
        node.constraints = [SCNBillboardConstraint()]
        return node
    }

    private func bondGroup(from a: SCNVector3, to b: SCNVector3, order: Int) -> SCNNode {
        let group = SCNNode()
        let offsets: [CGFloat]
        switch order {
        case 2: offsets = [-0.105, 0.105]
        case 3: offsets = [-0.17, 0, 0.17]
        default: offsets = [0]
        }
        let perpendicular = perpendicularVector(from: a, to: b)
        for offset in offsets {
            let delta = SCNVector3(
                perpendicular.x * offset,
                perpendicular.y * offset,
                perpendicular.z * offset
            )
            group.addChildNode(bondNode(from: a + delta, to: b + delta, multiple: order > 1))
        }
        return group
    }

    private func bondNode(from a: SCNVector3, to b: SCNVector3, multiple: Bool) -> SCNNode {
        let dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z
        let length = sqrt(dx*dx + dy*dy + dz*dz)
        let cylinder = SCNCylinder(radius: multiple ? 0.055 : 0.075, height: CGFloat(length))
        cylinder.radialSegmentCount = 18
        cylinder.firstMaterial?.diffuse.contents = NSColor(calibratedWhite: 0.58, alpha: 1)
        let node = SCNNode(geometry: cylinder)
        node.position = SCNVector3((a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2)
        node.look(at: b, up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 1, 0))
        return node
    }

    private func perpendicularVector(from a: SCNVector3, to b: SCNVector3) -> SCNVector3 {
        let direction = normalized(SCNVector3(b.x-a.x, b.y-a.y, b.z-a.z))
        let reference = abs(direction.y) < 0.85 ? SCNVector3(0, 1, 0) : SCNVector3(1, 0, 0)
        return normalized(SCNVector3(
            direction.y * reference.z - direction.z * reference.y,
            direction.z * reference.x - direction.x * reference.z,
            direction.x * reference.y - direction.y * reference.x
        ))
    }

    private func normalized(_ vector: SCNVector3) -> SCNVector3 {
        let length = sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z)
        guard length > 0 else { return SCNVector3(1, 0, 0) }
        return SCNVector3(vector.x/length, vector.y/length, vector.z/length)
    }

    private func inferredBonds() -> [BondSpec] {
        struct Candidate {
            let a: Int
            let b: Int
            let distance: Double
            let targetOrder: Int
        }

        var candidates: [Candidate] = []
        for i in atoms.indices {
            for j in atoms.indices where j > i {
                let a = atoms[i], b = atoms[j]
                let distance = sqrt(pow(a.x-b.x, 2) + pow(a.y-b.y, 2) + pow(a.z-b.z, 2))
                let threshold = 1.22 * (covalentRadius(a.element) + covalentRadius(b.element))
                if distance > 0.35 && distance <= threshold {
                    candidates.append(Candidate(
                        a: i, b: j, distance: distance,
                        targetOrder: geometricBondOrder(a.element, b.element, distance)
                    ))
                }
            }
        }

        var orders = Array(repeating: 1, count: candidates.count)
        var usedValence = Array(repeating: 0, count: atoms.count)
        for candidate in candidates {
            usedValence[candidate.a] += 1
            usedValence[candidate.b] += 1
        }

        let promotionOrder = candidates.indices.sorted {
            candidates[$0].distance < candidates[$1].distance
        }
        for index in promotionOrder {
            let candidate = candidates[index]
            while orders[index] < candidate.targetOrder,
                  usedValence[candidate.a] < normalValence(atoms[candidate.a].element),
                  usedValence[candidate.b] < normalValence(atoms[candidate.b].element) {
                orders[index] += 1
                usedValence[candidate.a] += 1
                usedValence[candidate.b] += 1
            }
        }

        return candidates.indices.map {
            BondSpec(atomA: candidates[$0].a, atomB: candidates[$0].b, order: orders[$0])
        }
    }

    private func geometricBondOrder(_ elementA: String, _ elementB: String, _ distance: Double) -> Int {
        let pair = [elementA, elementB].sorted().joined(separator: "-")
        switch pair {
        case "C-C": return distance <= 1.27 ? 3 : (distance <= 1.44 ? 2 : 1)
        case "C-N": return distance <= 1.21 ? 3 : (distance <= 1.36 ? 2 : 1)
        case "N-N": return distance <= 1.17 ? 3 : (distance <= 1.32 ? 2 : 1)
        case "C-O": return distance <= 1.32 ? 2 : 1
        case "N-O": return distance <= 1.30 ? 2 : 1
        case "C-S": return distance <= 1.66 ? 2 : 1
        case "O-P": return distance <= 1.56 ? 2 : 1
        default: return 1
        }
    }

    private func normalValence(_ element: String) -> Int {
        switch element {
        case "H", "F", "Cl", "Br", "I": 1
        case "O": 2
        case "N": 3
        case "C", "Si": 4
        case "P": 5
        case "S": 6
        default: 6
        }
    }

    private func centroid(_ atoms: [Atom]) -> (x: Double, y: Double, z: Double) {
        guard !atoms.isEmpty else { return (0, 0, 0) }
        let n = Double(atoms.count)
        return (atoms.reduce(0) { $0+$1.x }/n,
                atoms.reduce(0) { $0+$1.y }/n,
                atoms.reduce(0) { $0+$1.z }/n)
    }

    private func molecularSpan(_ atoms: [Atom]) -> Double {
        guard let first = atoms.first else { return 5 }
        let xs = atoms.map(\.x), ys = atoms.map(\.y), zs = atoms.map(\.z)
        let xSpan = (xs.max() ?? first.x) - (xs.min() ?? first.x)
        let ySpan = (ys.max() ?? first.y) - (ys.min() ?? first.y)
        let zSpan = (zs.max() ?? first.z) - (zs.min() ?? first.z)
        return max(xSpan, max(ySpan, zSpan))
    }

    private func atomicRadius(_ element: String) -> CGFloat {
        switch element { case "H": 0.24; case "C": 0.36; case "N": 0.34; case "O": 0.33
        case "F": 0.31; case "P": 0.43; case "S": 0.42; case "Cl": 0.43; default: 0.38 }
    }

    private func covalentRadius(_ element: String) -> Double {
        switch element { case "H": 0.31; case "C": 0.76; case "N": 0.71; case "O": 0.66
        case "F": 0.57; case "P": 1.07; case "S": 1.05; case "Cl": 1.02
        case "Br": 1.20; case "I": 1.39; case "Si": 1.11; default: 0.85 }
    }

    private func elementColor(_ element: String) -> NSColor {
        switch element {
        case "H": .white
        case "C": NSColor(calibratedWhite: 0.18, alpha: 1)
        case "N": NSColor(calibratedRed: 0.18, green: 0.35, blue: 0.95, alpha: 1)
        case "O": NSColor(calibratedRed: 0.92, green: 0.15, blue: 0.14, alpha: 1)
        case "F", "Cl": NSColor(calibratedRed: 0.18, green: 0.78, blue: 0.26, alpha: 1)
        case "Br": NSColor(calibratedRed: 0.55, green: 0.17, blue: 0.10, alpha: 1)
        case "I": NSColor(calibratedRed: 0.48, green: 0.17, blue: 0.70, alpha: 1)
        case "P": NSColor(calibratedRed: 1.0, green: 0.48, blue: 0.08, alpha: 1)
        case "S": NSColor(calibratedRed: 0.95, green: 0.82, blue: 0.10, alpha: 1)
        default: NSColor(calibratedRed: 0.30, green: 0.72, blue: 0.75, alpha: 1)
        }
    }
}

private func + (lhs: SCNVector3, rhs: SCNVector3) -> SCNVector3 {
    SCNVector3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z)
}
