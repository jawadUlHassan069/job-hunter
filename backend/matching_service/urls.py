from django.urls import path
from .views import MatchJobsView, SkillGapView

urlpatterns = [
    path('',                   MatchJobsView.as_view()),  # GET /api/match/
    path('gap/<int:job_id>/',  SkillGapView.as_view()),   # GET /api/match/gap/1/
]

