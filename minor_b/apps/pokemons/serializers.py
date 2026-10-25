from rest_framework import serializers

from .models import Pokemon


class PokemonSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    level = serializers.IntegerField(min_value=1)
    type = serializers.ChoiceField(choices=Pokemon.PokemonType.choices)
    health = serializers.IntegerField(min_value=100)
    attack = serializers.IntegerField(min_value=10)
    defense = serializers.IntegerField(min_value=5)
    speed = serializers.IntegerField(min_value=15)

    class Meta:
        model = Pokemon
        fields = (
            'id',
            'name',
            'description',
            'avatar',
            'background',
            'level',
            'type',
            'health',
            'attack',
            'defense',
            'speed',
        )