from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'name', 'is_staff', 'is_2fa_enabled', 'created_at']
    search_fields = ['email', 'name']
    ordering      = ['email']
    fieldsets     = (
        (None,           {'fields': ('email', 'password')}),
        ('Personal',     {'fields': ('name',)}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_2fa_enabled')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'name', 'password1', 'password2'),
        }),
    )