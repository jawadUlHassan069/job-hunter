from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


# Return JSON for 429 Too Many Requests (from django-ratelimit)
def ratelimited_error(request, exception):
    return JsonResponse(
        {'error': 'Too many requests. Please slow down and try again in a minute.'},
        status=429
    )

# Return JSON for 404 and 500 so the API never returns HTML
def not_found(request, exception):
    return JsonResponse({'error': 'Not found.'}, status=404)

def server_error(request):
    return JsonResponse({'error': 'Internal server error.'}, status=500)


handler429 = ratelimited_error
handler404 = not_found
handler500 = server_error


urlpatterns = [
    path('admin/',       admin.site.urls),
    path('api/auth/',    include('auth_service.urls')),
    path('api/cv/',      include('cv_service.urls')),
    path('api/jobs/',    include('jobs_service.urls')),
    path('api/match/',   include('matching_service.urls')),
    path('api/chat/',    include('cv_agent.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)