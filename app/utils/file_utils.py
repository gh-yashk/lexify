import os
import uuid
from app.utils.logger_setup import logger


def get_file_path(file_name: str, path: str = None) -> str:
    """Retrieve the absolute path of a file.
    Args:
        file_name (str): The name of the file to retrieve.
        path (str, optional): The directory path where the file is located. Defaults to None.
    Returns:
        str: The absolute path of the file.
    Raises:
        FileNotFoundError: If the specified file or directory does not exist.
    """
    if path is None:
        path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "files")
        )
        logger.debug(f"No path provided. Using default path: {path}")
    file_path = os.path.join(path, file_name)
    logger.debug(f"Constructed file path: {file_path}")
    if not os.path.exists(path):
        logger.error(f"Directory not found: {path}")
        raise FileNotFoundError(f"Directory not found: {path}")
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"File not found: {file_path}")
    logger.info(f"File found: {file_path}")
    return file_path


def write_to_file(
    content: str, path: str = None, file_ext: str = "txt"
) -> tuple[str, str]:
    """Write content to a file with a unique name.
    Args:
        content (str): The content to write to the file.
        path (str, optional): The directory path where the file will be created. Defaults to None.
        file_ext (str, optional): The file extension for the new file. Defaults to "txt".
    Returns:
        tuple[str, str]: A tuple containing the absolute path of the created file and its name
    Raises:
        Exception: If there is an error writing to the file.
    """
    file_name = f"{uuid.uuid4()}.{file_ext}"
    if path is None:
        path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "files")
        )
        logger.debug(f"No path provided. Using default path: {path}")
    try:
        os.makedirs(path, exist_ok=True)
        logger.debug(f"Ensured directory exists: {path}")
        file_path = os.path.join(path, file_name)
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        logger.info(f"Wrote content to file: {file_path}")
        return file_path, file_name
    except Exception as e:
        logger.error(f"Failed to write to file: {e}")
        raise
