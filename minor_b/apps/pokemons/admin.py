from django.contrib import admin

from .models import Pokemon


@admin.register(Pokemon)
class PokemonAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'level', 'health', 'attack', 'defense', 'speed')
    list_filter = ('type',)
    search_fields = ('name', 'description')
