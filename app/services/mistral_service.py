import requests
from app.utils.logger_setup import logger


def mistral_response(prompt: str) -> str:
    """Generate a response from the Mistral API using the provided prompt.
    Args:
        prompt (str): The input prompt for the Mistral API.
    Returns:
        str: The response text from the Mistral API.
    Raises:
        RuntimeError: If the request fails or the response is invalid.
    """
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "mistral:7b",
        "prompt": prompt,
        "stream": False,
    }

    logger.debug(f"Sending request to Mistral API at {url} with payload: {payload}")

    try:
        response = requests.post(
            url,
            json=payload,
            # timeout=60
        )
        response.raise_for_status()
        logger.debug(f"Received raw response: {response.text}")

        data = response.json()
        response_text = data.get("response")

        if not response_text:
            logger.warning("Empty response received from Mistral API.")
            raise ValueError("No response text found in the API response.")

        logger.info("Successfully received response from Mistral API.")
        return response_text.strip()

    except requests.exceptions.Timeout:
        logger.error("Request to Mistral API timed out.")
        raise RuntimeError("Request to Mistral API timed out.")

    except requests.exceptions.RequestException as e:
        logger.error(f"Request to Mistral API failed: {e}")
        raise RuntimeError(f"Request to Mistral API failed: {e}")

    except ValueError as ve:
        logger.error(f"Invalid response format: {ve}")
        raise RuntimeError(f"Invalid response format: {ve}")

    except Exception as e:
        logger.exception(
            "Unexpected error occurred while communicating with Mistral API."
        )
        raise RuntimeError(f"An unexpected error occurred: {e}")
