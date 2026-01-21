import aiohttp
from typing import Optional, Tuple
import logging
from app.services.storage import StorageService

logger = logging.getLogger(__name__)

class DocumentDownloader:
    def __init__(self, storage_service: StorageService = None):
        self.storage = storage_service or StorageService()

    async def download(self, url: str) -> Tuple[Optional[bytes], Optional[str]]:
        """
        Download document from URL. 
        Supports http(s):// and internal:// schemes.
        Returns (content, content_type) or (None, None) on failure.
        """
        try:
            if url.startswith("internal://"):
                # Handle internal storage
                path = url.replace("internal://", "")
                content = await self.storage.download(path)
                # Guess content type or store it with file metadata? 
                # For now assuming PDF as that's the primary use case, or rely on file extension
                content_type = "application/pdf" 
                if path.endswith(".json"):
                    content_type = "application/json"
                elif path.endswith(".html"):
                    content_type = "text/html"
                
                return content, content_type

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    if response.status != 200:
                        logger.error(f"Failed to download {url}: {response.status}")
                        return None, None
                    
                    content_type = response.headers.get('Content-Type', '').lower()
                    content = await response.read()
                    
                    if len(content) > 5 * 1024 * 1024: # 5MB limit
                         logger.warning(f"Document {url} exceeds size limit")
                         return None, None
                         
                    return content, content_type
        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return None, None
