from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Pokemon
from .serializers import PokemonSerializer


class PokemonListCreateAPIView(APIView):
    def require_authentication(self, request):
        if not request.user.is_authenticated:
            raise NotAuthenticated()

    def get(self, request):
        self.require_authentication(request)
        pokemons = Pokemon.objects.all()
        serializer = PokemonSerializer(pokemons, many=True)
        return Response(serializer.data)

    def post(self, request):
        self.require_authentication(request)
        serializer = PokemonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PokemonRetrieveUpdateDestroyAPIView(APIView):
    def require_authentication(self, request):
        if not request.user.is_authenticated:
            raise NotAuthenticated()

    def get_object(self, pk):
        return get_object_or_404(Pokemon, pk=pk)

    def get(self, request, pk):
        self.require_authentication(request)
        pokemon = self.get_object(pk)
        return Response(PokemonSerializer(pokemon).data)

    def patch(self, request, pk):
        self.require_authentication(request)
        pokemon = self.get_object(pk)
        serializer = PokemonSerializer(pokemon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        self.require_authentication(request)
        pokemon = self.get_object(pk)
        pokemon.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
