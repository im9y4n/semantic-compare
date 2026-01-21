import uuid
import json
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.models import Document, Version, Execution
from app.services.downloader import DocumentDownloader
from app.services.extractor import TextExtractor
from app.services.normalizer import TextNormalizer
from app.services.analysis import AnalysisEngine
from app.services.storage import StorageService

logger = logging.getLogger(__name__)

class PipelineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.storage = StorageService()
        self.downloader = DocumentDownloader(self.storage)
        self.extractor = TextExtractor()
        self.normalizer = TextNormalizer()
        self.analysis = AnalysisEngine()


    async def process_document(self, document_id: uuid.UUID, execution_id: uuid.UUID = None):
        logger.info(f"Processing document {document_id}")
        
        # Fetch document
        doc = await self.session.get(Document, document_id)
        if not doc:
            logger.error(f"Document {document_id} not found")
            return

        # 1. Download
        content, content_type = await self.downloader.download(doc.url)
        if not content:
            logger.error(f"Failed to download {doc.url}")
            return # Update execution status?

        # 2. Extract
        if "pdf" in content_type:
            segments = self.extractor.extract_from_pdf(content)
        else:
            segments = self.extractor.extract_from_html(content)
            
        # 3. Normalize
        normalized_segments = self.normalizer.normalize(segments)
        
        # 4. Storage (Raw & Extracted)
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        base_path = f"{doc.application_name}/{doc.name}/{timestamp}"
        
        await self.storage.upload(f"{base_path}/original.pdf", content, content_type) # Assuming PDF
        
        extracted_json = json.dumps(normalized_segments)
        await self.storage.upload(f"{base_path}/extracted.json", extracted_json.encode(), "application/json")

        # 5. Analysis & Versioning
        # Get previous version
        stmt = select(Version).where(Version.document_id == document_id).order_by(desc(Version.timestamp)).limit(1)
        result = await self.session.execute(stmt)
        prev_version = result.scalar_one_or_none()
        
        # Compute Embeddings (for ALL segments)
        texts = [s["normalized_text"] for s in normalized_segments if not s.get("ignored")]
        embeddings = self.analysis.compute_embeddings(texts)
        
        # Save Embeddings
        embeddings_json = json.dumps(embeddings)
        embeddings_path = f"{base_path}/embeddings.json"
        await self.storage.upload(embeddings_path, embeddings_json.encode(), "application/json")
        
        # Semantic Score
        semantic_score = 0.0
        if prev_version and prev_version.embeddings_path:
            try:
                prev_emb_content = await self.storage.download(prev_version.embeddings_path)
                if prev_emb_content:
                    prev_embeddings = json.loads(prev_emb_content)
                    
                    if embeddings and prev_embeddings:
                         # Calculate mean embedding for document-level comparison
                         # (Averaging all segment embeddings into one vector)
                         import numpy as np
                         curr_mean = np.mean(embeddings, axis=0).tolist()
                         prev_mean = np.mean(prev_embeddings, axis=0).tolist()
                         
                         semantic_score = self.analysis.compute_semantic_similarity(curr_mean, prev_mean)
            except Exception as e:
                logger.warning(f"Failed to compute semantic score: {e}")

        
        # Save Version
        version = Version(
            document_id=document_id,
            gcs_path=f"{base_path}/original.pdf",
            content_hash=str(hash(extracted_json)), # Simple hash
            semantic_score=semantic_score,
            execution_id=execution_id,
            extracted_text_path=f"{base_path}/extracted.json",
            embeddings_path=embeddings_path
        )
        self.session.add(version)
        await self.session.commit()
        
        logger.info(f"Processed document {document_id}, created version {version.id}")
