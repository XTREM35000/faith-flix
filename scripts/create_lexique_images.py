#!/usr/bin/env python3
"""Create placeholder PNG images for lexique terms"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Colors by category
COLORS = {
    'interface': (59, 130, 246),      # Blue
    'navigation': (16, 185, 129),      # Green/Emerald
    'content': (245, 158, 11),         # Amber
    'actions': (244, 63, 94),          # Rose
    'admin': (147, 51, 234),           # Purple
}

base_dir = Path('c:/axe/faith-flix/public/images/lexique')

# Get all existing PNG files
png_files = list(base_dir.rglob('*.png'))

for png_path in png_files:
    category = png_path.parent.name
    filename = png_path.stem
    
    # Get color for this category
    color = COLORS.get(category, (128, 128, 128))
    
    # Create new image 200x150
    img = Image.new('RGB', (200, 150), color)
    draw = ImageDraw.Draw(img)
    
    # Add white text
    text = f"{category}\n{filename}"
    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", 12)
    except:
        # Fallback to default
        font = ImageFont.load_default()
    
    # Draw text in white, centered
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (200 - text_width) // 2
    y = (150 - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    # Save
    img.save(png_path)
    print(f"✓ Created: {png_path.name} (200x150)")

print("\n✅ All placeholder images created!")
