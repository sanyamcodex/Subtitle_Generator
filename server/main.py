import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CaptionForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

PROJECTS_DB_FILE = "projects_db.json"

from services.audio_utils import extract_audio_from_video, burn_subtitles_to_video
from services.transcription_utils import transcribe_audio
from services.srt_utils import generate_srt_from_words, generate_srt_from_segments, generate_srt_with_line_transitions

projects_db = {}


def save_projects_db():
    with open(PROJECTS_DB_FILE, "w", encoding="utf-8") as f:
        import json

        json.dump(projects_db, f, ensure_ascii=False, indent=2)


def load_projects_db():
    global projects_db
    if os.path.exists(PROJECTS_DB_FILE):
        with open(PROJECTS_DB_FILE, "r", encoding="utf-8") as f:
            import json

            try:
                data = json.load(f)
                if isinstance(data, dict):
                    projects_db = data
            except Exception:
                projects_db = {}


load_projects_db()
class CreateProjectRequest(BaseModel):
    title: str

class BurnSubtitlesRequest(BaseModel):
    subtitle_text: str | None = None

class UpdateSubtitlesRequest(BaseModel):
    subtitle_text: str

@app.get("/")
def root():
    return {"message": "CaptionForge API running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/projects")
def create_project(payload: CreateProjectRequest):
    project_id = str(uuid.uuid4())

    project = {
        "id": project_id,
        "title": payload.title,
        "status": "draft",
        "created_at": datetime.utcnow().isoformat(),
        "video_filename": None,
        "video_path": None,
    }

    projects_db[project_id] = project
    save_projects_db()
    return project

@app.get("/projects")
def list_projects():
    return sorted(
        list(projects_db.values()),
        key=lambda x: x["created_at"],
        reverse=True
    )

@app.get("/projects/{project_id}")
def get_project(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/projects/{project_id}/upload")
def upload_video(project_id: str, file: UploadFile = File(...)):
    print(f"[API] upload video called for project_id={project_id}, filename={file.filename}")
    project = projects_db.get(project_id)
    if not project:
        print(f"[API] project not found: {project_id}")
        raise HTTPException(status_code=404, detail="Project not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{project_id}{extension}"
    save_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    project["video_filename"] = file.filename
    project["video_path"] = save_path
    project["status"] = "video_uploaded"
    save_projects_db()

    return {
        "message": "Video uploaded successfully",
        "project_id": project_id,
        "filename": file.filename,
        "saved_path": save_path,
    }

@app.post("/projects/{project_id}/generate-subtitles")
def generate_project_subtitles(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    video_path = project.get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=400, detail="Uploaded video not found for this project")

    try:
        audio_path = extract_audio_from_video(video_path, outputs_dir="outputs")
        subtitle_segments = transcribe_audio(audio_path)
        
        print(f"[DEBUG] Total segments: {len(subtitle_segments)}")
        if subtitle_segments:
            first_seg = subtitle_segments[0]
            print(f"[DEBUG] First segment: {first_seg}")
            print(f"[DEBUG] Has words? {bool(first_seg.get('words'))}")
            if first_seg.get('words'):
                print(f"[DEBUG] Number of words in first segment: {len(first_seg['words'])}")

        if subtitle_segments and subtitle_segments[0].get('words'):
            srt_path = generate_srt_from_words(subtitle_segments, project_id, outputs_dir="outputs")
        else:
            srt_path = generate_srt_from_segments(subtitle_segments, project_id, outputs_dir="outputs")
        
        print(f"[DEBUG] SRT generated at: {srt_path}")
        print(f"[DEBUG] SRT file exists? {os.path.exists(srt_path)}")
        if os.path.exists(srt_path):
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"[DEBUG] SRT content length: {len(content)} bytes")
                print(f"[DEBUG] First 500 chars:\n{content[:500]}")

        project["subtitle_path"] = srt_path
        project["subtitle_segments"] = subtitle_segments
        project["status"] = "subtitles_ready"
        save_projects_db()

        return {
            "message": "Subtitles generated successfully",
            "project_id": project_id,
            "subtitle_path": srt_path,
            "subtitle_segments": subtitle_segments,
            "download_url": f"/projects/{project_id}/subtitle-file",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/projects/{project_id}/subtitle-file")
def download_subtitle_file(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    subtitle_path = project.get("subtitle_path")
    if not subtitle_path or not os.path.exists(subtitle_path):
        raise HTTPException(status_code=404, detail="Subtitle SRT not found")

    return FileResponse(path=subtitle_path, filename=f"{project_id}.srt", media_type="application/x-subrip")

@app.post("/projects/{project_id}/burn-subtitles")
def burn_subtitles(project_id: str, payload: BurnSubtitlesRequest):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    video_path = project.get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=400, detail="Uploaded video not found for this project")

    subtitle_path = project.get("subtitle_path")
    if payload.subtitle_text:
        os.makedirs("outputs", exist_ok=True)
        subtitle_path = generate_srt_with_line_transitions(payload.subtitle_text, project_id, outputs_dir="outputs")
        project["subtitle_path"] = subtitle_path  # persist edited subtitle file used for burn

    if not subtitle_path or not os.path.exists(subtitle_path):
        raise HTTPException(status_code=404, detail="Subtitle SRT not found")

    # Debug information for burning pipeline.
    print(f"[burn_subtitles] project_id={project_id}, video_path={video_path}, subtitle_path={subtitle_path}")
    with open(subtitle_path, 'r', encoding='utf-8') as f:
        srt_preview = ''.join(f.readlines()[:20])
    print(f"[burn_subtitles] SRT preview (first 20 lines):\n{srt_preview}")

    try:
        burned_video = burn_subtitles_to_video(video_path, subtitle_path, outputs_dir="outputs")
        project["burned_video_path"] = burned_video
        project["status"] = "video_burned"
        save_projects_db()

        return {
            "message": "Video burned with subtitles successfully",
            "project_id": project_id,
            "burned_video_path": burned_video,
            "download_url": f"/projects/{project_id}/burned-video-file",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/projects/{project_id}/subtitle-update")
def update_subtitles(project_id: str, payload: UpdateSubtitlesRequest):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not payload.subtitle_text:
        raise HTTPException(status_code=400, detail="subtitle_text must be provided")

    print(f"[DEBUG] Backend received subtitle_text for update: {payload.subtitle_text[:500]}...")  # log first 500 chars
    try:
        os.makedirs("outputs", exist_ok=True)
        srt_path = generate_srt_with_line_transitions(payload.subtitle_text, project_id, outputs_dir="outputs")
        project["subtitle_path"] = srt_path
        project["status"] = "subtitles_updated"
        save_projects_db()

        print(f"[DEBUG] Backend saved subtitle_path: {srt_path}")
        print(f"[update_subtitles] project_id={project_id}, new subtitle_path={srt_path}")
        return {
            "message": "Subtitles updated successfully",
            "project_id": project_id,
            "subtitle_path": srt_path,
            "download_url": f"/projects/{project_id}/subtitle-file",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/projects/{project_id}/burned-video-file")
def download_burned_video_file(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    burned_video_path = project.get("burned_video_path")
    if not burned_video_path or not os.path.exists(burned_video_path):
        raise HTTPException(status_code=404, detail="Burned video not found")

    return FileResponse(path=burned_video_path, filename=f"{project_id}-burned.mp4", media_type="video/mp4")