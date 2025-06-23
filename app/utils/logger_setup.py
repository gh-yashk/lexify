import logging
import os


def setup_logger(name: str = "app", level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.propagate = False

    log_file_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "logs")
    )
    os.makedirs(log_file_dir, exist_ok=True)
    log_file_path = os.path.join(log_file_dir, f"{name}.log")

    if not logger.handlers:
        logger.setLevel(level)

        file_handler = logging.FileHandler(log_file_path, mode="a", encoding="utf-8")
        console_handler = logging.StreamHandler()

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger


logger = setup_logger()
