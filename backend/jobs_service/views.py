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



class TriggerScrapingView(APIView):
    """
    POST /api/jobs/scrape/
    Trigger job scraping manually.
    Only authenticated users can access.
    Returns scraping results.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from .tasks import scrape_jobs
            
            # Trigger scraping synchronously
            result = scrape_jobs()
            
            return Response({
                'message': 'Scraping completed successfully',
                'jobs_added': result.get('new_jobs', 0),
                'jobs_updated': result.get('updated_jobs', 0),
                'jobs_embedded': result.get('embedded', 0),
                'status': result.get('status', 'completed')
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Scraping failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LastScrapeInfoView(APIView):
    """
    GET /api/jobs/last-scrape/
    Returns information about the last scrape.
    For displaying scrape status in the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from .tasks import get_last_scrape_info
            
            info = get_last_scrape_info()
            
            # Calculate time since last scrape
            last_scrape_time = info.get('last_scrape_time')
            if last_scrape_time:
                time_since_scrape = timezone.now() - last_scrape_time
                hours_since = int(time_since_scrape.total_seconds() / 3600)
                days_since = hours_since // 24
                
                if days_since > 0:
                    time_display = f"{days_since} day{'s' if days_since != 1 else ''} ago"
                elif hours_since > 0:
                    time_display = f"{hours_since} hour{'s' if hours_since != 1 else ''} ago"
                else:
                    time_display = "Less than an hour ago"
            else:
                time_display = "Never"
                
            return Response({
                'last_scrape_time': last_scrape_time,
                'time_display': time_display,
                'total_jobs': info.get('total_jobs', 0),
                'recent_jobs_24h': info.get('recent_jobs_24h', 0),
                'needs_refresh': info.get('needs_refresh', True),
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
