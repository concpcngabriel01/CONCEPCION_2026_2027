import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pokemons', '0001_initial'),
        ('users', '0002_alter_user_options'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Pokemon',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('name', models.CharField(max_length=50, unique=True)),
                        ('description', models.TextField(blank=True, null=True)),
                        ('avatar', models.ImageField(default='pokemons/avatars/profile default.jpg', upload_to='pokemons/avatars/')),
                        ('background', models.ImageField(default='pokemons/background/bg default.png', upload_to='pokemons/background/')),
                        ('level', models.IntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                        ('type', models.CharField(choices=[('water', 'Water'), ('fire', 'Fire'), ('wind', 'Wind'), ('light', 'Light'), ('darkness', 'Darkness'), ('lightning', 'Lightning'), ('rock', 'Rock'), ('nature', 'Nature')], max_length=10)),
                        ('health', models.IntegerField(validators=[django.core.validators.MinValueValidator(100)])),
                        ('attack', models.IntegerField(validators=[django.core.validators.MinValueValidator(10)])),
                        ('defense', models.IntegerField(validators=[django.core.validators.MinValueValidator(5)])),
                        ('speed', models.IntegerField(validators=[django.core.validators.MinValueValidator(15)])),
                    ],
                    options={
                        'db_table': 'pokemons_pokemon',
                    },
                ),
            ],
        ),
    ]
