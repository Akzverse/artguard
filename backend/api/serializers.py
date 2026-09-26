from rest_framework import serializers
from core.models import User, Artwork, AnalysisResult, ReferenceArtwork

# WHY serializers?
# Convert Django models ↔ JSON
# Frontend sends/receives JSON, not Python objects

class UserSerializer(serializers.ModelSerializer):
    """Convert User model to/from JSON"""
    
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'bio', 'password', 'is_staff', 'is_superuser', 'created_at']
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'created_at']

    def create(self, validated_data):
        # Hash password before saving
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ArtworkSerializer(serializers.ModelSerializer):
    """Convert Artwork model to/from JSON"""
    
    uploaded_by = UserSerializer(read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Artwork
        fields = ['id', 'uploaded_by', 'title', 'claimed_artist', 'period', 'description', 'original_image', 'status', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'uploaded_by', 'status', 'uploaded_at', 'updated_at']


class AnalysisResultSerializer(serializers.ModelSerializer):
    """Convert AnalysisResult model to/from JSON"""

    class Meta:
        model = AnalysisResult
        fields = [
            'id', 'artwork', 'confidence_score', 'is_likely_authentic',
            'risk_factors', 'style_match_score', 'top_matches', 'heatmap_data',
            'feature_vector', 'model_version', 'analysis_timestamp'
        ]
        read_only_fields = [
            'id', 'confidence_score', 'is_likely_authentic',
            'risk_factors', 'style_match_score', 'top_matches', 'heatmap_data',
            'feature_vector', 'model_version', 'analysis_timestamp'
        ]


class ReferenceArtworkSerializer(serializers.ModelSerializer):
    """Convert ReferenceArtwork model to/from JSON"""

    class Meta:
        model = ReferenceArtwork
        fields = ['id', 'artist_name', 'period', 'style', 'source', 'feature_vector']
        extra_kwargs = {
            'feature_vector': {'required': False}
        }