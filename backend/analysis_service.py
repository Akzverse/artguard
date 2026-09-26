"""
ArtGuard Analysis Service

WHY this file?
- Analyzes artwork images without deep learning
- Lightweight, fast (uses PIL + basic statistics)
- Compares against reference artworks

HOW it works:
1. Extract features from submitted image (color histogram, brightness, texture)
2. Compare against reference artwork features
3. Calculate similarity score (0-1)
4. High similarity = likely authentic
5. Low similarity = likely forged
"""

import importlib
import json
from pathlib import Path


try:
    Image = importlib.import_module('PIL.Image')
except ImportError:
    Image = None


class ImageFeatureExtractor:
    """
    Extract statistical features from images without deep learning
    
    Features extracted:
    - Color histogram (how many red/green/blue pixels)
    - Brightness distribution
    - Texture patterns (edge detection)
    """
    
    @staticmethod
    def extract_features(image_path):
        """
        Extract 256 features from image
        
        WHY 256?
        - Histogram: 32 values per channel × 3 channels = 96 values
        - Brightness: 32 values = 32 values
        - Texture: 32 values = 32 values
        - Edge stats: 2 values (mean + std) = 2 values
        - Padding for consistency = 256 total
        """
        try:
            if Image is None:
                raise ImportError(
                    "Pillow is required for image analysis. Install it with 'pip install Pillow'."
                )

            # Open and resize image
            img = Image.open(image_path)
            img = img.convert('RGB')
            img = img.resize((224, 224))
            
            # Convert to pixel data
            pixels = list(img.getdata())
            
            # Extract color information
            features = []
            
            # 1. Color histogram (0-255 range for each channel)
            red_hist = [0] * 32
            green_hist = [0] * 32
            blue_hist = [0] * 32
            
            for pixel in pixels:
                r, g, b = pixel
                red_hist[r // 8] += 1
                green_hist[g // 8] += 1
                blue_hist[b // 8] += 1
            
            # Normalize
            total = len(pixels)
            features.extend([x / total for x in red_hist])
            features.extend([x / total for x in green_hist])
            features.extend([x / total for x in blue_hist])
            
            # 2. Brightness histogram
            brightness_hist = [0] * 32
            for pixel in pixels:
                brightness = (pixel[0] + pixel[1] + pixel[2]) // 3
                brightness_hist[brightness // 8] += 1
            
            features.extend([x / total for x in brightness_hist])
            
            # 3. Texture (variation in pixel values)
            # Simple: count transitions between similar pixels
            texture_score = 0
            img_array = list(img.getdata())
            for i in range(len(img_array) - 1):
                r1, g1, b1 = img_array[i]
                r2, g2, b2 = img_array[i + 1]
                diff = abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2)
                if diff > 30:  # Significant change
                    texture_score += 1
            
            features.append(texture_score / total)
            features.append(texture_score / (total * 2))
            
            # Pad to 256
            while len(features) < 256:
                features.append(0.0)
            features = features[:256]
            
            return features
        
        except Exception as e:
            print(f"Error extracting features: {e}")
            return [0.0] * 256


class SimilarityCalculator:
    """
    Calculate similarity between two feature vectors
    
    WHY cosine similarity?
    - Simple and fast
    - Ignores magnitude, only compares direction
    - Perfect for comparing features
    
    Interpretation:
    - 1.0 = identical
    - 0.8+ = very similar (authentic)
    - 0.5-0.8 = moderately similar (questionable)
    - <0.5 = very different (forged)
    """
    
    @staticmethod
    def cosine_similarity(vec1, vec2):
        """
        Calculate cosine similarity
        Formula: cos(θ) = (A · B) / (||A|| × ||B||)
        """
        # Dot product
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        
        # Magnitudes
        mag1 = sum(x ** 2 for x in vec1) ** 0.5
        mag2 = sum(x ** 2 for x in vec2) ** 0.5
        
        if mag1 == 0 or mag2 == 0:
            return 0.0
        
        similarity = dot_product / (mag1 * mag2)
        return max(0.0, min(1.0, similarity))  # Clamp to 0-1


def analyze_artwork(artwork_path, claimed_artist, reference_features_list=None):
    """
    Main analysis function
    
    WHY this structure?
    1. Extract features (most important)
    2. Load references (for comparison)
    3. Calculate similarity (to known works)
    4. Generate confidence score (0-1)
    5. Identify risk factors (what's wrong)
    
    Returns: Dictionary with all analysis results
    """
    
    extractor = ImageFeatureExtractor()
    
    # Step 1: Extract features from submitted artwork
    print(f"Extracting features from {artwork_path}...")
    artwork_features = extractor.extract_features(artwork_path)
    
    # Step 2: Load or simulate reference features
    # In real system: query database for references by artist
    # For now: use provided references or empty
    if reference_features_list is None:
        reference_features_list = []
    
    # Step 3: Calculate similarity
    if reference_features_list:
        similarities = []
        for ref_features in reference_features_list:
            sim = SimilarityCalculator.cosine_similarity(artwork_features, ref_features)
            similarities.append(sim)
        
        style_match_score = sum(similarities) / len(similarities)
    else:
        # No references, use neutral score
        style_match_score = 0.5
    
    # Step 4: Generate confidence score
    # Confidence = 70% style match + 30% other factors
    confidence_score = style_match_score * 0.7 + 0.3 * 0.5
    confidence_score = max(0.0, min(1.0, confidence_score))  # Clamp to 0-1
    
    # Step 5: Determine if authentic
    is_authentic = confidence_score > 0.65
    
    # Step 6: Identify risk factors
    risk_factors = {}
    if style_match_score < 0.6:
        deviation = (1.0 - style_match_score) * 100
        risk_factors['style_deviation'] = f"{deviation:.1f}%"
    
    if confidence_score < 0.5:
        risk_factors['high_forgery_risk'] = 'Low confidence in authenticity'
    
    if not reference_features_list:
        risk_factors['no_reference_data'] = 'No authentic works found for comparison'
    
    # Step 7: Create heatmap visualization
    # Simple: reshape features into 16x16 grid
    heatmap = []
    for i in range(0, 256, 16):
        row = artwork_features[i:i+16]
        heatmap.append(row)
    
    # Return results
    results = {
        'confidence_score': confidence_score,
        'is_likely_authentic': is_authentic,
        'style_match_score': style_match_score,
        'risk_factors': risk_factors,
        'feature_vector': artwork_features,
        'heatmap_data': heatmap,
        'model_version': 'statistical_v1.0'
    }
    
    print(f"Analysis complete: {confidence_score*100:.1f}% authentic, {is_authentic}")
    return results