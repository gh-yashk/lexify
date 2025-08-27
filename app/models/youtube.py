from pydantic import BaseModel, HttpUrl


class YouTubeURL(BaseModel):
    url: HttpUrl
