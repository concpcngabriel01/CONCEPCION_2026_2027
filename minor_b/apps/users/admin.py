from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Pokédex profile', {'fields': ('avatar', 'level')}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('Pokédex profile', {'fields': ('avatar', 'level')}),
    )
