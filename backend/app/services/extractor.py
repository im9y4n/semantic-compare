import pdfplumber
import io
import logging
import datetime
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TextExtractor:
    def extract_from_pdf(self, content: bytes, progress_callback=None) -> List[Dict[str, Any]]:
        """
        Extract text from PDF bytes. Returns a list of segments (paragraphs/pages).
        """
        def log_debug(msg):
            with open("debug_trace.log", "a") as f:
                f.write(f"[EXTRACTOR] {datetime.datetime.utcnow()} - {msg}\n")
        
        log_debug("Entered extract_from_pdf")
        segments = []
        try:
            log_debug(f"Opening PDF content (size: {len(content)})")
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                total_pages = len(pdf.pages)
                log_debug(f"PDF Opened. Total pages: {total_pages}")
                print(f"DEBUG: Extractor started, pages={total_pages}")
                for i, page in enumerate(pdf.pages):
                    # Progress log: 
                    # If < 20 pages, log every page.
                    # Else log every 10 pages or 10%.
                    should_log = (total_pages < 20) or (i % 10 == 0) or (i == total_pages - 1)
                    
                    if progress_callback and should_log:
                         print(f"DEBUG: Calling callback for page {i+1}")
                         progress_callback(f"Extracting page {i+1}/{total_pages}...")
                    
                    text = page.extract_text()
                    text = page.extract_text()
                    if text:
                        # Split by paragraphs (double newline)
                        paragraphs = text.split('\n\n')
                        for p in paragraphs:
                            if p.strip():
                                segments.append({
                                    "page": i + 1,
                                    "text": p.strip(),
                                    "type": "paragraph"
                                })
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
        
        # Fallback to OCR if no text found and tesseract is available
        if not segments:
            segments = self.extract_with_ocr(content)

        return segments

    def extract_with_ocr(self, content: bytes) -> List[Dict[str, Any]]:
        """
        Extract text using OCR (Tesseract) via pdf2image and pytesseract.
        """
        segments = []
        try:
            from pdf2image import convert_from_bytes
            import pytesseract
            
            try:
                # Check if tesseract is available
                pytesseract.get_tesseract_version()
            except pytesseract.TesseractNotFoundError:
                logger.warning("Tesseract not found. OCR skipped. Please install tesseract-ocr.")
                return []

            images = convert_from_bytes(content)
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                if text:
                    paragraphs = text.split('\n\n')
                    for p in paragraphs:
                        if p.strip():
                            segments.append({
                                "page": i + 1,
                                "text": p.strip(),
                                "type": "ocr_paragraph"
                            })
        except ImportError:
             logger.warning("pdf2image or pytesseract not installed.")
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            
        return segments

    def extract_from_html(self, content: bytes) -> List[Dict[str, Any]]:
        # Placeholder for HTML extraction (BeautifulSoup)
        # TODO: Implement HTML to PDF conversion or direct extraction
        return []
