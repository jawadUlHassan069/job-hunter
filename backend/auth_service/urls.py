from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',      views.RegisterView.as_view()),
    path('login/',         views.LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('2fa/setup/',     views.Setup2FAView.as_view()),
    path('2fa/verify/',    views.Verify2FAView.as_view()),
    path('me/',            views.MeView.as_view()),
]