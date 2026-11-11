"""Database-backed REST API for shopping, authentication, and checkout."""

from decimal import Decimal, InvalidOperation
import uuid

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import issue_token
from .authentication import AdminBearerTokenAuthentication, issue_admin_token
from .models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    Product,
    ShippingAddress,
    ShopperProfile,
    SupportMessage,
    WishlistItem,
)
from .serializers import (
    BuyNowSerializer,
    AccountSerializer,
    AdminProductSerializer,
    AddCartItemSerializer,
    CartQuantitySerializer,
    CartSerializer,
    ChangePasswordSerializer,
    CheckoutSerializer,
    LoginSerializer,
    OrderSerializer,
    ProductSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ShippingAddressSerializer,
    SupportMessageSerializer,
    WishlistItemSerializer,
)


def _error(message, code):
    return Response({"detail": message}, status=code)


def _cart_response(cart):
    cart = Cart.objects.prefetch_related("items__product").get(pk=cart.pk)
    return Response(CartSerializer(cart).data)


class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "")
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        if (
            not isinstance(email, str)
            or not isinstance(username, str)
            or not isinstance(password, str)
            or bool(email.strip()) == bool(username.strip())
        ):
            return _error(
                "Enter either an admin username or email and password.",
                status.HTTP_400_BAD_REQUEST,
            )
        candidates = User.objects.filter(is_active=True, is_staff=True)
        if username.strip():
            candidates = candidates.filter(username__iexact=username.strip())
        else:
            candidates = candidates.filter(email__iexact=email.strip())
        user = None
        for candidate in candidates:
            user = authenticate(
                request,
                username=candidate.get_username(),
                password=password,
            )
            if user is not None:
                break
        if user is None:
            return _error("Invalid admin username/email or password.", status.HTTP_401_UNAUTHORIZED)
        return Response({"access": issue_admin_token(user.pk)})


class AdminProductListView(APIView):
    authentication_classes = [AdminBearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        products = Product.objects.all()
        return Response(AdminProductSerializer(products, many=True).data)

    def post(self, request):
        serializer = AdminProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(AdminProductSerializer(product).data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(APIView):
    authentication_classes = [AdminBearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        serializer = AdminProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(AdminProductSerializer(product).data)

    def delete(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "")
        if isinstance(email, str) and ShopperProfile.objects.filter(
            email__iexact=email.strip()
        ).exists():
            return _error(
                "An account with this email already exists.",
                status.HTTP_409_CONFLICT,
            )
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                data = serializer.validated_data
                user = User.objects.create_user(
                    username=data.get("username") or uuid.uuid4().hex,
                    email=data["email"],
                    password=data["password"],
                )
                ShopperProfile.objects.create(
                    user=user,
                    email=data["email"],
                    name=data["name"],
                )
        except IntegrityError:
            if ShopperProfile.objects.filter(
                email__iexact=serializer.validated_data["email"]
            ).exists():
                return _error(
                    "An account with this email already exists.",
                    status.HTTP_409_CONFLICT,
                )
            raise
        return Response(
            {"user": AccountSerializer(user).data, "access": issue_token(user.pk)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credentials = serializer.validated_data
        if credentials.get("email"):
            profile = ShopperProfile.objects.select_related("user").filter(
                email__iexact=credentials["email"]
            ).first()
            user = profile.user if profile else None
        else:
            user = User.objects.filter(
                username__iexact=credentials["username"],
                is_active=True,
                shopper_profile__isnull=False,
            ).first()
        if (
            user is None
            or not user.is_active
            or not user.check_password(credentials["password"])
        ):
            return _error("Invalid email or password.", status.HTTP_401_UNAUTHORIZED)
        return Response(
            {"user": AccountSerializer(user).data, "access": issue_token(user.pk)}
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": AccountSerializer(request.user).data})

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.shopper_profile
        profile.name = serializer.validated_data["name"]
        profile.save(update_fields=["name"])
        return Response({"user": AccountSerializer(request.user).data})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["current_password"]):
            return _error("Current password is incorrect.", status.HTTP_400_BAD_REQUEST)
        profile = request.user.shopper_profile
        request.user.set_password(serializer.validated_data["new_password"])
        with transaction.atomic():
            request.user.save(update_fields=["password"])
            profile.token_version += 1
            profile.save(update_fields=["token_version"])
        return Response({"access": issue_token(request.user.pk)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.shopper_profile
        profile.token_version += 1
        profile.save(update_fields=["token_version"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        products = Product.objects.filter(is_active=True)
        category = request.query_params.get("category")
        query = request.query_params.get("search", "").strip()
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        in_stock = request.query_params.get("in_stock")
        sort = request.query_params.get("sort", "name")
        if category:
            products = products.filter(category__iexact=category)
        if query:
            products = products.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
                | Q(sku__icontains=query)
            )
        try:
            min_value = Decimal(min_price) if min_price not in (None, "") else None
            max_value = Decimal(max_price) if max_price not in (None, "") else None
        except (InvalidOperation, ValueError):
            return _error("Price filters must be valid non-negative amounts.", status.HTTP_400_BAD_REQUEST)
        if any(value is not None and (not value.is_finite() or value < 0) for value in (min_value, max_value)):
            return _error("Price filters must be valid non-negative amounts.", status.HTTP_400_BAD_REQUEST)
        if min_value is not None:
            products = products.filter(price__gte=min_value)
        if max_value is not None:
            products = products.filter(price__lte=max_value)
        if min_value is not None and max_value is not None and min_value > max_value:
            return _error("Minimum price cannot be greater than maximum price.", status.HTTP_400_BAD_REQUEST)
        if in_stock not in (None, ""):
            if in_stock.lower() not in ("true", "false"):
                return _error("in_stock must be true or false.", status.HTTP_400_BAD_REQUEST)
            if in_stock.lower() == "true":
                products = products.filter(stock__gt=0)
            else:
                products = products.filter(stock=0)
        ordering = {
            "name": ("name", "id"),
            "price_asc": ("price", "name", "id"),
            "price_desc": ("-price", "name", "id"),
            "newest": ("-created_at", "name"),
        }
        if sort not in ordering:
            return _error("Unsupported sort option.", status.HTTP_400_BAD_REQUEST)
        products = products.order_by(*ordering[sort])
        return Response(ProductSerializer(products, many=True).data)


class CategoryListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        categories = Product.objects.filter(is_active=True).order_by().values_list(
            "category", flat=True
        ).distinct()
        return Response(list(categories))


class PaymentMethodListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response([
            {
                "id": method,
                "label": label,
                "enabled": method == Order.PaymentMethod.COD or settings.PAYMENT_DEMO_MODE,
                "demo_mode": method != Order.PaymentMethod.COD and settings.PAYMENT_DEMO_MODE,
            }
            for method, label in Order.PaymentMethod.choices
        ])


class ProductDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id, is_active=True)
        return Response(ProductSerializer(product).data)


class ShippingAddressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = ShippingAddress.objects.filter(user=request.user)
        return Response(ShippingAddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = ShippingAddressSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        address = serializer.save()
        return Response(ShippingAddressSerializer(address).data, status=status.HTTP_201_CREATED)


class ShippingAddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, address_id):
        address = get_object_or_404(ShippingAddress, pk=address_id, user=request.user)
        serializer = ShippingAddressSerializer(
            address, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, address_id):
        address = get_object_or_404(ShippingAddress, pk=address_id, user=request.user)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(
            user=request.user, product__is_active=True
        ).select_related("product")
        return Response(WishlistItemSerializer(items, many=True).data)

    def post(self, request):
        product_id = request.data.get("product_id")
        if not isinstance(product_id, str) or not product_id.strip():
            return _error("A product_id is required.", status.HTTP_400_BAD_REQUEST)
        product = Product.objects.filter(pk=product_id, is_active=True).first()
        if product is None:
            return _error("Product not found.", status.HTTP_404_NOT_FOUND)
        item, _ = WishlistItem.objects.get_or_create(user=request.user, product=product)
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_200_OK)

    def delete(self, request, product_id):
        WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SupportMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = SupportMessage.objects.filter(user=request.user)
        return Response(SupportMessageSerializer(messages, many=True).data)

    def post(self, request):
        serializer = SupportMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(user=request.user)
        return Response(SupportMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return _cart_response(cart)


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            cart = Cart.objects.select_for_update().get(pk=cart.pk)
            product = Product.objects.filter(pk=product_id, is_active=True).first()
            if product is None:
                return _error("Product not found.", status.HTTP_404_NOT_FOUND)
            item = CartItem.objects.filter(cart=cart, product=product).first()
            new_quantity = quantity + (item.quantity if item else 0)
            if new_quantity > 99:
                return _error("Cart quantity cannot exceed 99.", status.HTTP_400_BAD_REQUEST)
            if new_quantity > product.stock:
                return _error(
                    "Requested quantity exceeds available stock.",
                    status.HTTP_409_CONFLICT,
                )
            if item is None:
                CartItem.objects.create(cart=cart, product=product, quantity=quantity)
            else:
                item.quantity = new_quantity
                item.save(update_fields=["quantity", "updated_at"])
        return _cart_response(cart)

    def patch(self, request, product_id):
        serializer = CartQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]
        with transaction.atomic():
            cart = get_object_or_404(
                Cart.objects.select_for_update(), user=request.user
            )
            item = get_object_or_404(
                CartItem.objects.select_related("product").select_for_update(),
                cart=cart,
                product_id=product_id,
            )
            if not item.product.is_active:
                return _error("Product not found.", status.HTTP_404_NOT_FOUND)
            if quantity > item.product.stock:
                return _error(
                    "Requested quantity exceeds available stock.",
                    status.HTTP_409_CONFLICT,
                )
            item.quantity = quantity
            item.save(update_fields=["quantity", "updated_at"])
        return _cart_response(cart)

    def delete(self, request, product_id):
        with transaction.atomic():
            cart = get_object_or_404(
                Cart.objects.select_for_update(), user=request.user
            )
            item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
            item.delete()
        return _cart_response(cart)


class InsufficientStock(Exception):
    """Raised when stock changes between checkout validation and decrement."""


def _online_payment_unavailable(payment_method):
    if payment_method == Order.PaymentMethod.COD or settings.PAYMENT_DEMO_MODE:
        return None
    return _error(
        "This online payment method is not configured yet. Choose Cash on Delivery; no payment was taken.",
        status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _create_order(user, items, address, payment_method):
    if any(not item.product.is_active or item.quantity > item.product.stock for item in items):
        raise InsufficientStock
    total = sum(
        (item.product.price * item.quantity for item in items),
        start=Decimal("0.00"),
    )
    address_lines = [
        address.address_line1,
        address.address_line2,
        f"{address.city}, {address.province} {address.postal_code}",
    ]
    order = Order.objects.create(
        user=user,
        total=total,
        payment_method=payment_method,
        recipient_name=address.recipient_name,
        recipient_phone=address.phone,
        shipping_address=", ".join(part for part in address_lines if part),
        delivery_notes=address.delivery_notes,
    )
    for item in items:
        updated = Product.objects.filter(
            pk=item.product_id,
            is_active=True,
            stock__gte=item.quantity,
        ).update(stock=F("stock") - item.quantity)
        if not updated:
            raise InsufficientStock
        OrderItem.objects.create(
            order=order,
            product=item.product,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.product.price,
        )
    return order


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unavailable = _online_payment_unavailable(serializer.validated_data["payment_method"])
        if unavailable:
            return unavailable
        address = get_object_or_404(
            ShippingAddress, pk=serializer.validated_data["address_id"], user=request.user
        )
        try:
            with transaction.atomic():
                cart, _ = Cart.objects.get_or_create(user=request.user)
                cart = Cart.objects.select_for_update().get(pk=cart.pk)
                items = list(
                    cart.items.select_related("product").select_for_update()
                )
                if not items:
                    return _error("Your cart is empty.", status.HTTP_400_BAD_REQUEST)
                order = _create_order(
                    request.user,
                    items,
                    address,
                    serializer.validated_data["payment_method"],
                )
                cart.items.all().delete()
        except InsufficientStock:
            return _error(
                "One or more items no longer have enough stock.",
                status.HTTP_409_CONFLICT,
            )

        order = Order.objects.prefetch_related("items__product").get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class BuyNowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BuyNowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unavailable = _online_payment_unavailable(serializer.validated_data["payment_method"])
        if unavailable:
            return unavailable
        address = get_object_or_404(
            ShippingAddress, pk=serializer.validated_data["address_id"], user=request.user
        )
        try:
            with transaction.atomic():
                product = Product.objects.select_for_update().filter(
                    pk=serializer.validated_data["product_id"], is_active=True
                ).first()
                if product is None:
                    return _error("Product not found.", status.HTTP_404_NOT_FOUND)
                quantity = serializer.validated_data["quantity"]
                if product.stock < quantity:
                    return _error(
                        "Requested quantity exceeds available stock.",
                        status.HTTP_409_CONFLICT,
                    )
                item = CartItem(product=product, quantity=quantity)
                order = _create_order(
                    request.user, [item], address, serializer.validated_data["payment_method"]
                )
        except InsufficientStock:
            return _error(
                "One or more items no longer have enough stock.",
                status.HTTP_409_CONFLICT,
            )
        order = Order.objects.prefetch_related("items__product").get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related("items__product")
        return Response(OrderSerializer(orders, many=True).data)


class DemoPaymentResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        if not settings.PAYMENT_DEMO_MODE:
            return _error("Demo payment simulation is disabled.", status.HTTP_404_NOT_FOUND)
        result = request.data.get("result")
        if result not in Order.PaymentDemoResult.values:
            return _error(
                "Choose a supported demo result: success or failed.",
                status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                order_number=order_number,
                user=request.user,
            )
            if order.payment_method == Order.PaymentMethod.COD:
                return _error("Cash on Delivery does not use online payment simulation.", status.HTTP_400_BAD_REQUEST)
            if order.payment_status != Order.PaymentStatus.PENDING:
                return _error("Only pending demo payments can be simulated.", status.HTTP_409_CONFLICT)
            if order.payment_demo_result:
                return _error("A demo result has already been recorded for this order.", status.HTTP_409_CONFLICT)
            order.payment_demo_result = result
            order.save(update_fields=["payment_demo_result"])
        return Response(OrderSerializer(order).data)
