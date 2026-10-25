from io import BytesIO
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Pokemon


class PokemonApiTests(APITestCase):
    def setUp(self):
        super().setUp()
        self.media_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        self.enterContext(override_settings(MEDIA_ROOT=self.media_dir.name))

        user = get_user_model().objects.create_user(
            username='trainer',
            password='Strong-passphrase-93!',
        )
        token_response = self.client.post(
            '/api/token/',
            {'username': user.username, 'password': 'Strong-passphrase-93!'},
            format='json',
        )
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=' '.join(('Bearer', token_response.data['access']))
        )

    def pokemon_payload(self, name='Sprout'):
        return {
            'name': name,
            'description': 'A sample Pokémon',
            'level': 1,
            'type': 'nature',
            'health': 100,
            'attack': 10,
            'defense': 5,
            'speed': 15,
        }

    def test_all_pokemon_routes_require_authentication(self):
        self.client.credentials()
        responses = [
            self.client.get('/api/pokemons/'),
            self.client.post(
                '/api/pokemons/',
                self.pokemon_payload(),
                format='json',
            ),
            self.client.get('/api/pokemons/9999/'),
            self.client.patch(
                '/api/pokemons/9999/',
                {'description': 'Updated'},
                format='json',
            ),
            self.client.delete('/api/pokemons/9999/'),
        ]
        self.assertTrue(
            all(response.status_code == status.HTTP_401_UNAUTHORIZED for response in responses)
        )

    def test_protected_pokemon_crud_and_validation(self):
        token = self.client.post(
            '/api/token/',
            {'username': 'trainer', 'password': 'Strong-passphrase-93!'},
            format='json',
        ).data['access']
        self.client.credentials(
            HTTP_AUTHORIZATION=' '.join(('Bearer', token))
        )

        created = self.client.post(
            '/api/pokemons/',
            self.pokemon_payload(),
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        pokemon_id = created.data['id']

        self.assertEqual(
            self.client.get('/api/pokemons/').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.get(f'/api/pokemons/{pokemon_id}/').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.get('/api/pokemons/9999/').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/pokemons/{pokemon_id}/',
                {'description': 'Updated'},
                format='json',
            ).status_code,
            status.HTTP_200_OK,
        )

        minimums = {
            'level': 1,
            'health': 100,
            'attack': 10,
            'defense': 5,
            'speed': 15,
        }
        for field, minimum in minimums.items():
            invalid = self.pokemon_payload(f'Invalid-{field}')
            invalid[field] = minimum - 1
            self.assertEqual(
                self.client.post('/api/pokemons/', invalid, format='json').status_code,
                status.HTTP_400_BAD_REQUEST,
            )

        invalid_type = self.pokemon_payload('Ghost')
        invalid_type['type'] = 'ghost'
        self.assertEqual(
            self.client.post('/api/pokemons/', invalid_type, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(
                '/api/pokemons/',
                self.pokemon_payload(),
                format='json',
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.delete(f'/api/pokemons/{pokemon_id}/').status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_pokemon_accepts_uploaded_images(self):
        image_data = BytesIO()
        Image.new('RGB', (1, 1), color='red').save(image_data, format='PNG')
        image = image_data.getvalue()
        payload = self.pokemon_payload('Picturemon')
        payload['avatar'] = SimpleUploadedFile(
            'avatar.png',
            image,
            content_type='image/png',
        )
        payload['background'] = SimpleUploadedFile(
            'background.png',
            image,
            content_type='image/png',
        )

        response = self.client.post('/api/pokemons/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('pokemons/avatars/', response.data['avatar'])
        self.assertIn('pokemons/background/', response.data['background'])
        pokemon = Pokemon.objects.get(name='Picturemon')
        self.assertTrue(pokemon.avatar.path)
        self.assertTrue(pokemon.background.path)
