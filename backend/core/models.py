from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom User Model
class User(AbstractUser):
    """
    WHY custom user?
    - Django's default User only has username/email/password
    - We add 'role' (analyst/collector/admin) for permissions
    - We add 'bio' for user description
    """
    ROLE_CHOICES = [
        ('analyst', 'Art Analyst'),
        ('collector', 'Collector'),
        ('admin', 'Administrator'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='collector')
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.role})"


# Artwork submitted by users
class Artwork(models.Model):
    """
    WHY separate table?
    - One user can upload many artworks
    - Each artwork has metadata (title, artist, period)
    - Status tracks if it's waiting/processing/done
    """
    STATUS_CHOICES = [
        ('pending', 'Waiting for analysis'),
        ('processing', 'AI is analyzing...'),
        ('completed', 'Analysis done'),
        ('failed', 'Analysis failed'),
    ]
    
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='artworks')
    title = models.CharField(max_length=255)
    claimed_artist = models.CharField(max_length=255)
    period = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    original_image = models.ImageField(upload_to='artworks/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'artworks'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} by {self.claimed_artist}"


# Analysis results
class AnalysisResult(models.Model):
    """
    WHY separate?
    - One artwork = one analysis
    - Stores confidence score, risk factors, heatmap
    - OneToOneField = unique relationship
    """
    artwork = models.OneToOneField(Artwork, on_delete=models.CASCADE, related_name='analysis')
    confidence_score = models.FloatField()
    is_likely_authentic = models.BooleanField()
    risk_factors = models.JSONField(default=dict)
    style_match_score = models.FloatField()
    top_matches = models.JSONField(default=list)  # Top reference artwork comparisons
    heatmap_data = models.JSONField(default=list)  # Store heatmap as JSON
    feature_vector = models.JSONField()
    analysis_timestamp = models.DateTimeField(auto_now_add=True)
    model_version = models.CharField(max_length=50, default='v1.0')

    class Meta:
        db_table = 'analysis_results'
        ordering = ['-analysis_timestamp']

    def __str__(self):
        return f"Analysis: {self.artwork.title} ({self.confidence_score*100:.1f}%)"


# Reference artworks for comparison
class ReferenceArtwork(models.Model):
    """
    WHY this?
    - Store authentic artworks by known artists
    - Compare new submissions against these
    - Pre-compute features so comparisons are fast
    """
    artist_name = models.CharField(max_length=255, db_index=True)
    period = models.CharField(max_length=100)
    style = models.CharField(max_length=100)
    image = models.ImageField(upload_to='reference_artworks/')
    feature_vector = models.JSONField()
    source = models.CharField(max_length=100)

    class Meta:
        db_table = 'reference_artworks'
        indexes = [
            models.Index(fields=['artist_name', 'period']),
        ]

    def __str__(self):
        return f"{self.artist_name} - {self.period}"