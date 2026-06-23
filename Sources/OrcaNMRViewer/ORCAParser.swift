import Foundation

struct ORCAParser {
    func parse(url: URL) throws -> NMRDocument {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else {
            throw NMRParseError.unreadable
        }
        return try parse(text: text, sourceName: url.lastPathComponent)
    }

    func parse(text: String, sourceName: String = "ORCA output") throws -> NMRDocument {
        let normalized = text.replacingOccurrences(of: "\r\n", with: "\n")
        let atoms = parseCoordinates(normalized)
        let shieldings = parseShieldings(normalized, atoms: atoms)
        let couplings = parseCouplings(normalized, atoms: atoms)

        guard !atoms.isEmpty || !shieldings.isEmpty || !couplings.isEmpty else {
            throw NMRParseError.unsupported
        }

        var warnings: [String] = []
        if atoms.isEmpty { warnings.append("No Cartesian coordinates were found. The 3D view is unavailable.") }
        if shieldings.isEmpty { warnings.append("No isotropic shielding summary was found.") }
        if couplings.isEmpty { warnings.append("No spin-spin coupling constants were found.") }

        return NMRDocument(
            sourceName: sourceName,
            atoms: atoms,
            shieldings: shieldings,
            couplings: couplings,
            warnings: warnings
        )
    }

    private func parseCoordinates(_ text: String) -> [Atom] {
        var blocks: [[Atom]] = []
        let lines = text.components(separatedBy: .newlines)
        var index = 0

        while index < lines.count {
            let upper = lines[index].uppercased()
            if upper.contains("CARTESIAN COORDINATES") && !upper.contains("A.U.") {
                var block: [Atom] = []
                index += 1
                while index < lines.count {
                    let line = lines[index].trimmingCharacters(in: .whitespaces)
                    if line.isEmpty || line.allSatisfy({ $0 == "-" }) {
                        index += 1
                        if !block.isEmpty { break }
                        continue
                    }
                    if let atom = coordinateAtom(from: line, fallbackIndex: block.count) {
                        block.append(atom)
                    } else if !block.isEmpty {
                        break
                    }
                    index += 1
                }
                if !block.isEmpty { blocks.append(block) }
            }
            index += 1
        }

        if let last = blocks.last { return last }
        return parseXYZLikeCoordinates(text)
    }

    private func coordinateAtom(from line: String, fallbackIndex: Int) -> Atom? {
        let fields = line.split(whereSeparator: \.isWhitespace).map(String.init)
        guard fields.count >= 4 else { return nil }

        let offset: Int
        let atomIndex: Int
        if fields.count >= 5, let parsedIndex = Int(fields[0]),
           isElement(fields[1]) {
            offset = 1
            atomIndex = parsedIndex
        } else if isElement(fields[0]) {
            offset = 0
            atomIndex = fallbackIndex
        } else {
            return nil
        }

        guard fields.count > offset + 3,
              let x = Double(fields[offset + 1]),
              let y = Double(fields[offset + 2]),
              let z = Double(fields[offset + 3]) else { return nil }
        return Atom(id: atomIndex, element: normalizeElement(fields[offset]), x: x, y: y, z: z)
    }

    private func parseXYZLikeCoordinates(_ text: String) -> [Atom] {
        let lines = text.components(separatedBy: .newlines)
        var best: [Atom] = []
        var current: [Atom] = []
        for line in lines {
            if let atom = coordinateAtom(from: line.trimmingCharacters(in: .whitespaces), fallbackIndex: current.count) {
                current.append(atom)
            } else {
                if current.count > best.count { best = current }
                current = []
            }
        }
        if current.count > best.count { best = current }
        return best.count >= 2 ? best : []
    }

    private func parseShieldings(_ text: String, atoms: [Atom]) -> [Shielding] {
        var results: [Int: Shielding] = [:]
        let lines = text.components(separatedBy: .newlines)

        for i in lines.indices {
            let line = lines[i]
            if line.contains("Nucleus") && line.contains("Element") &&
                line.contains("Isotropic") && line.contains("Anisotropy") {
                var j = i + 1
                while j < lines.count {
                    let fields = lines[j].split(whereSeparator: \.isWhitespace).map(String.init)
                    if fields.count >= 4, let atomIndex = Int(fields[0]),
                       isElement(fields[1]), let iso = Double(fields[2]) {
                        let anisotropy = Double(fields[3])
                        results[atomIndex] = Shielding(
                            atomIndex: atomIndex,
                            element: normalizeElement(fields[1]),
                            isotropic: iso,
                            anisotropy: anisotropy
                        )
                    } else if !results.isEmpty && lines[j].trimmingCharacters(in: .whitespaces).isEmpty {
                        break
                    }
                    j += 1
                }
            }
        }

        // Fallback for detailed per-nucleus blocks.
        var activeNucleus: (Int, String)?
        for line in lines {
            if let nucleus = parseNucleusHeader(line) { activeNucleus = nucleus }
            if let nucleus = activeNucleus, line.contains("Total"), line.contains("iso="),
               let iso = value(after: "iso=", in: line) {
                if results[nucleus.0] == nil {
                    results[nucleus.0] = Shielding(
                        atomIndex: nucleus.0,
                        element: nucleus.1,
                        isotropic: iso,
                        anisotropy: nil
                    )
                }
            }
        }

        // Property files vary by ORCA release; accept common scalar component layouts.
        for line in lines where line.lowercased().contains("isotropic") {
            let fields = line.split(whereSeparator: \.isWhitespace).map(String.init)
            let numbers = fields.compactMap(Double.init)
            if numbers.count >= 2 {
                let atomIndex = Int(numbers[0])
                if results[atomIndex] == nil, let atom = atoms.first(where: { $0.id == atomIndex }) {
                    guard let isotropic = numbers.last else { continue }
                    results[atomIndex] = Shielding(
                        atomIndex: atomIndex,
                        element: atom.element,
                        isotropic: isotropic,
                        anisotropy: nil
                    )
                }
            }
        }
        return results.values.sorted { $0.atomIndex < $1.atomIndex }
    }

    private func parseCouplings(_ text: String, atoms: [Atom]) -> [Coupling] {
        let lines = text.components(separatedBy: .newlines)
        var results: [String: Coupling] = [:]
        var pair: (Int, String, Int, String)?
        var fc: Double?
        var sd: Double?
        var pso: Double?
        var dso: Double?

        func store(_ total: Double) {
            guard let pair else { return }
            let key = "\(min(pair.0, pair.2))-\(max(pair.0, pair.2))"
            results[key] = Coupling(
                atomA: pair.0, elementA: pair.1,
                atomB: pair.2, elementB: pair.3,
                totalHz: total,
                fermiContactHz: fc, spinDipoleHz: sd,
                paramagneticSOHz: pso, diamagneticSOHz: dso
            )
        }

        for line in lines {
            if let parsedPair = parseCouplingPair(line, atoms: atoms) {
                pair = parsedPair
                fc = nil; sd = nil; pso = nil; dso = nil
                continue
            }
            let lower = line.lowercased()
            if lower.contains("fermi") && lower.contains("contact") { fc = lastNumber(in: line) }
            if lower.contains("spin") && lower.contains("dipol") { sd = lastNumber(in: line) }
            if lower.contains("paramagnetic") && lower.contains("spin") { pso = lastNumber(in: line) }
            if lower.contains("diamagnetic") && lower.contains("spin") { dso = lastNumber(in: line) }
            if pair != nil && (lower.contains("total") || lower.contains("isotropic coupling")),
               let total = value(after: "iso=", in: line) ?? lastNumber(in: line) {
                store(total)
            }

            // Compact summaries: atomA elementA atomB elementB J(Hz)
            let f = line.split(whereSeparator: \.isWhitespace).map(String.init)
            if f.count >= 5, let a = Int(f[0]), isElement(f[1]),
               let b = Int(f[2]), isElement(f[3]), let total = Double(f[4]) {
                pair = (a, normalizeElement(f[1]), b, normalizeElement(f[3]))
                store(total)
            }
        }
        return results.values.sorted {
            ($0.atomA, $0.atomB) < ($1.atomA, $1.atomB)
        }
    }

    private func parseNucleusHeader(_ line: String) -> (Int, String)? {
        guard line.contains("Nucleus") else { return nil }
        let cleaned = line.replacingOccurrences(of: ":", with: " ")
        for token in cleaned.split(whereSeparator: \.isWhitespace).map(String.init) {
            let digits = token.prefix(while: \.isNumber)
            let letters = token.dropFirst(digits.count).prefix(while: \.isLetter)
            if let index = Int(digits), isElement(String(letters)) {
                return (index, normalizeElement(String(letters)))
            }
        }
        return nil
    }

    private func parseCouplingPair(_ line: String, atoms: [Atom]) -> (Int, String, Int, String)? {
        let lower = line.lowercased()
        guard (lower.contains("nucleus") || lower.contains("atom")) &&
              (lower.contains("coupling") || lower.contains("nucleus b") || lower.contains("atom b")) else {
            return nil
        }
        let regex = try? NSRegularExpression(pattern: #"(\d+)\s*([A-Za-z]{1,2})"#)
        let range = NSRange(line.startIndex..., in: line)
        let matches = regex?.matches(in: line, range: range) ?? []
        if matches.count >= 2 {
            func capture(_ match: NSTextCheckingResult, _ group: Int) -> String {
                guard let r = Range(match.range(at: group), in: line) else { return "" }
                return String(line[r])
            }
            if let a = Int(capture(matches[0], 1)),
               let b = Int(capture(matches[1], 1)) {
                return (a, normalizeElement(capture(matches[0], 2)),
                        b, normalizeElement(capture(matches[1], 2)))
            }
        }

        let numbers = line.split(whereSeparator: { !$0.isNumber }).compactMap { Int($0) }
        if numbers.count >= 2 {
            let a = numbers[0], b = numbers[1]
            let ea = atoms.first(where: { $0.id == a })?.element ?? "?"
            let eb = atoms.first(where: { $0.id == b })?.element ?? "?"
            return (a, ea, b, eb)
        }
        return nil
    }

    private func value(after marker: String, in line: String) -> Double? {
        guard let range = line.range(of: marker, options: .caseInsensitive) else { return nil }
        let tail = line[range.upperBound...]
        return tail.split(whereSeparator: \.isWhitespace).first.flatMap { Double($0) }
    }

    private func lastNumber(in line: String) -> Double? {
        line.split(whereSeparator: \.isWhitespace).reversed().compactMap { Double($0) }.first
    }

    private func isElement(_ value: String) -> Bool {
        let letters = value.filter(\.isLetter)
        return !letters.isEmpty && letters.count <= 2
    }

    private func normalizeElement(_ value: String) -> String {
        let letters = value.filter(\.isLetter).lowercased()
        return letters.prefix(1).uppercased() + letters.dropFirst()
    }
}
