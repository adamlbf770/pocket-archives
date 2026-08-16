#!/usr/bin/env swift

import CoreImage
import CoreImage.CIFilterBuiltins
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

struct CardCrop {
    let observation: VNRectangleObservation
    let centerX: CGFloat
    let centerY: CGFloat
}

enum SplitError: Error, CustomStringConvertible {
    case usage
    case unreadableImage(String)
    case rectangleCount(String, Int)
    case renderFailed(String)

    var description: String {
        switch self {
        case .usage:
            return "Usage: split-card-sheet.swift SIDE_A SIDE_B OUTPUT_DIR START_NUMBER [SIDE_A_ROTATION] [SIDE_B_ROTATION]"
        case let .unreadableImage(path):
            return "Could not read image: \(path)"
        case let .rectangleCount(path, count):
            return "Expected four cards in \(path), but detected \(count)."
        case let .renderFailed(path):
            return "Could not render crop: \(path)"
        }
    }
}

let context = CIContext(options: [.useSoftwareRenderer: false])

func loadImage(_ path: String) throws -> CIImage {
    guard let image = CIImage(contentsOf: URL(fileURLWithPath: path), options: [.applyOrientationProperty: true]) else {
        throw SplitError.unreadableImage(path)
    }
    return image
}

func detectCards(in image: CIImage, path: String) throws -> [CardCrop] {
    let request = VNDetectRectanglesRequest()
    request.maximumObservations = 12
    request.minimumConfidence = 0.40
    request.minimumAspectRatio = 0.58
    request.maximumAspectRatio = 0.86
    request.minimumSize = 0.19
    request.quadratureTolerance = 30

    let handler = VNImageRequestHandler(ciImage: image, orientation: .up)
    try handler.perform([request])

    let observations = (request.results ?? [])
        .filter { $0.boundingBox.width > 0.20 && $0.boundingBox.height > 0.28 }
        .sorted { $0.confidence > $1.confidence }

    guard observations.count >= 4 else {
        throw SplitError.rectangleCount(path, observations.count)
    }

    let selected = Array(observations.prefix(4)).map {
        CardCrop(
            observation: $0,
            centerX: $0.boundingBox.midX,
            centerY: $0.boundingBox.midY
        )
    }

    let top = selected.sorted { $0.centerY > $1.centerY }.prefix(2).sorted { $0.centerX < $1.centerX }
    let bottom = selected.sorted { $0.centerY > $1.centerY }.suffix(2).sorted { $0.centerX < $1.centerX }
    return Array(top) + Array(bottom)
}

func correctedCard(from image: CIImage, observation: VNRectangleObservation, rotate180: Bool) -> CIImage {
    let extent = image.extent
    func point(_ normalized: CGPoint) -> CGPoint {
        CGPoint(
            x: extent.minX + normalized.x * extent.width,
            y: extent.minY + normalized.y * extent.height
        )
    }

    let filter = CIFilter.perspectiveCorrection()
    filter.inputImage = image
    filter.topLeft = point(observation.topLeft)
    filter.topRight = point(observation.topRight)
    filter.bottomLeft = point(observation.bottomLeft)
    filter.bottomRight = point(observation.bottomRight)

    var output = filter.outputImage ?? image
    if rotate180 {
        output = output.transformed(by: CGAffineTransform(rotationAngle: .pi))
    }
    output = output.transformed(by: CGAffineTransform(
        translationX: -output.extent.minX,
        y: -output.extent.minY
    ))

    let maxWidth: CGFloat = 1500
    if output.extent.width > maxWidth {
        let scale = maxWidth / output.extent.width
        let lanczos = CIFilter.lanczosScaleTransform()
        lanczos.inputImage = output
        lanczos.scale = Float(scale)
        lanczos.aspectRatio = 1
        output = lanczos.outputImage ?? output
    }
    return output
}

func writeJPEG(_ image: CIImage, to path: String) throws {
    guard let cgImage = context.createCGImage(image, from: image.extent),
          let destination = CGImageDestinationCreateWithURL(
            URL(fileURLWithPath: path) as CFURL,
            UTType.jpeg.identifier as CFString,
            1,
            nil
          ) else {
        throw SplitError.renderFailed(path)
    }

    let options: CFDictionary = [
        kCGImageDestinationLossyCompressionQuality: 0.94,
        kCGImagePropertyOrientation: 1,
    ] as CFDictionary
    CGImageDestinationAddImage(destination, cgImage, options)
    guard CGImageDestinationFinalize(destination) else {
        throw SplitError.renderFailed(path)
    }
}

do {
    guard (5...7).contains(CommandLine.arguments.count),
          let startNumber = Int(CommandLine.arguments[4]) else {
        throw SplitError.usage
    }

    func rotationFlag(at index: Int, defaultValue: Bool) throws -> Bool {
        guard CommandLine.arguments.count > index else { return defaultValue }
        switch CommandLine.arguments[index] {
        case "0": return false
        case "180": return true
        default: throw SplitError.usage
        }
    }

    let sideAPath = CommandLine.arguments[1]
    let sideBPath = CommandLine.arguments[2]
    let outputDirectory = CommandLine.arguments[3]
    let rotateSideA = try rotationFlag(at: 5, defaultValue: true)
    let rotateSideB = try rotationFlag(at: 6, defaultValue: true)
    try FileManager.default.createDirectory(
        atPath: outputDirectory,
        withIntermediateDirectories: true
    )

    let sideA = try loadImage(sideAPath)
    let sideB = try loadImage(sideBPath)
    let sideACards = try detectCards(in: sideA, path: sideAPath)
    let sideBCards = try detectCards(in: sideB, path: sideBPath)

    for index in 0..<4 {
        let number = String(format: "%04d", startNumber + index)
        let frontPath = "\(outputDirectory)/pa-\(number)-front.jpg"
        let backPath = "\(outputDirectory)/pa-\(number)-back.jpg"
        try writeJPEG(correctedCard(from: sideA, observation: sideACards[index].observation, rotate180: rotateSideA), to: frontPath)
        try writeJPEG(correctedCard(from: sideB, observation: sideBCards[index].observation, rotate180: rotateSideB), to: backPath)
        print("pa-\(number): \(frontPath), \(backPath)")
    }
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
