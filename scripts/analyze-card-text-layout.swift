#!/usr/bin/env swift

import Foundation
import Vision
import ImageIO
import CoreGraphics

struct LayoutResult: Codable {
    let file: String
    let topWeight: Double
    let bottomWeight: Double
    let centerWeight: Double
    let layoutScore: Double
    let orientation: String
    let topText: [String]
    let bottomText: [String]
}

func sourceOrientation(_ source: CGImageSource) -> CGImagePropertyOrientation {
    guard let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
          let value = properties[kCGImagePropertyOrientation] as? NSNumber,
          let orientation = CGImagePropertyOrientation(rawValue: value.uint32Value) else { return .up }
    return orientation
}

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: analyze-card-text-layout.swift IMAGE...\n", stderr)
    exit(2)
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for path in CommandLine.arguments.dropFirst() {
    autoreleasepool {
        do {
            let url = URL(fileURLWithPath: path) as CFURL
            guard let source = CGImageSourceCreateWithURL(url, nil),
                  let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
                throw NSError(domain: "LayoutDetector", code: 1)
            }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.minimumTextHeight = 0.006
            let supported = try request.supportedRecognitionLanguages()
            request.recognitionLanguages = ["en-US", "ja-JP"].filter { supported.contains($0) }
            try VNImageRequestHandler(cgImage: image, orientation: sourceOrientation(source), options: [:]).perform([request])

            var topWeight = 0.0
            var bottomWeight = 0.0
            var centerWeight = 0.0
            var topText: [String] = []
            var bottomText: [String] = []
            for observation in request.results ?? [] {
                guard let candidate = observation.topCandidates(1).first else { continue }
                let box = observation.boundingBox
                let centerY = box.midY
                let weight = Double(box.height * box.width) * Double(candidate.confidence) * 1000.0
                if centerY >= 0.72 {
                    topWeight += weight
                    topText.append(candidate.string)
                } else if centerY <= 0.28 {
                    bottomWeight += weight
                    bottomText.append(candidate.string)
                } else {
                    centerWeight += weight
                }
            }
            let score = topWeight - bottomWeight
            let result = LayoutResult(
                file: URL(fileURLWithPath: path).lastPathComponent,
                topWeight: topWeight,
                bottomWeight: bottomWeight,
                centerWeight: centerWeight,
                layoutScore: score,
                orientation: score >= 0 ? "up" : "down",
                topText: topText,
                bottomText: bottomText
            )
            print(String(data: try encoder.encode(result), encoding: .utf8)!)
        } catch {
            fputs("\(path): \(error)\n", stderr)
        }
    }
}
