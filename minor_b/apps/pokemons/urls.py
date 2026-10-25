from django.urls import path

from .views import PokemonListCreateAPIView, PokemonRetrieveUpdateDestroyAPIView


urlpatterns = [
    path('pokemons/', PokemonListCreateAPIView.as_view(), name='pokemon-list-create'),
    path(
        'pokemons/<int:pk>/',
        PokemonRetrieveUpdateDestroyAPIView.as_view(),
        name='pokemon-detail',
    ),
]
