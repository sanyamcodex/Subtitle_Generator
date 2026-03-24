# Subtitle Generator

A full-stack application for generating subtitles from video files using AI transcription.

## Features

- Upload video files
- Automatic audio extraction using FFmpeg
- AI-powered transcription with Faster Whisper
- SRT subtitle file generation
- Modern web interface with Next.js
- FastAPI backend

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI**: Faster Whisper (OpenAI Whisper)
- **Audio Processing**: FFmpeg

## Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- FFmpeg (automatically installed in project)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health status
- `POST /projects` - Create a new project
- `GET /projects` - List all projects
- `GET /projects/{id}` - Get project details
- `POST /projects/{id}/upload` - Upload video file
- `POST /projects/{id}/generate-subtitles` - Generate subtitles
- `GET /projects/{id}/subtitle-file` - Download SRT file

## Project Structure

```
subtitle-generator/
├── client/          # Next.js frontend
├── server/          # FastAPI backend
│   ├── main.py      # API endpoints
│   ├── services/    # Business logic
│   └── uploads/     # Uploaded files
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License