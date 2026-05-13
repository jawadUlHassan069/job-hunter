import sys
from pathlib import Path

VIEWS_FILE  = Path(__file__).resolve()
BACKEND_DIR = VIEWS_FILE.parent.parent
PROJECT_DIR = BACKEND_DIR.parent
ML_PATH     = PROJECT_DIR / 'ml'

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from jobs_service.models import Job
from jobs_service.serializers import JobSerializer


class MatchJobsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cv = request.user.cv
        except Exception:
            return Response(
                {'error': 'Please upload a CV first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not cv.parsed or 'error' in cv.parsed:
            return Response(
                {'error': 'CV parsing failed. Please re-upload your CV.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from rag.embedder import find_matching_jobs
            job_ids = find_matching_jobs(cv.id, top_k=10)
        except Exception as e:
            return Response(
                {'error': f'Matching engine error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not job_ids:
            return Response(
                {'error': 'CV not yet indexed. Wait a moment and try again.'},
                status=status.HTTP_202_ACCEPTED
            )

        jobs_qs = Job.objects.filter(id__in=job_ids)
        jobs    = sorted(jobs_qs, key=lambda j: job_ids.index(j.id))

        return Response(JobSerializer(jobs, many=True).data)


class SkillGapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            cv = request.user.cv
        except Exception:
            return Response(
                {'error': 'Please upload a CV first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        job_dict = {
            'title':           job.title,
            'description':     job.description,
            'required_skills': job.required_skills,
        }

        try:
            from skill_gap.analyzer import analyze_skill_gap
            gap_report = analyze_skill_gap(cv.parsed, job_dict)
        except Exception as e:
            return Response(
                {'error': f'Skill gap analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(gap_report)