import os
import glob
import uuid
import subprocess

from app.utils.logger_setup import logger


def download_youtube_audio(url: str, output_path: str = None, timeout: int = 60) -> str:
    """Download audio from a YouTube video using yt-dlp.
    Args:
        url (str): The URL of the YouTube video.
        output_path (str, optional): Directory to save the downloaded audio file. Defaults to a 'downloads' directory in the project root.
        timeout (int, optional): Timeout for the download process in seconds. Defaults to 60 seconds.
    Returns:
        str: The path to the downloaded audio file.
    Raises:
        RuntimeError: If the download fails or times out.
    """
    logger.info(f"Starting download for URL: {url}")

    if output_path is None:
        output_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "downloads")
        )

    os.makedirs(output_path, exist_ok=True)
    logger.debug(f"Output directory ensured at: {output_path}")

    unique_id = str(uuid.uuid4())
    output_template = os.path.join(output_path, f"{unique_id}.%(ext)s")
    logger.debug(f"Generated unique output template: {output_template}")

    ydl_cmd = [
        "yt-dlp",
        "-f",
        "bestaudio/best",
        "-o",
        output_template,
        "--no-warnings",
        "--quiet",
        "--extract-audio",
        "--audio-format",
        "wav",
        "--audio-quality",
        "0",
        url,
    ]

    logger.debug(f"Constructed yt-dlp command: {' '.join(ydl_cmd)}")

    try:
        result = subprocess.run(
            ydl_cmd,
            timeout=timeout,
            capture_output=True,
            text=True,
        )
        logger.debug("yt-dlp subprocess completed")

        if result.returncode != 0:
            logger.error(f"yt-dlp error output: {result.stderr.strip()}")
            raise RuntimeError(
                f"Download failed: yt-dlp failed with error: {result.stderr.strip()}"
            )
        logger.info("yt-dlp download succeeded")

    except subprocess.TimeoutExpired:
        logger.error(f"Download timed out after {timeout} seconds for URL: {url}")
        raise RuntimeError(f"Download timed out after {timeout} seconds")

    except Exception as e:
        logger.exception(f"An error occurred during download: {str(e)}")
        raise RuntimeError(f"An error occurred during download: {str(e)}")

    finally:
        remove_partial_downloads(output_path)

    matching_files = glob.glob(os.path.join(output_path, f"{unique_id}.*"))
    if not matching_files:
        logger.error(f"Downloaded file not found in {output_path}")
        raise RuntimeError(f"Downloaded file not found in {output_path}")

    downloaded_file = matching_files[0]
    logger.info(f"Download complete. File saved at: {downloaded_file}")

    return downloaded_file


def remove_partial_downloads(output_path: str = None) -> None:
    """Remove any partial downloads in the specified output directory.
    Args:
        output_path (str, optional): Directory to check for partial downloads. Defaults to a 'downloads' directory in the project root.
    """
    if output_path is None:
        output_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "downloads")
        )

    logger.info(f"Removing partial downloads from: {output_path}")
    for file in glob.glob(os.path.join(output_path, "*.part")):
        try:
            os.remove(file)
            logger.debug(f"Removed partial file: {file}")
        except Exception as e:
            logger.error(f"Failed to remove partial file {file}: {str(e)}")
