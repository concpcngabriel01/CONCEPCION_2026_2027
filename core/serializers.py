from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem, Product, ShippingAddress, SupportMessage, WishlistItem


class AccountSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk", read_only=True)
    name = serializers.CharField(source="shopper_profile.name", read_only=True)
    email = serializers.EmailField(source="shopper_profile.email", read_only=True)


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(
        write_only=True, min_length=8, max_length=128, trim_whitespace=False
    )

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context["request"].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            "id", "label", "recipient_name", "phone", "address_line1",
            "address_line2", "city", "province", "postal_code",
            "delivery_notes", "is_default",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        user = self.context["request"].user
        with transaction.atomic():
            if validated_data.get("is_default") or not ShippingAddress.objects.filter(user=user).exists():
                ShippingAddress.objects.filter(user=user, is_default=True).update(is_default=False)
                validated_data["is_default"] = True
            return ShippingAddress.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        with transaction.atomic():
            if validated_data.get("is_default"):
                ShippingAddress.objects.filter(user=instance.user, is_default=True).exclude(
                    pk=instance.pk
                ).update(is_default=False)
            return super().update(instance, validated_data)


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(min_value=1)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)


class BuyNowSerializer(CheckoutSerializer):
    product_id = serializers.CharField(max_length=64)
    quantity = serializers.IntegerField(min_value=1, max_value=99, default=1)


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ["id", "subject", "message", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, min_length=8, max_length=128, trim_whitespace=False
    )

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class ProductSerializer(serializers.ModelSerializer):
    UniqueID = serializers.CharField(source="id", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "UniqueID",
            "name",
            "description",
            "sku",
            "price",
            "category",
            "stock",
            "thumbnail",
            "image_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AdminProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(max_length=64)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "sku",
            "price",
            "category",
            "stock",
            "thumbnail",
            "image_url",
            "is_active",
        ]

    def update(self, instance, validated_data):
        validated_data.pop("id", None)
        return super().update(instance, validated_data)


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.CharField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "created_at"]
        read_only_fields = ["id", "created_at"]


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=64)
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CartQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CartLineSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(read_only=True)
    product = ProductSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["product", "product_id", "quantity", "line_total"]


class CartSerializer(serializers.ModelSerializer):
    items = CartLineSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["items", "item_count", "total"]

    def get_item_count(self, cart):
        return sum(item.quantity for item in cart.items.all())

    def get_total(self, cart):
        return sum((item.line_total for item in cart.items.all()), start=0)


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "product",
            "product_id",
            "product_name",
            "product_sku",
            "quantity",
            "unit_price",
            "line_total",
        ]

    def get_product(self, item):
        if item.product_id:
            return ProductSerializer(item.product).data
        return {
            "id": None,
            "name": item.product_name,
            "sku": item.product_sku,
            "price": item.unit_price,
        }

    def get_product_id(self, item):
        return item.product_id


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    product_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "created_at",
            "status",
            "payment_method",
            "payment_status",
            "payment_demo_result",
            "recipient_name",
            "recipient_phone",
            "shipping_address",
            "delivery_notes",
            "tracking_code",
            "total",
            "items",
            "product_transactions",
        ]
        read_only_fields = fields

    def get_product_transactions(self, order):
        return [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            }
            for item in order.items.all()
        ]
