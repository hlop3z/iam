from .app import app


def hello() -> str:
    return "Hello from backend-fastapi!"


__all__ = ["app", "hello"]
