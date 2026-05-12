from django.urls import path
from . import views

urlpatterns = [
    path('',                       views.JobListView.as_view()),
    path('applications/',          views.ApplicationView.as_view()),
    path('applications/<int:pk>/', views.ApplicationView.as_view()),
    path('saved/',                 views.SavedJobView.as_view()),
    path('saved/<int:pk>/',        views.SavedJobView.as_view()),
]