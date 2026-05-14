from django.urls import path
from . import views

urlpatterns = [
    path('', views.CVUploadView.as_view()),
]