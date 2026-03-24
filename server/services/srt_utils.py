import os
from datetime import timedelta
from pathlib import Path
from typing import List, Dict


def _format_timestamp(seconds: float) -> str:
    # Use rounded milliseconds and safe carry-over from 999 -> next second.
    total_ms = int(round(seconds * 1000))
    if total_ms < 0:
        total_ms = 0

    hours = total_ms // (3600 * 1000)
    remainder = total_ms % (3600 * 1000)
    minutes = remainder // (60 * 1000)
    remainder = remainder % (60 * 1000)
    secs = remainder // 1000
    milliseconds = remainder % 1000

    return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"


def validate_srt_segments(segments: List[Dict]):
    if not segments:
        return

    prev_end = -1.0
    for seg in segments:
        start = float(seg.get('start', 0.0))
        end = float(seg.get('end', 0.0))

        if end < start:
            raise ValueError(f"Invalid SRT segment: end ({end}) is before start ({start})")
        if end == start:
            end = start + 0.100
            seg['end'] = end

        if prev_end > start:
            raise ValueError(f"Invalid SRT ordering: segment starts at {start} before previous end {prev_end}")

        prev_end = end


def write_srt_segments(segments: List[Dict], project_id: str, outputs_dir: str = 'outputs') -> str:
    os.makedirs(outputs_dir, exist_ok=True)
    srt_path = os.path.join(outputs_dir, f"{project_id}.srt")

    with open(srt_path, 'w', encoding='utf-8') as f:
        index = 1
        for seg in segments:
            start_time = float(seg.get('start', 0.0))
            end_time = float(seg.get('end', 0.0))
            text = seg.get('text', '').replace('\r', '').strip()

            if not text:
                continue

            if end_time <= start_time:
                end_time = start_time + 0.100

            f.write(f"{index}\n")
            f.write(f"{_format_timestamp(start_time)} --> {_format_timestamp(end_time)}\n")
            f.write(f"{text}\n\n")
            index += 1

    return srt_path


def parse_srt_to_segments(srt_text: str) -> List[Dict]:
    """Parse SRT text into segments list."""
    segments = []
    blocks = srt_text.strip().split('\n\n')
    for block in blocks:
        lines = block.split('\n')
        if len(lines) < 3:
            continue
        index = int(lines[0])
        timestamp_line = lines[1]
        start_str, end_str = timestamp_line.split(' --> ')
        start = _parse_timestamp(start_str)
        end = _parse_timestamp(end_str)
        text = '\n'.join(lines[2:])
        segments.append({
            'index': index,
            'start': start,
            'end': end,
            'text': text
        })
    return segments


def _parse_timestamp(ts_str: str) -> float:
    """Parse SRT timestamp to seconds."""
    hours, minutes, secs_millis = ts_str.split(':')
    secs, millis = secs_millis.split(',')
    total_seconds = int(hours) * 3600 + int(minutes) * 60 + int(secs) + int(millis) / 1000
    return total_seconds


def _wrap_text_to_lines(text: str, max_chars: int = 35) -> List[str]:
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]

    for word in words[1:]:
        if len(current) + 1 + len(word) <= max_chars:
            current += ' ' + word
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def generate_srt_from_words(segments: List[Dict], project_id: str, outputs_dir: str = 'outputs') -> str:
    # Word-level, time-aligned subtitles in progressive text mode.
    os.makedirs(outputs_dir, exist_ok=True)
    srt_path = os.path.join(outputs_dir, f"{project_id}.srt")

    total_cues = 0
    with open(srt_path, 'w', encoding='utf-8') as f:
        global_index = 1
        for seg_idx, segment in enumerate(segments):
            words = segment.get('words') or []
            segment_end = float(segment.get('end', 0.0))

            print(f"[SRT_DEBUG] Segment {seg_idx}: {len(words)} words, end={segment_end}")

            if words:
                # Build cumulative line as words appear, with each cue running until next word start.
                for idx, w in enumerate(words):
                    word_start = float(w.get('start', 0.0))
                    # next boundary should be the start of next word, else segment_end
                    if idx + 1 < len(words):
                        next_start = float(words[idx + 1].get('start', word_start + 0.2))
                    else:
                        next_start = max(segment_end, word_start + 0.2)

                    if next_start <= word_start:
                        next_start = word_start + 0.2

                    cumulative_text = ' '.join([x.get('text', '').strip() for x in words[: idx + 1] if x.get('text', '').strip()])
                    if not cumulative_text:
                        continue

                    f.write(f"{global_index}\n")
                    f.write(f"{_format_timestamp(word_start)} --> {_format_timestamp(next_start)}\n")
                    f.write(f"{cumulative_text}\n\n")
                    global_index += 1
                    total_cues += 1
            else:
                # Fallback: full segment line if no word-level timestamps.
                start_time = float(segment.get('start', 0.0))
                end_time = float(segment.get('end', start_time + 0.5))
                text = segment.get('text', '').replace('\r', '').strip()
                if text:
                    if end_time <= start_time:
                        end_time = start_time + 0.5
                    print(f"[SRT_DEBUG] Segment {seg_idx}: fallback mode (no words), text='{text[:50]}...'")
                    f.write(f"{global_index}\n")
                    f.write(f"{_format_timestamp(start_time)} --> {_format_timestamp(end_time)}\n")
                    f.write(f"{text}\n\n")
                    global_index += 1
                    total_cues += 1

    print(f"[SRT_DEBUG] Total cues written: {total_cues}")
    return srt_path


def generate_srt_from_segments(segments: List[Dict], project_id: str, outputs_dir: str = 'outputs') -> str:
    os.makedirs(outputs_dir, exist_ok=True)
    srt_path = os.path.join(outputs_dir, f"{project_id}.srt")

    with open(srt_path, 'w', encoding='utf-8') as f:
        global_index = 1
        for segment in segments:
            start_time = segment['start']
            end_time = segment['end']
            text = segment['text'].replace('\r', '').strip()

            raw_lines = [line.strip() for line in text.split('\n') if line.strip()]
            lines = []
            for raw_line in raw_lines:
                if len(raw_line) <= 35:
                    lines.append(raw_line)
                else:
                    lines.extend(_wrap_text_to_lines(raw_line, max_chars=35))

            if not lines:
                continue

            if len(lines) == 1:
                start = _format_timestamp(start_time)
                end = _format_timestamp(end_time)
                f.write(f"{global_index}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{lines[0]}\n\n")
                global_index += 1
            else:
                # Multi-line: sequential timing inside segment
                duration = max(end_time - start_time, 0.1)
                line_duration = duration / len(lines)
                for i, line in enumerate(lines):
                    line_start = start_time + i * line_duration
                    line_end = min(start_time + (i + 1) * line_duration, end_time)
                    f.write(f"{global_index}\n")
                    f.write(f"{_format_timestamp(line_start)} --> {_format_timestamp(line_end)}\n")
                    f.write(f"{line}\n\n")
                    global_index += 1

    return srt_path


def generate_srt_with_line_transitions(srt_text: str, project_id: str, outputs_dir: str = 'outputs') -> str:
    """Generate SRT from edited SRT text while preserving original cue timing."""
    segments = parse_srt_to_segments(srt_text)
    validate_srt_segments(segments)
    return write_srt_segments(segments, project_id, outputs_dir)
