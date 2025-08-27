import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.models.youtube import YouTubeURL
from app.services.youtube_notes_service import generate_md_notes
from app.utils.logger_setup import logger

app = FastAPI(
    title="YouTube to Markdown Notes API",
    description="Generate structured Markdown notes from YouTube videos using transcription and summarization.",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/", include_in_schema=False)
async def serve_index() -> FileResponse:
    """
    Serves the index.html file for the frontend.
    """
    index_path = os.path.join("app", "template", "index.html")
    if not os.path.exists(index_path):
        logger.error("index.html not found at app/templates/")
        raise HTTPException(status_code=404, detail="Index file not found")
    return FileResponse(index_path)


@app.post("/generate-notes/", summary="Generate Markdown Notes")
async def generate_notes(data: YouTubeURL, request: Request):
    """
    Accepts a YouTube URL, processes the video, and returns the AI-generated notes as raw markdown.
    """
    logger.info(f"Received request to generate notes for URL: {data.url}")

    try:
        md_notes = generate_md_notes(str(data.url))

        if not md_notes or not md_notes.strip():
            logger.warning(f"No notes generated for URL: {data.url}")
            raise HTTPException(status_code=500, detail="No notes generated")

        logger.info(f"Successfully generated notes for URL: {data.url}")
        return {
            "youtube_url": data.url,
            "md_notes": md_notes,
        }

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(
            f"Unexpected error while generating notes for {data.url}: {e}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred while generating notes."},
        )
