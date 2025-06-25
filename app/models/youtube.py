from pydantic import BaseModel


class YouTubeURL(BaseModel):
    url: str
