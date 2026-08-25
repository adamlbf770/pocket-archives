#!/usr/bin/env swift

import Foundation
import Vision
import ImageIO
import CoreGraphics

struct OrientationResult: Codable {
    let file: String
    let upScore: Double
    let downScore: Double
    let orientation: String
}

func sourceOrientation(_ path: String) -> CGImagePropertyOrientation {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let source = CGImageSourceCreateWithURL(url, nil),
          let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          let value = properties[kCGImagePropertyOrientation] as? NSNumber,
          let orientation = CGImagePropertyOrientation(rawValue: value.uint32Value) else {
        return .up
    }
    return orientation
}

func opposite(_ orientation: CGImagePropertyOrientation) -> CGImagePropertyOrientation {
    switch orientation {
    case .up: return .down
    case .upMirrored: return .downMirrored
    case .down: return .up
    case .downMirrored: return .upMirrored
    case .left: return .right
    case .leftMirrored: return .rightMirrored
    case .right: return .left
    case .rightMirrored: return .leftMirrored
    @unknown default: return .down
    }
}

func score(_ path: String, orientation: CGImagePropertyOrientation) throws -> Double {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.008
    let supported = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["en-US", "ja-JP"].filter { supported.contains($0) }
    let url = URL(fileURLWithPath: path) as CFURL
    guard let source = CGImageSourceCreateWithURL(url, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "OrientationDetector", code: 1,
                      userInfo: [NSLocalizedDescriptionKey: "Unable to decode image"])
    }
    let handler = VNImageRequestHandler(cgImage: image, orientation: orientation, options: [:])
    try handler.perform([request])
    return (request.results ?? []).reduce(0.0) { total, observation in
        guard let candidate = observation.topCandidates(1).first else { return total }
        let lengthWeight = Double(min(max(candidate.string.count, 1), 30))
        return total + Double(candidate.confidence) * lengthWeight
    }
}

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: detect-card-orientation.swift IMAGE...\n", stderr)
    exit(2)
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for path in CommandLine.arguments.dropFirst() {
    autoreleasepool {
        do {
            let base = sourceOrientation(path)
            let up = try score(path, orientation: base)
            let down = try score(path, orientation: opposite(base))
            let result = OrientationResult(
                file: URL(fileURLWithPath: path).lastPathComponent,
                upScore: up,
                downScore: down,
                orientation: down > up ? "down" : "up"
            )
            print(String(data: try encoder.encode(result), encoding: .utf8)!)
        } catch {
            fputs("\(path): \(error)\n", stderr)
        }
    }
}
