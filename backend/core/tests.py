from django.test import TestCase
from core.models import User, Artwork, ReferenceArtwork
from deep_learning_service import compute_cosine_similarity


class CoreModelTests(TestCase):

    def test_user_creation(self):
        user = User.objects.create_user(
            username='artcollector1',
            email='collector1@artguard.ai',
            password='secretpassword',
            role='collector',
            bio='Loves Impressionism'
        )
        self.assertEqual(user.role, 'collector')
        self.assertTrue(user.check_password('secretpassword'))

    def test_reference_artwork_similarity(self):
        ref = ReferenceArtwork.objects.create(
            artist_name='Vincent van Gogh',
            period='Post-Impressionism',
            style='Impasto',
            source='Van Gogh Museum',
            feature_vector=[1.0, 0.0, 0.0]
        )
        self.assertEqual(ref.artist_name, 'Vincent van Gogh')
        
        sim_identical = compute_cosine_similarity([1.0, 0.0, 0.0], ref.feature_vector)
        self.assertAlmostEqual(sim_identical, 1.0, places=4)
        
        sim_orthogonal = compute_cosine_similarity([0.0, 1.0, 0.0], ref.feature_vector)
        self.assertAlmostEqual(sim_orthogonal, 0.0, places=4)

