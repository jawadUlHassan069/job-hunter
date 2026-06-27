from django.contrib import admin
from .models import Job, SavedJob, Application

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display  = ['title', 'company', 'location', 'deadline', 'source', 'scraped_at']
    search_fields = ['title', 'company']
    list_filter   = ['source', 'is_deadline_confirmed']

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display  = ['user', 'job', 'status', 'applied_at']
    list_filter   = ['status']
    search_fields = ['user__email', 'job__title']

@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display  = ['user', 'job', 'saved_at']
    search_fields = ['user__email', 'job__title']