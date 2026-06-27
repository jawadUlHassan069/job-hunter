from django.contrib import admin
from .models import CV

@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display  = ['user', 'uploaded_at']
    search_fields = ['user__email']
    readonly_fields = ['raw_text', 'parsed', 'uploaded_at']