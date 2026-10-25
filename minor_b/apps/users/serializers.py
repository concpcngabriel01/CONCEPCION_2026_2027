from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Validate user input and keep passwords private and securely hashed."""

    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        help_text='Required when creating an account.',
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        help_text='Must match the password when one is provided.',
    )
    level = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'confirm_password',
            'avatar',
            'level',
        )
        read_only_fields = ('id',)

    def validate_password(self, value):
        """Apply the active Django password-strength validators."""
        try:
            validate_password(value, self.instance)
        except ValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def validate(self, attrs):
        """Require a matching confirmation for new or changed passwords."""
        password = attrs.get('password')
        confirmation = attrs.pop('confirm_password', None)

        if self.instance is None and not password:
            raise serializers.ValidationError({'password': 'This field is required.'})

        if password and password != confirmation:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        if confirmation and not password:
            raise serializers.ValidationError({
                'password': 'Provide a password to confirm.'
            })
        return attrs

    def create(self, validated_data):
        """Create a user after hashing the submitted password."""
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        """Update user fields and hash a new password when supplied."""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user
