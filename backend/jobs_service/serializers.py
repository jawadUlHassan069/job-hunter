from rest_framework import serializers
from django.utils import timezone
from .models import Job, SavedJob, Application


class JobSerializer(serializers.ModelSerializer):
    days_until_deadline = serializers.SerializerMethodField()
    similarity_score    = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'description',
            'url',
            'source',
            'required_skills',
            'deadline',
            'days_until_deadline',
            'is_deadline_confirmed',
            'similarity_score',
            'posted_at',
            'scraped_at',
        ]

    def get_days_until_deadline(self, obj):
        if not obj.deadline:
            return None
        delta = obj.deadline - timezone.now().date()
        return delta.days

    def get_similarity_score(self, obj):
        # dynamically attached in matching view
        # returns None for normal job listings
        # returns percentage for matched jobs
        return getattr(obj, 'similarity_score', None)


class ApplicationSerializer(serializers.ModelSerializer):
    job    = JobSerializer(read_only=True)
    job_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Application
        fields = [
            'id',
            'job',
            'job_id',
            'status',
            'notes',
            'applied_at',
            'updated_at',
        ]


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model  = SavedJob
        fields = ['id', 'job', 'saved_at']