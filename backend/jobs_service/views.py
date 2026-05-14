from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Job, SavedJob, Application
from .serializers import JobSerializer, ApplicationSerializer, SavedJobSerializer


class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = Job.objects.all()

        # filter by upcoming deadline
        deadline_filter = request.query_params.get('deadline')
        if deadline_filter == 'soon':
            cutoff = timezone.now().date() + timedelta(days=7)
            jobs   = jobs.filter(
                deadline__lte=cutoff,
                deadline__gte=timezone.now().date()
            )

        # filter by skill
        skill = request.query_params.get('skill')
        if skill:
            jobs = jobs.filter(required_skills__icontains=skill)

        return Response(JobSerializer(jobs[:50], many=True).data)


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