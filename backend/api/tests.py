from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import User, Artwork, AnalysisResult


class ArtGuardApiTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testanalyst',
            email='analyst@artguard.ai',
            password='testpassword123',
            role='analyst'
        )
        # Login to obtain JWT
        login_res = self.client.post(reverse('login'), {
            'username': 'testanalyst',
            'password': 'testpassword123'
        })
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_user_registration(self):
        response = self.client.post(reverse('register'), {
            'username': 'newcollector',
            'email': 'collector@artguard.ai',
            'password': 'strongpassword123',
            'role': 'collector',
            'bio': 'Art collector'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'newcollector')

    def test_artwork_upload_and_serialization(self):
        import io
        from PIL import Image
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color=(50, 100, 200)).save(buf, format='PNG')
        png_data = buf.getvalue()
        image = SimpleUploadedFile("starry_night.png", png_data, content_type="image/png")

        response = self.client.post(
            reverse('artwork-list'),
            {
                'title': 'The Starry Night',
                'claimed_artist': 'Vincent van Gogh',
                'period': 'Post-Impressionism (1889)',
                'description': 'Masterpiece depicting view from Saint-Rémy',
                'original_image': image,
            },
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['title'], 'The Starry Night')
        self.assertEqual(response.data['uploaded_by']['username'], 'testanalyst')

    def test_analysis_result_serialization(self):
        import io
        from PIL import Image
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color=(100, 150, 50)).save(buf, format='PNG')
        png_data = buf.getvalue()
        image = SimpleUploadedFile("art.png", png_data, content_type="image/png")
        artwork = Artwork.objects.create(
            uploaded_by=self.user,
            title='Mona Lisa Replica',
            claimed_artist='Leonardo da Vinci',
            period='Renaissance',
            description='Test',
            original_image=image,
            status='completed'
        )

        analysis = AnalysisResult.objects.create(
            artwork=artwork,
            confidence_score=0.88,
            is_likely_authentic=True,
            risk_factors={'low_brushstroke_variation': 'Minor variation'},
            style_match_score=0.91,
            heatmap_data=[[0.1, 0.2], [0.3, 0.4]],
            feature_vector=[0.1, 0.2, 0.3],
            model_version='ResNet50-GradCAM-v1.0'
        )

        url = reverse('artwork-results', kwargs={'pk': artwork.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('analysis', response.data)
        self.assertIn('heatmap_data', response.data['analysis'])
        self.assertEqual(response.data['analysis']['confidence_score'], 0.88)

