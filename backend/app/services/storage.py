from google.cloud import storage
from minio import Minio
import io
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.use_minio = settings.USE_MINIO
        if self.use_minio:
            self.minio_client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=False
            )
            self.bucket = settings.GCS_BUCKET_NAME
            # Ensure bucket exists
            if not self.minio_client.bucket_exists(self.bucket):
                self.minio_client.make_bucket(self.bucket)
        else:
            self.gcs_client = storage.Client()
            self.bucket = self.gcs_client.bucket(settings.GCS_BUCKET_NAME)

    async def upload(self, path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """
        Upload content to storage. Returns the path/access URL.
        """
        try:
            if self.use_minio:
                self.minio_client.put_object(
                    self.bucket,
                    path,
                    io.BytesIO(content),
                    len(content),
                    content_type=content_type
                )
                return f"s3://{self.bucket}/{path}"
            else:
                blob = self.bucket.blob(path)
                blob.upload_from_string(content, content_type=content_type)
                return f"gs://{settings.GCS_BUCKET_NAME}/{path}"
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise e

    async def download(self, path: str) -> bytes:
        """
        Download content from storage.
        """
        try:
            # Strip protocol if present
            if path.startswith("s3://"):
                path = path.replace(f"s3://{self.bucket}/", "")
            elif path.startswith("gs://"):
                path = path.replace(f"gs://{settings.GCS_BUCKET_NAME}/", "")

            if self.use_minio:
                response = self.minio_client.get_object(self.bucket, path)
                try:
                    return response.read()
                finally:
                    response.close()
                return response.data
            else:
                blob = self.bucket.blob(path)
                return blob.download_as_bytes()
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise e
