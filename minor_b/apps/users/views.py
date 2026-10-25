from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer


User = get_user_model()


class UserListCreateAPIView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserRetrieveUpdateDestroyAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        user = self.get_object(pk)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        if not request.user.is_authenticated:
            raise NotAuthenticated()

        user = self.get_object(pk)
        if user != request.user:
            raise PermissionDenied('You can only update your own account.')

        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        if not request.user.is_authenticated:
            raise NotAuthenticated()

        user = self.get_object(pk)
        if user != request.user:
            raise PermissionDenied('You can only delete your own account.')

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
