import uuid
import json
import logging
import asyncio
import functools
import copy
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
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
        self._lock = asyncio.Lock()


    async def _update_step(self, execution_id: uuid.UUID, step_name: str, status: str, details: str = None, log_msg: str = None):
        """Helper to update a specific step in the execution record."""
        # Note: This requires fetching, modifying, and saving the execution.
        # Check if we have an active session for this, or use the main session.
        if not execution_id:
            return

        async with self._lock:
            # Use a separate session for status updates to avoid transaction conflicts with main flow
            async with AsyncSessionLocal() as status_session:
                # Lock the row to prevent race conditions during read-modify-write of JSONB
                stmt = select(Execution).where(Execution.id == execution_id).with_for_update()
                result = await status_session.execute(stmt)
                execution = result.scalar_one_or_none()
                
                if execution:
                    logger.info(f"Updating step {step_name} -> {status} (Details: {details})")
                    
                    # Append to main logs if requested
                    if log_msg:
                        timestamp = datetime.utcnow().strftime("%H:%M:%S")
                        prefix = f"[{timestamp}] [{step_name}]"
                        new_entry = f"{prefix} {log_msg}\n"
                        execution.logs = (execution.logs or "") + new_entry

                    if log_msg:
                        timestamp = datetime.utcnow().strftime("%H:%M:%S")
                        prefix = f"[{timestamp}] [{step_name}]"
                        new_entry = f"{prefix} {log_msg}\n"
                        execution.logs = (execution.logs or "") + new_entry

                    # Deepcopy to ensure SQLAlchemy detects the mutation to the JSON structure
                    current_steps = copy.deepcopy(list(execution.steps)) if execution.steps else []
                    
                    # Find or append
                    found = False
                    for step in current_steps:
                        if step["name"] == step_name:
                            step["status"] = status
                            if details:
                                step["details"] = details
                            if status == "running" and not step.get("start_time"):
                                step["start_time"] = datetime.utcnow().isoformat()
                            if status in ["completed", "failed"]:
                                step["end_time"] = datetime.utcnow().isoformat()
                            found = True
                            break
                    
                    if not found:
                        new_step = {
                            "name": step_name, 
                            "status": status, 
                            "start_time": datetime.utcnow().isoformat() if status == "running" else None
                        }
                        if details:
                            new_step["details"] = details
                        current_steps.append(new_step)
                    
                    # Force update (SQLAlchemy sometimes doesn't detect JSON mutation)
                    execution.steps = list(current_steps) 
                    await status_session.commit()

    async def process_document(self, document_id: uuid.UUID, execution_id: uuid.UUID = None):
        logger.info(f"Processing document {document_id}")
        
        # Initialize Steps
        if execution_id:
            await self._update_step(execution_id, "Initialization", "completed", "Pipeline started")

        # Fetch document
        doc = await self.session.get(Document, document_id)
        if not doc:
            logger.error(f"Document {document_id} not found")
            if execution_id:
                 await self._update_step(execution_id, "Initialization", "failed", "Document not found")
            return

        # 1. Download
        if execution_id: await self._update_step(execution_id, "Download", "running")
        
        logger.info(f"Starting download for {doc.url}")
        content, content_type = await self.downloader.download(doc.url)
        if not content:
            err = f"Failed to download {doc.url}"
            logger.error(err)
            if execution_id: await self._update_step(execution_id, "Download", "failed", err)
            return

        if execution_id: await self._update_step(execution_id, "Download", "completed", f"Size: {len(content)} bytes")

        # 2. Extract
        if execution_id: await self._update_step(execution_id, "Extraction", "running")
        logger.info(f"Starting extraction for content type {content_type}, size: {len(content)} bytes")
        
        loop = asyncio.get_running_loop()
        
        try:
            if "pdf" in content_type:
                def progress_bridge(msg):
                    # Bridge to async loop
                    with open("debug_trace.log", "a") as f:
                        f.write(f"[BRIDGE] {msg}\n")
                    
                    if execution_id:
                        future = asyncio.run_coroutine_threadsafe(
                             self._update_step(execution_id, "Extraction", "running", msg, log_msg=msg),
                             loop
                        )
                        def log_error(f):
                            try:
                                f.result()
                                with open("debug_trace.log", "a") as log: log.write("[BRIDGE] Update Success\n")
                            except Exception as e:
                                with open("debug_trace.log", "a") as log: log.write(f"[BRIDGE] Update FAILED: {e}\n")
                        future.add_done_callback(log_error)

                # Offload heavy PDF extraction
                segments = await loop.run_in_executor(
                    None, 
                    functools.partial(self.extractor.extract_from_pdf, progress_callback=progress_bridge), 
                    content
                )
            else:
                segments = self.extractor.extract_from_html(content)
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            if execution_id: await self._update_step(execution_id, "Extraction", "failed", str(e))
            raise e
            
        logger.info(f"Extraction complete. Found {len(segments)} segments.")
        if execution_id: await self._update_step(execution_id, "Extraction", "completed", f"Segments: {len(segments)}")
            
        # 3. Normalize
        normalized_segments = self.normalizer.normalize(segments)
        
        # 4. Storage (Raw & Extracted)
        if execution_id: await self._update_step(execution_id, "Storage", "running")
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        base_path = f"{doc.application_name}/{doc.name}/{timestamp}"
        
        await self.storage.upload(f"{base_path}/original.pdf", content, content_type) # Assuming PDF
        
        extracted_json = json.dumps(normalized_segments)
        await self.storage.upload(f"{base_path}/extracted.json", extracted_json.encode(), "application/json")
        if execution_id: await self._update_step(execution_id, "Storage", "completed", f"Path: {base_path}")

        # 5. Analysis & Versioning
        logger.info("Starting analysis...")
        
        # Get previous version
        stmt = select(Version).where(Version.document_id == document_id).order_by(desc(Version.timestamp)).limit(1)
        result = await self.session.execute(stmt)
        prev_version = result.scalar_one_or_none()
        
        # KEYWORD FILTERING LOGIC
        if execution_id: await self._update_step(execution_id, "Filtering", "running")
        
        relevant_pages = set()
        matched_pages = set()
        
        if doc.keywords and len(doc.keywords) > 0:
            logger.info(f"Filtering with keywords: {doc.keywords}")
            
            # 1. Find matches
            for seg in normalized_segments:
                text_lower = seg["normalized_text"].lower()
                for kw in doc.keywords:
                    if kw.lower() in text_lower:
                        matched_pages.add(seg["page"])
                        break
            
            # 2. Expand Context (+/- 2 pages)
            for p in matched_pages:
                for offset in range(-2, 3): # -2, -1, 0, 1, 2
                    relevant_pages.add(p + offset)
                    
            logger.info(f"Relevant pages: {relevant_pages}")
            if execution_id: await self._update_step(execution_id, "Filtering", "completed", f"Keywords: {doc.keywords}, Matches: {len(matched_pages)}, Context Pages: {len(relevant_pages)}")
        else:
            # If no keywords, ALL pages are relevant
            relevant_pages = None 
            if execution_id: await self._update_step(execution_id, "Filtering", "completed", "No keywords, processing all.")
            
        # Compute Embeddings (ONLY for relevant segments)
        if execution_id: await self._update_step(execution_id, "Embedding", "running")
        
        texts_to_embed = []
        for s in normalized_segments:
            if s.get("ignored"):
                continue
            
            # Check relevance
            if relevant_pages is not None:
                if s["page"] not in relevant_pages:
                    continue
            
            texts_to_embed.append(s["normalized_text"])

        logger.info(f"Embedding {len(texts_to_embed)} segments out of {len(normalized_segments)}")
        
        if texts_to_embed:
             # Offload heavy embedding computation
             embeddings = await loop.run_in_executor(
                 None,
                 self.analysis.compute_embeddings,
                 texts_to_embed
             )
        else:
             embeddings = []
             logger.warning("No relevant segments found for embedding.")
        
        if execution_id: await self._update_step(execution_id, "Embedding", "completed", f"Embedded {len(texts_to_embed)} segments")

        # Save Embeddings
        embeddings_json = json.dumps(embeddings)
        embeddings_path = f"{base_path}/embeddings.json"
        await self.storage.upload(embeddings_path, embeddings_json.encode(), "application/json")
        
        # Semantic Score
        if execution_id: await self._update_step(execution_id, "Scoring", "running")
        semantic_score = 0.0
        if prev_version and prev_version.embeddings_path:
            try:
                prev_emb_content = await self.storage.download(prev_version.embeddings_path)
                if prev_emb_content:
                    prev_embeddings = json.loads(prev_emb_content)
                    logger.info(f"Loaded previous embeddings: {len(prev_embeddings)} segments")
                    
                    if embeddings and prev_embeddings:
                         # Calculate mean embedding for document-level comparison
                         # (Averaging all segment embeddings into one vector)
                         import numpy as np
                         logger.info("Computing current mean...")
                         curr_mean = np.mean(embeddings, axis=0).tolist()
                         logger.info("Computing previous mean...")
                         prev_mean = np.mean(prev_embeddings, axis=0).tolist()
                         
                         logger.info("Computing cosine similarity...")
                         semantic_score = self.analysis.compute_semantic_similarity(curr_mean, prev_mean)
                         logger.info(f"Similarity computed: {semantic_score}")
            except Exception as e:
                logger.error(f"Failed to compute semantic score: {e}", exc_info=True)
                if execution_id: await self._update_step(execution_id, "Scoring", "failed", str(e))
        
        with open("debug_trace.log", "a") as f: f.write(f"[DEBUG] Reached Scoring Log. Score: {semantic_score}\n")
        logger.info(f"Completion of Scoring step. Score: {semantic_score}")
        if execution_id: await self._update_step(execution_id, "Scoring", "completed", f"Score: {semantic_score}")
        
        # Save Version
        with open("debug_trace.log", "a") as f: f.write(f"[DEBUG] Saving version\n")
        
        # Save Version in separate session to avoid dirtying/commiting the main session (which holds stale Execution)
        async with AsyncSessionLocal() as version_session:
            version = Version(
                document_id=document_id,
                gcs_path=f"{base_path}/original.pdf",
                content_hash=str(hash(extracted_json)), # Simple hash
                semantic_score=semantic_score,
                execution_id=execution_id,
                extracted_text_path=f"{base_path}/extracted.json",
                embeddings_path=embeddings_path
            )
            version_session.add(version)
            await version_session.commit()
        
        logger.info(f"Processed document {document_id}, created version")
