from app.services.yt_dlp_service import download_youtube_audio
from app.services.whisper_service import transcribe_audio
from app.utils.prompt_generator import generate_prompt
from app.services.llama_service import llama_response
from app.utils.logger_setup import logger


def generate_md_notes(youtube_url: str) -> str:
    logger.info(f"Starting markdown notes generation for URL: {youtube_url}")
    try:
        # Step 1: Download audio
        logger.debug("Downloading audio from YouTube...")
        audio_path = download_youtube_audio(youtube_url)
        logger.info(f"Audio downloaded to: {audio_path}")

        # Step 2: Transcribe audio
        logger.debug("Transcribing audio...")
        transcript = transcribe_audio(audio_path)
        logger.info("Transcription completed.")

        # Step 3: Generate prompt
        logger.debug("Generating prompt for Llama3...")
        prompt = generate_prompt(transcript, references=[youtube_url])
        logger.info("Prompt generated.")

        # Step 4: Get response from Llama3
        logger.debug("Getting response from Llama3...")
        markdown_notes = llama_response(prompt)
        logger.info("Received response from Llama3.")

        # Step 5: Write to file
        # logger.debug("Writing markdown notes to file...")
        # _, file_name = write_to_file(markdown_notes, file_ext="md")
        # logger.info(f"Markdown notes written to file: {file_name}")

        return markdown_notes
    except Exception as e:
        logger.error(f"Error generating markdown notes: {e}", exc_info=True)
        raise
