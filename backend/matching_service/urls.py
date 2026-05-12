from django.urls import path
from . import views

urlpatterns = [
    path('',                   views.MatchJobsView.as_view()),
    path('gap/<int:job_id>/',  views.SkillGapView.as_view()),
]