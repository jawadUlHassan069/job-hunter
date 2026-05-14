from rest_framework import serializers
from .models import CV


class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model            = CV
        fields           = ['id', 'file', 'raw_text', 'parsed', 'uploaded_at']
        read_only_fields = ['raw_text', 'parsed', 'uploaded_at']


class CVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('File too large. Maximum size is 5MB.')
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Only PDF files are accepted.')
        return value