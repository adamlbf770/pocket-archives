#!/usr/bin/env swift

import Foundation
import ImageIO
import Vision

struct Landmark: Codable {
    let text: String
    let midX: Double
    let midY: Double
    let confidence: Float
    let kind: String
}

struct Result: Codable {
    let file: String
    let uprightScore: Int
    let invertedScore: Int
    let clockwiseScore: Int
    let counterclockwiseScore: Int
    let decision: String
    let correctionRotation: Int?
    let exifOrientation: Int
    let landmarks: [Landmark]
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for file in CommandLine.arguments.dropFirst() {
    autoreleasepool {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.minimumTextHeight = 0.008
        let supported = (try? request.supportedRecognitionLanguages()) ?? []
        request.recognitionLanguages = ["en-US", "ja-JP", "ko-KR", "zh-Hans", "zh-Hant"].filter { supported.contains($0) }
        try? VNImageRequestHandler(url: URL(fileURLWithPath: file), orientation: .up).perform([request])

        var uprightScore = 0
        var invertedScore = 0
        var clockwiseScore = 0
        var counterclockwiseScore = 0
        var landmarks: [Landmark] = []
        let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: file) as CFURL, nil)
        let properties = source.flatMap { CGImageSourceCopyPropertiesAtIndex($0, 0, nil) as? [CFString: Any] } ?? [:]
        let width = (properties[kCGImagePropertyPixelWidth] as? NSNumber)?.doubleValue ?? 0
        let height = (properties[kCGImagePropertyPixelHeight] as? NSNumber)?.doubleValue ?? 0
        let exifOrientation = (properties[kCGImagePropertyOrientation] as? NSNumber)?.intValue ?? 1
        let portrait = height >= width
        for observation in request.results ?? [] {
            guard let candidate = observation.topCandidates(1).first else { continue }
            let text = candidate.string.lowercased()
            let y = Double(observation.boundingBox.midY)
            let x = Double(observation.boundingBox.midX)
            let confidence = candidate.confidence

            let topPattern = #"^(?:.{0,16}\bhp\b|basic(?:\s+pokémon)?|stage\b.*|trainer\b.*|energy\b.*)$"#
            let isTop = text.count <= 32 && text.range(of: topPattern, options: .regularExpression) != nil
            let isBottom = ["illus", "illustrator", "game freak", "nintendo", "creatures", "wizards of the coast", "bandai", "©"].contains { text.contains($0) }
            guard isTop || isBottom else { continue }

            let kind = isBottom ? "BOTTOM" : "TOP"
            landmarks.append(Landmark(text: candidate.string, midX: x, midY: y, confidence: confidence, kind: kind))
            let weight = confidence >= 0.7 ? 3 : confidence >= 0.35 ? 2 : 1
            // Vision uses a lower-left origin for raw image observations.
            // Only score landmarks in the outer thirds so rules text cannot
            // masquerade as a title/header landmark.
            if isTop {
                if y >= 0.80 { uprightScore += weight }
                if y <= 0.20 { invertedScore += weight }
                if x <= 0.20 { clockwiseScore += weight }
                if x >= 0.80 { counterclockwiseScore += weight }
            }
            if isBottom {
                if y <= 0.20 { uprightScore += weight }
                if y >= 0.80 { invertedScore += weight }
                if x >= 0.80 { clockwiseScore += weight }
                if x <= 0.20 { counterclockwiseScore += weight }
            }
        }

        let relevantScores = portrait ? [("UPRIGHT", 0, uprightScore), ("INVERTED", 180, invertedScore)] : [("ROTATE_270", 270, clockwiseScore), ("ROTATE_90", 90, counterclockwiseScore)]
        let ranked = relevantScores.sorted { $0.2 > $1.2 }
        let margin = ranked[0].2 - ranked[1].2
        let decision: String
        let correctionRotation: Int?
        if ranked[0].2 < 3 || margin < 2 {
            decision = "UNCERTAIN"
            correctionRotation = nil
        } else {
            decision = ranked[0].0
            correctionRotation = ranked[0].1
        }
        let result = Result(file: file, uprightScore: uprightScore, invertedScore: invertedScore, clockwiseScore: clockwiseScore, counterclockwiseScore: counterclockwiseScore, decision: decision, correctionRotation: correctionRotation, exifOrientation: exifOrientation, landmarks: landmarks)
        print(String(data: try! encoder.encode(result), encoding: .utf8)!)
    }
}
