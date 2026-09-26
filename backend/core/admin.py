from django.contrib import admin
from core.models import User, Artwork, AnalysisResult, ReferenceArtwork

# WHY admin.py?
# Registers models in Django admin panel
# You can view/edit all data at http://localhost:8000/admin/

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'created_at']
    list_filter = ['role']
    search_fields = ['username', 'email']

@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ['title', 'claimed_artist', 'uploaded_by', 'status', 'uploaded_at']
    list_filter = ['status', 'period']
    search_fields = ['title', 'claimed_artist']

@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['artwork', 'confidence_score', 'is_likely_authentic', 'analysis_timestamp']
    list_filter = ['is_likely_authentic']
    search_fields = ['artwork__title']

@admin.register(ReferenceArtwork)
class ReferenceArtworkAdmin(admin.ModelAdmin):
    list_display = ['artist_name', 'period', 'style', 'source']
    list_filter = ['artist_name', 'period']
    search_fields = ['artist_name']