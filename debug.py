from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI()

# Монтируем только статику из папки html в корень
app.mount("/", StaticFiles(directory="static/html", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("debug:app", host="127.0.0.1", port=8000, reload=False)