from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models


class User(AbstractUser):
    avatar = models.ImageField(
        upload_to='users',
        default='users/default.jpg',
    )
    level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return self.username
