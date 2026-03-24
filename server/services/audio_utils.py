import os
import subprocess
import uuid
from pathlib import Path


def extract_audio_from_video(video_path: str, outputs_dir: str = 'outputs') -> str:
    """Extracts audio into WAV 16k mono from a video file using ffmpeg."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    os.makedirs(outputs_dir, exist_ok=True)

    input_path = Path(video_path)
    base_name = input_path.stem
    output_path = os.path.join(outputs_dir, f"{base_name}.wav")

    # Use full path to ffmpeg
    ffmpeg_path = r"C:\Users\DELL\OneDrive\Desktop\Subtitle_Generator\client\ffmpeg\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe"

    command = [
        ffmpeg_path,
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(output_path),
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"ffmpeg failed to extract audio: {exc.stderr.decode('utf-8', errors='ignore')}" )

    if not os.path.exists(output_path):
        raise RuntimeError(f"Audio output was not generated: {output_path}")

    return output_path


def burn_subtitles_to_video(video_path: str, subtitle_path: str, outputs_dir: str = 'outputs') -> str:
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    if not os.path.exists(subtitle_path):
        raise FileNotFoundError(f"Subtitle file not found: {subtitle_path}")

    os.makedirs(outputs_dir, exist_ok=True)

    input_path = Path(video_path).resolve()
    # Unique burnt output name to avoid stale caching, and guarantee every burn is fresh.
    output_path = os.path.join(outputs_dir, f"{input_path.stem}-burned-{uuid.uuid4().hex}.mp4")

    subtitle_path_abs = Path(subtitle_path).resolve().as_posix()
    output_path_abs = Path(output_path).resolve().as_posix()
    video_path_abs = input_path.as_posix()

    # ffmpeg subtitles filter on Windows may need colon escaping in drive letter.
    subtitle_filter_path = subtitle_path_abs
    if os.name == 'nt':
        subtitle_filter_path = subtitle_filter_path.replace(':', '\\:')

    ffmpeg_path = r"C:\Users\DELL\OneDrive\Desktop\Subtitle_Generator\client\ffmpeg\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe"

    filter_expr = f"subtitles='{subtitle_filter_path}'"

    command = [
        ffmpeg_path,
        "-y",
        "-i",
        video_path_abs,
        "-vf",
        filter_expr,
        output_path_abs,
    ]

    print(f"[burn_subtitles_to_video] command: {command}")
    print(f"[burn_subtitles_to_video] subtitles file (abs): {subtitle_path_abs}")
    print(f"[burn_subtitles_to_video] filter expr: {filter_expr}")

    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"ffmpeg failed to burn subtitles: {exc.stderr.decode('utf-8', errors='ignore')}")

    if not os.path.exists(output_path):
        raise RuntimeError(f"Burned video output was not generated: {output_path}")

    return output_path
