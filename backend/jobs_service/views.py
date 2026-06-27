from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Job, SavedJob, Application
from .serializers import JobSerializer, ApplicationSerializer, SavedJobSerializer


class FeaturedJobsView(APIView):
    """Public endpoint - returns 10 most recent ACTIVE jobs for landing page carousel"""
    permission_classes = [AllowAny]

    def get(self, request):
        # Only show active jobs (not expired)
        jobs = Job.objects.filter(
            scraped_at__gte=timezone.now() - timedelta(days=30)  # Recent jobs
        ).order_by('-scraped_at')[:10]
        
        # Filter out expired jobs
        active_jobs = [job for job in jobs if job.is_active]
        
        return Response(JobSerializer(active_jobs, many=True).data)


class JobStatsView(APIView):
    """Return stats about scraped jobs for frontend display"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_jobs = Job.objects.count()
        recent_jobs = Job.objects.filter(
            scraped_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        latest_job = Job.objects.order_by('-scraped_at').first()
        latest_scrape_time = latest_job.scraped_at if latest_job else None
        
        return Response({
            'total_jobs': total_jobs,
            'recent_jobs_24h': recent_jobs,
            'latest_scrape': latest_scrape_time,
            'needs_refresh': recent_jobs < 10,
        })


class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only show active (non-expired) jobs
        jobs = Job.objects.all()
        
        # Filter out expired jobs
        active_jobs = [job for job in jobs if job.is_active]

        # filter by upcoming deadline
        deadline_filter = request.query_params.get('deadline')
        if deadline_filter == 'soon':
            # Jobs expiring in next 7 days
            active_jobs = [job for job in active_jobs if 0 <= job.days_until_deadline <= 7]

        # filter by skill
        skill = request.query_params.get('skill')
        if skill:
            active_jobs = [job for job in active_jobs if skill.lower() in ' '.join(job.required_skills).lower()]

        # Sort by urgency (closest deadline first)
        active_jobs.sort(key=lambda j: j.days_until_deadline)

        return Response(JobSerializer(active_jobs[:50], many=True).data)


class ApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = Application.objects.filter(
            user=request.user
        ).select_related('job')
        return Response(ApplicationSerializer(apps, many=True).data)

    def post(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response(
                {'error': 'job_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        app, created = Application.objects.get_or_create(
            user = request.user,
            job  = job,
            defaults={'status': 'applied'}
        )
        return Response(
            ApplicationSerializer(app).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def patch(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, user=request.user)
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        app.status = request.data.get('status', app.status)
        app.notes  = request.data.get('notes',  app.notes)
        app.save()
        return Response(ApplicationSerializer(app).data)


class SavedJobView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedJob.objects.filter(
            user=request.user
        ).select_related('job')
        return Response(SavedJobSerializer(saved, many=True).data)

    def post(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response(
                {'error': 'job_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        saved, created = SavedJob.objects.get_or_create(
            user=request.user,
            job=job
        )
        return Response(
            SavedJobSerializer(saved).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request, pk):
        try:
            SavedJob.objects.get(pk=pk, user=request.user).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedJob.DoesNotExist:
            return Response(
                {'error': 'Saved job not found'},
                status=status.HTTP_404_NOT_FOUND
            )