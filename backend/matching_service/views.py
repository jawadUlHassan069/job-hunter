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
            from rag.embedder import get_similarity_scores
            scores = get_similarity_scores(cv.id, top_k=10)
        except Exception as e:
            return Response(
                {'error': f'Matching engine error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not scores:
            return Response(
                {'error': 'CV not yet indexed. Wait a moment and try again.'},
                status=status.HTTP_202_ACCEPTED
            )

        job_ids  = [s['job_id'] for s in scores]
        jobs_qs  = Job.objects.filter(id__in=job_ids)
        jobs_map = {job.id: job for job in jobs_qs}

        results = []
        for s in scores:
            job = jobs_map.get(s['job_id'])
            if job:
                job_data = JobSerializer(job).data
                # convert 0-1 float → 0-100 integer for frontend
                raw_sim  = s.get('similarity', 0)
                job_data['match_score'] = round(raw_sim * 100)
                job_data['similarity_score'] = raw_sim
                results.append(job_data)

        return Response(results)


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
            from matching_service.models import SkillGapCache

            cached = SkillGapCache.objects.filter(
                user=request.user,
                job=job
            ).first()

            if cached:
                gap_report = cached.result
            else:
                from skill_gap.analyzer import analyze_skill_gap
                gap_report = analyze_skill_gap(cv.parsed, job_dict)

                SkillGapCache.objects.create(
                    user=request.user,
                    job=job,
                    result=gap_report
                )

        except Exception as e:
            return Response(
                {'error': f'Skill gap analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Gemini already returns exactly the keys the frontend expects.
        # We normalize defensively in case any field is missing.
        normalized = {
            'match_score':     gap_report.get('match_score')     or 0,
            'strong_matches':  gap_report.get('strong_matches')  or [],
            'partial_matches': gap_report.get('partial_matches') or [],
            'missing_skills':  gap_report.get('missing_skills')  or [],
            'recommendations': gap_report.get('recommendations') or [],
            'summary':         gap_report.get('summary')         or '',
        }

        return Response(normalized)