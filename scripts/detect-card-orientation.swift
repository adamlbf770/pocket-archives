#!/usr/bin/env swift
import Foundation
import ImageIO
import Vision

struct Candidate: Codable { let rotation: Int; let score: Int; let lines: [String] }
struct Result: Codable { let file: String; let candidates: [Candidate] }
let encoder = JSONEncoder(); encoder.outputFormatting = [.withoutEscapingSlashes]

func recognize(_ path: String, _ orientation: CGImagePropertyOrientation) throws -> [String] {
    let request = VNRecognizeTextRequest(); request.recognitionLevel = .accurate; request.usesLanguageCorrection = true; request.minimumTextHeight = 0.008
    let supported = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["en-US", "ja-JP", "ko-KR", "zh-Hans", "zh-Hant"].filter { supported.contains($0) }
    try VNImageRequestHandler(url: URL(fileURLWithPath: path), orientation: orientation).perform([request])
    return (request.results ?? []).sorted {
        if abs($0.boundingBox.midY - $1.boundingBox.midY) > 0.02 { return $0.boundingBox.midY > $1.boundingBox.midY }
        return $0.boundingBox.minX < $1.boundingBox.minX
    }.compactMap { $0.topCandidates(1).first?.string }
}
func semanticScore(_ lines: [String]) -> Int {
    guard !lines.isEmpty else { return 0 }
    let top = lines.prefix(max(2, lines.count / 3)).joined(separator: " ").lowercased()
    let bottom = lines.suffix(max(2, lines.count / 3)).joined(separator: " ").lowercased()
    var score = lines.reduce(0) { $0 + $1.count } + lines.count * 8
    for token in ["basic", "stage", "trainer", "energy", "battle", "extra", "leader", "hp"] where top.contains(token) { score += 80 }
    for token in ["illus", "©", "made in japan", "game freak", "bandai", "en", "rarity"] where bottom.contains(token) { score += 70 }
    if bottom.range(of: #"[a-z]{1,4}[0-9]{1,2}[- /][0-9]{2,3}"#, options: .regularExpression) != nil { score += 100 }
    if top.contains("©") || top.contains("made in japan") || top.contains("game freak") { score -= 100 }
    return score
}
let orientations: [(Int, CGImagePropertyOrientation)] = [(0,.up),(180,.down),(90,.right),(270,.left)]
for path in CommandLine.arguments.dropFirst() {
    autoreleasepool {
        let candidates = orientations.map { rotation, orientation -> Candidate in
            let lines = (try? recognize(path, orientation)) ?? []
            return Candidate(rotation: rotation, score: semanticScore(lines), lines: lines)
        }.sorted { $0.score > $1.score }
        let result = Result(file: URL(fileURLWithPath: path).lastPathComponent, candidates: candidates)
        print(String(data: try! encoder.encode(result), encoding: .utf8)!)
    }
}
