from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import CV
from .serializers import CVSerializer, CVUploadSerializer
from .parser import extract_text_from_pdf, parse_cv_with_llm


def _calculate_cv_quality_score(parsed: dict) -> int:
    """
    Calculate CV quality/completeness score (0-100).
    40 pts  → skills   (3 pts each, capped at 40)
    20 pts  → experience present
    15 pts  → education present
    15 pts  → name + email present
    10 pts  → certifications present
    """
    if not parsed or 'error' in parsed:
        return 0

    score = 0
    skills_count = len(parsed.get('skills', []))
    score += min(skills_count * 3, 40)
    score += 20 if parsed.get('experience') else 0
    score += 15 if parsed.get('education')  else 0
    score += 15 if (parsed.get('name') and parsed.get('email')) else 0
    score += 10 if parsed.get('certifications') else 0
    return min(score, 100)


class CVUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CVUploadSerializer(data=request.FILES)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']

        cv, created = CV.objects.update_or_create(
            user=request.user,
            defaults={'file': file}
        )

        # extract text from saved PDF
        try:
            raw_text    = extract_text_from_pdf(cv.file.path)
            cv.raw_text = raw_text
        except Exception as e:
            cv.raw_text = ''
            print(f'PDF extraction error: {e}')

        # parse with LLM (multi-model fallback)
        try:
            cv.parsed = parse_cv_with_llm(cv.raw_text)
        except Exception as e:
            cv.parsed = {'error': str(e)}
            print(f'LLM parsing error: {e}')

        cv.save()

        # trigger background embedding
        try:
            from matching_service.tasks import embed_cv_task
            embed_cv_task.delay(cv.id)
        except Exception as e:
            print(f'Celery embed task failed: {e}')

        # Calculate CV quality score
        cv_quality = _calculate_cv_quality_score(cv.parsed)

        # Get top 5 recent jobs and calculate match scores
        job_matches = []
        try:
            from jobs_service.models import Job
            from jobs_service.serializers import JobSerializer
            
            recent_jobs = Job.objects.order_by('-scraped_at')[:5]
            
            if recent_jobs.exists():
                # Wait a moment for embedding to complete (if running eagerly)
                import time
                time.sleep(2)
                
                # Get similarity scores (semantic matching)
                try:
                    from rag.embedder import get_similarity_scores
                    from skill_gap.analyzer import analyze_skill_gap
                    
                    scores = get_similarity_scores(cv.id, top_k=5)
                    
                    # Map scores to jobs
                    scores_map = {s['job_id']: s['similarity'] for s in scores}
                    
                    for job in recent_jobs:
                        job_data = JobSerializer(job).data
                        semantic_score = scores_map.get(job.id, 0)
                        
                        # Calculate skill-based match using LLM
                        try:
                            job_dict = {
                                'title': job.title,
                                'description': job.description,
                                'required_skills': job.required_skills,
                            }
                            skill_gap_result = analyze_skill_gap(cv.parsed, job_dict)
                            skill_match_score = skill_gap_result.get('match_score', 0)
                        except Exception as e:
                            print(f'Skill gap analysis failed for job {job.id}: {e}')
                            skill_match_score = 0
                        
                        # Hybrid scoring: 30% semantic + 70% skills
                        hybrid_score = (semantic_score * 0.3) + (skill_match_score * 0.7)
                        match_score = round(hybrid_score)
                        
                        # Determine match label
                        if match_score >= 80:
                            label = "Excellent Match"
                        elif match_score >= 60:
                            label = "Good Match"
                        elif match_score >= 40:
                            label = "Fair Match"
                        else:
                            label = "Low Match"
                        
                        job_matches.append({
                            'job': job_data,
                            'match_score': match_score,
                            'semantic_score': round(semantic_score),
                            'skill_score': round(skill_match_score),
                            'match_label': label
                        })
                    
                except Exception as e:
                    print(f'Similarity calculation failed: {e}')
                    # Return jobs without scores as fallback
                    for job in recent_jobs:
                        job_data = JobSerializer(job).data
                        job_matches.append({
                            'job': job_data,
                            'match_score': 0,
                            'semantic_score': 0,
                            'skill_score': 0,
                            'match_label': 'Calculating...'
                        })
        except Exception as e:
            print(f'Job matching failed: {e}')

        # Build response with CV data + quality score + job matches
        response_data = {
            'cv': CVSerializer(cv).data,
            'cv_quality_score': cv_quality,
            'job_matches': job_matches,
            'total_jobs': len(job_matches)
        }

        return Response(
            response_data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get(self, request):
        try:
            cv = CV.objects.get(user=request.user)
            cv_quality = _calculate_cv_quality_score(cv.parsed)
            
            # Dashboard doesn't need job matches - just return CV data
            response_data = {
                'cv': CVSerializer(cv).data,
                'cv_quality_score': cv_quality,
            }
            
            return Response(response_data)
        except CV.DoesNotExist:
            return Response(
                {'cv': None},
                status=status.HTTP_200_OK
            )