"""Signed bearer-token authentication for the shopping API."""

from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import ShopperProfile

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24
TOKEN_SALT = "core.shopping_api.bearer"
ADMIN_TOKEN_SALT = "core.shopping_api.admin_bearer"


def issue_token(user_id):
    version = ShopperProfile.objects.values_list("token_version", flat=True).get(user_id=user_id)
    return signing.dumps({"uid": user_id, "ver": version}, salt=TOKEN_SALT, compress=True)


def issue_admin_token(user_id):
    return signing.dumps({"uid": user_id}, salt=ADMIN_TOKEN_SALT, compress=True)


class BearerTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header:
            return None
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            raise AuthenticationFailed("Use a valid Bearer token.")
        try:
            claims = signing.loads(
                parts[1], salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE_SECONDS
            )
        except signing.SignatureExpired as exc:
            raise AuthenticationFailed("Token has expired.") from exc
        except signing.BadSignature as exc:
            raise AuthenticationFailed("Token is invalid.") from exc

        user_id = claims.get("uid") if isinstance(claims, dict) else None
        if user_id is None:
            raise AuthenticationFailed("Token is invalid.")
        user_model = get_user_model()
        try:
            user = user_model.objects.select_related("shopper_profile").get(
                pk=user_id, is_active=True
            )
        except (user_model.DoesNotExist, ValueError, TypeError) as exc:
            raise AuthenticationFailed("Token is invalid.") from exc
        try:
            profile = user.shopper_profile
        except ShopperProfile.DoesNotExist as exc:
            raise AuthenticationFailed("This account cannot use the customer API.") from exc
        if claims.get("ver", 0) != profile.token_version:
            raise AuthenticationFailed("Token has been revoked. Please sign in again.")
        return user, parts[1]

    def authenticate_header(self, request):
        return self.keyword


class AdminBearerTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header:
            return None
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            raise AuthenticationFailed("Use a valid bearer token.")
        try:
            claims = signing.loads(
                parts[1], salt=ADMIN_TOKEN_SALT, max_age=TOKEN_MAX_AGE_SECONDS
            )
        except signing.SignatureExpired as exc:
            raise AuthenticationFailed("Token has expired.") from exc
        except signing.BadSignature as exc:
            raise AuthenticationFailed("Token is invalid.") from exc

        user_id = claims.get("uid") if isinstance(claims, dict) else None
        user_model = get_user_model()
        try:
            user = user_model.objects.get(pk=user_id, is_active=True, is_staff=True)
        except (user_model.DoesNotExist, ValueError, TypeError) as exc:
            raise AuthenticationFailed("Admin token is invalid.") from exc
        return user, parts[1]

    def authenticate_header(self, request):
        return self.keyword
