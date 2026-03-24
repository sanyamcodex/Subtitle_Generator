import requests
import os

print('=== Subtitle Generator Full Test ===')

# 1. Health check
print('1. Health Check...')
r = requests.get('http://localhost:8000/health')
print(f'   Status: {r.status_code}, Response: {r.json()}')

# 2. Create project
print('2. Creating Project...')
r = requests.post('http://localhost:8000/projects', json={'title': 'Test Video Project'})
if r.status_code == 200:
    project = r.json()
    project_id = project['id']
    print(f'   Project created: {project_id}')
else:
    print(f'   Error: {r.status_code}, {r.text}')
    exit(1)

# 3. Upload video
print('3. Uploading Video...')
video_path = r'C:\Users\DELL\OneDrive\Desktop\Subtitle_Generator\test_video.mp4'
if os.path.exists(video_path):
    with open(video_path, 'rb') as f:
        files = {'file': ('test_video.mp4', f, 'video/mp4')}
        r = requests.post(f'http://localhost:8000/projects/{project_id}/upload', files=files)
    print(f'   Upload Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Response: {r.json()}')
    else:
        print(f'   Error: {r.text}')
else:
    print(f'   Video file not found: {video_path}')

# 4. Generate subtitles
print('4. Generating Subtitles...')
r = requests.post(f'http://localhost:8000/projects/{project_id}/generate-subtitles')
print(f'   Generation Status: {r.status_code}')
if r.status_code == 200:
    result = r.json()
    segments = result.get('subtitle_segments', [])
    print(f'   Success! Segments: {len(segments)}')
    print(f'   Download URL: {result.get("download_url", "N/A")}')
    if segments:
        print('   Sample segments:')
        for i, seg in enumerate(segments[:3]):  # Show first 3
            print(f'     {i+1}: {seg["start"]:.2f}s - {seg["end"]:.2f}s: {seg["text"][:50]}...')
else:
    print(f'   Error: {r.text}')

print('=== Test Complete ===')