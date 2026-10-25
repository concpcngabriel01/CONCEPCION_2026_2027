from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pokemons', '0001_initial'),
        ('users', '0003_move_pokemon_model_to_users'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='Pokemon'),
            ],
        ),
    ]
