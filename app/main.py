from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse

from app.models.youtube import YouTubeURL
from app.services.youtube_notes_service import generate_md_notes
from app.utils.file_utils import get_file_path
from app.utils.logger_setup import logger

app = FastAPI(
    title="YouTube to Markdown Notes API",
    description="Generate structured Markdown notes from YouTube videos using transcription and summarization.",
)


@app.get("/", summary="API Usage Information")
def read_root():
    """
    Returns basic usage information and available endpoints.
    """
    return {
        "message": "Welcome to the YouTube to Markdown Notes API",
        "endpoints": {
            "POST /generate-notes/": "Submit a YouTube URL and get a downloadable Markdown file of summarized notes.",
            "GET /download/{file_name}": "Download the previously generated Markdown file using its name.",
        },
        "example_request": {
            "POST /generate-notes/": {
                "body": {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
            }
        },
    }


@app.post("/generate-notes/", summary="Generate Markdown Notes")
async def generate_notes(data: YouTubeURL, request: Request):
    """
    Accepts a YouTube URL, processes the video, and returns the filename and download link for the generated Markdown notes.
    """
    logger.info(f"Received request to generate notes for URL: {data.url}")
    try:
        file_name = generate_md_notes(data.url)
        logger.info(f"Generated notes file: {file_name} for URL: {data.url}")

        # Generate the absolute download URL
        download_url = request.url_for("download_file", file_name=file_name)

        return {
            "youtube_url": data.url,
            "file_name": file_name,
            "download_url": download_url,
        }
    except Exception as e:
        logger.error(f"Error generating notes for URL {data.url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate notes")


@app.get("/download/{file_name}", summary="Download Generated Markdown Note")
def download_file(file_name: str):
    """
    Serves the generated Markdown note file for download.
    """
    logger.info(f"Download requested for file: {file_name}")
    try:
        file_path = get_file_path(file_name)
        logger.debug(f"File path resolved for download: {file_path}")
        return FileResponse(
            path=file_path, filename=file_name, media_type="text/markdown"
        )
    except Exception as e:
        logger.error(f"Error downloading file {file_name}: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail="File not found")
