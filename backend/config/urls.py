from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',       admin.site.urls),
    path('api/auth/',    include('auth_service.urls')),
    path('api/cv/',      include('cv_service.urls')),
    path('api/jobs/',    include('jobs_service.urls')),
    path('api/match/',   include('matching_service.urls')),
    path('api/alerts/',  include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)