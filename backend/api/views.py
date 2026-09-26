from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import authenticate
from django.http import HttpResponse
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import User, Artwork, AnalysisResult, ReferenceArtwork
from api.serializers import (
    UserSerializer,
    ArtworkSerializer,
    AnalysisResultSerializer,
    ReferenceArtworkSerializer,
)


def is_admin(user):
    """Returns True if the user is an admin (staff or role=admin)."""
    return user.is_authenticated and (user.is_staff or getattr(user, 'role', '') == 'admin')


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminStatsView(APIView):
    """Admin-only endpoint: returns system-wide statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        total_users = User.objects.count()
        total_artworks = Artwork.objects.count()
        total_references = ReferenceArtwork.objects.count()
        completed = Artwork.objects.filter(status='completed').count()
        pending = Artwork.objects.filter(status='pending').count()
        processing = Artwork.objects.filter(status='processing').count()
        failed = Artwork.objects.filter(status='failed').count()
        authentic_count = AnalysisResult.objects.filter(is_likely_authentic=True).count()
        forgery_count = AnalysisResult.objects.filter(is_likely_authentic=False).count()

        return Response({
            'total_users': total_users,
            'total_artworks': total_artworks,
            'total_references': total_references,
            'completed': completed,
            'pending': pending,
            'processing': processing,
            'failed': failed,
            'authentic_count': authentic_count,
            'forgery_count': forgery_count,
        })


class AdminUserListView(generics.ListAPIView):
    """Admin-only endpoint: returns list of all users."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')

    def list(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin-only endpoint: manage / update / delete a user (DFD 6.0)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        user_to_delete = self.get_object()
        if user_to_delete == request.user:
            return Response({'error': 'Cannot delete your own active admin account'}, status=status.HTTP_400_BAD_REQUEST)
        user_to_delete.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().patch(request, *args, **kwargs)


class AdminReferenceArtworkListView(generics.ListCreateAPIView):
    """Admin endpoint to view and add reference artworks (DFD 5.0)."""
    serializer_class = ReferenceArtworkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReferenceArtwork.objects.all().order_by('artist_name')

    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            raise PermissionDenied('Admin access required')

        feature_vector = self.request.data.get('feature_vector')
        if not feature_vector:
            import numpy as np
            np.random.seed(int(self.request.data.get('seed', 42)))
            vec = np.random.randn(2048).astype(float)
            norm = np.linalg.norm(vec)
            feature_vector = (vec / norm).tolist() if norm > 0 else vec.tolist()
        serializer.save(feature_vector=feature_vector)


class AdminReferenceArtworkDetailView(generics.DestroyAPIView):
    """Admin endpoint to delete a reference artwork (DFD 5.0)."""
    queryset = ReferenceArtwork.objects.all()
    serializer_class = ReferenceArtworkSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ArtworkViewSet(viewsets.ModelViewSet):
    serializer_class = ArtworkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Artwork.objects.select_related('uploaded_by').all()
        return Artwork.objects.filter(uploaded_by=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        artwork = self.get_object()
        # Allow delete if admin, or if the owner of the artwork
        if not is_admin(request.user) and artwork.uploaded_by != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        artwork.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        artwork = self.get_object()
        if artwork.uploaded_by != request.user and not is_admin(request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        artwork.status = 'processing'
        artwork.save()
        return Response({'status': 'Analysis queued', 'artwork_id': artwork.id})

    @action(detail=True, methods=['get', 'post'])
    def results(self, request, pk=None):
        """Return the analysis results for an artwork using ResNet50 + Grad-CAM."""
        artwork = self.get_object()
        try:
            analysis = artwork.analysis
        except AnalysisResult.DoesNotExist:
            if artwork.status not in ('pending', 'processing'):
                return Response(
                    {'error': 'Analysis not yet complete'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            try:
                artwork.status = 'processing'
                artwork.save()

                # Primary engine: Deep Learning with ResNet50 + Grad-CAM
                try:
                    from deep_learning_service import analyze_artwork_with_dl
                    results = analyze_artwork_with_dl(
                        image_path=artwork.original_image.path,
                        claimed_artist=artwork.claimed_artist,
                    )
                except Exception as dl_error:
                    print(f"Deep learning error ({dl_error}), falling back to statistical analysis.")
                    from analysis_service import analyze_artwork
                    results = analyze_artwork(
                        artwork_path=artwork.original_image.path,
                        claimed_artist=artwork.claimed_artist,
                        reference_features_list=None,
                    )

                analysis = AnalysisResult.objects.create(
                    artwork=artwork,
                    confidence_score=results['confidence_score'],
                    is_likely_authentic=results['is_likely_authentic'],
                    risk_factors=results['risk_factors'],
                    style_match_score=results['style_match_score'],
                    top_matches=results.get('top_matches', []),
                    heatmap_data=results['heatmap_data'],
                    feature_vector=results['feature_vector'],
                    model_version=results.get('model_version', 'ResNet50-GradCAM-v1.0'),
                )
                artwork.status = 'completed'
                artwork.save()

                # Dispatch completion notification (Notification Service)
                try:
                    from notification_service import send_analysis_complete_notification
                    send_analysis_complete_notification(artwork, analysis)
                except Exception as notif_err:
                    print(f"Notification error: {notif_err}")

            except Exception as e:
                artwork.status = 'failed'
                artwork.save()
                return Response(
                    {'error': f'Analysis failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response({
            'artwork': ArtworkSerializer(artwork).data,
            'analysis': AnalysisResultSerializer(analysis).data,
        })

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Generate and serve official PDF authentication report for an artwork (DFD 4.0 / Collaboration msg 23)."""
        artwork = self.get_object()
        try:
            analysis = artwork.analysis
        except AnalysisResult.DoesNotExist:
            return Response({'error': 'Analysis results not found. Please run analysis first.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from report_service import generate_artwork_pdf_report
            pdf_bytes = generate_artwork_pdf_report(artwork, analysis)

            clean_title = "".join(c for c in artwork.title if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
            filename = f"ArtGuard_Report_{clean_title}_{artwork.id}.pdf"

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': f'Failed to generate PDF report: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResultsReportDirectView(APIView):
    """Direct report endpoint alias matching Collaboration Diagram (GET /api/results/{id}/report)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        try:
            artwork = Artwork.objects.get(id=pk)
            # Check permission
            if not is_admin(request.user) and artwork.uploaded_by != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            analysis = artwork.analysis
        except (Artwork.DoesNotExist, AnalysisResult.DoesNotExist):
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        from report_service import generate_artwork_pdf_report
        pdf_bytes = generate_artwork_pdf_report(artwork, analysis)
        clean_title = "".join(c for c in artwork.title if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
        filename = f"ArtGuard_Report_{clean_title}_{artwork.id}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response