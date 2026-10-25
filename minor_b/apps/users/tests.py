from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class UserApiTests(APITestCase):
    def register_payload(self, username='alice'):
        password = 'Strong-passphrase-93!'
        return {
            'username': username,
            'email': f'{username}@example.com',
            'password': password,
            'confirm_password': password,
            'level': 1,
        }

    def get_access_token(self, user):
        response = self.client.post(
            '/api/token/',
            {'username': user.username, 'password': 'Strong-passphrase-93!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data['access']

    def test_registration_validates_and_hashes_password(self):
        payload = self.register_payload()
        response = self.client.post('/api/users/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response.data)
        self.assertNotIn('confirm_password', response.data)

        user = User.objects.get(username='alice')
        self.assertTrue(user.check_password(payload['password']))

        login = self.client.post(
            '/api/token/',
            {'username': user.username, 'password': payload['password']},
            format='json',
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)
        refreshed = self.client.post(
            '/api/token/refresh/',
            {'refresh': login.data['refresh']},
            format='json',
        )
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn('access', refreshed.data)

        mismatch = self.register_payload('bob')
        mismatch['confirm_password'] = 'Different-passphrase-49!'
        self.assertEqual(
            self.client.post('/api/users/', mismatch, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        weak = self.register_payload('charlie')
        weak['password'] = '12345'
        weak['confirm_password'] = '12345'
        self.assertEqual(
            self.client.post('/api/users/', weak, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        invalid_level = self.register_payload('dana')
        invalid_level['level'] = 0
        self.assertEqual(
            self.client.post('/api/users/', invalid_level, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_public_reads_and_owner_only_updates_and_deletes(self):
        user_a = User.objects.create_user(
            username='alice',
            password='Strong-passphrase-93!',
        )
        user_b = User.objects.create_user(
            username='bob',
            password='Strong-passphrase-93!',
        )

        public_list = self.client.get(
            '/api/users/',
            HTTP_ORIGIN='http://react.example',
        )
        self.assertEqual(public_list.status_code, status.HTTP_200_OK)
        self.assertEqual(
            public_list['access-control-allow-origin'],
            '*',
        )
        self.assertEqual(
            self.client.get(f'/api/users/{user_a.pk}/').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.get('/api/users/9999/').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/users/{user_a.pk}/',
                {'first_name': 'Unauthenticated'},
                format='json',
            ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        access_token = self.get_access_token(user_a)
        self.client.credentials(
            HTTP_AUTHORIZATION=' '.join(('Bearer', access_token))
        )
        self.assertEqual(
            self.client.patch(
                f'/api/users/{user_b.pk}/',
                {'first_name': 'Blocked'},
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f'/api/users/{user_b.pk}/').status_code,
            status.HTTP_403_FORBIDDEN,
        )

        updated = self.client.patch(
            f'/api/users/{user_a.pk}/',
            {
                'password': 'Another-strong-passphrase-28!',
                'confirm_password': 'Another-strong-passphrase-28!',
            },
            format='json',
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertNotIn('password', updated.data)
        user_a.refresh_from_db()
        self.assertTrue(user_a.check_password('Another-strong-passphrase-28!'))

        self.assertEqual(
            self.client.delete(f'/api/users/{user_a.pk}/').status_code,
            status.HTTP_204_NO_CONTENT,
        )
