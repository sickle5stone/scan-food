#!/bin/bash
# This script generates app icons in different sizes from an SVG source

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Please install ImageMagick first."
    echo "On macOS: brew install imagemagick"
    echo "On Ubuntu/Debian: sudo apt-get install imagemagick"
    exit 1
fi

# Source SVG file
SVG_SOURCE="public/icons/icon-placeholder.svg"

# Check if source file exists
if [ ! -f "$SVG_SOURCE" ]; then
    echo "Error: Source SVG file not found: $SVG_SOURCE"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Generate PNG icons in different sizes
echo "Generating app icons..."

# PWA icons
convert -background none -size 192x192 "$SVG_SOURCE" public/icons/icon-192x192.png
convert -background none -size 512x512 "$SVG_SOURCE" public/icons/icon-512x512.png

# Apple touch icon
convert -background none -size 180x180 "$SVG_SOURCE" public/icons/apple-touch-icon.png

# Favicon
convert -background none -size 32x32 "$SVG_SOURCE" public/favicon.png

echo "All icons generated successfully!" 