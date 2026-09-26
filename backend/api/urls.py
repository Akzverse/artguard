from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    RegisterView,
    LoginView,
    UserDetailView,
    ArtworkViewSet,
    AdminStatsView,
    AdminUserListView,
    AdminUserDetailView,
    AdminReferenceArtworkListView,
    AdminReferenceArtworkDetailView,
    ResultsReportDirectView,
)

router = DefaultRouter()
router.register(r'artworks', ArtworkViewSet, basename='artwork')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', UserDetailView.as_view(), name='user-detail'),

    # Admin Endpoints (DFD 1.0, 5.0, 6.0)
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/references/', AdminReferenceArtworkListView.as_view(), name='admin-references'),
    path('admin/references/<int:pk>/', AdminReferenceArtworkDetailView.as_view(), name='admin-reference-detail'),

    # Direct Report alias matching Collaboration Diagram (GET /api/results/{id}/report)
    path('results/<int:pk>/report/', ResultsReportDirectView.as_view(), name='results-report-direct'),

    # Artworks ViewSet (includes /api/artworks/{id}/report/, /api/artworks/{id}/results/, etc.)
    path('', include(router.urls)),
]