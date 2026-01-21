from app.core.config import settings

print(f"Raw BACKEND_CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
print("Stringified origins:")
for origin in settings.BACKEND_CORS_ORIGINS:
    print(f"'{str(origin)}'")
