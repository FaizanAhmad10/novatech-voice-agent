"""
RAG-based Voice Agent for NovaTech Solutions
Uses PDF documents to answer company-specific queries
"""
import os
from pathlib import Path
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import HumanMessage, AIMessage
from pypdf import PdfReader
from datetime import datetime
import numpy as np

# Lazy load heavy imports
_embeddings_model = None
_faiss_index = None


def get_embeddings_model():
    """Lazy load the embeddings model."""
    global _embeddings_model
    if _embeddings_model is None:
        from sentence_transformers import SentenceTransformer
        print("Loading embedding model (first time may take a moment)...")
        _embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _embeddings_model


class SimpleVectorStore:
    """Simple FAISS-based vector store."""
    
    def __init__(self):
        self.chunks = []
        self.embeddings = None
        self.index = None
    
    def add_documents(self, chunks: list[str]):
        """Add document chunks and create embeddings."""
        import faiss
        
        self.chunks = chunks
        model = get_embeddings_model()
        
        print(f"Creating embeddings for {len(chunks)} chunks...")
        self.embeddings = model.encode(chunks, show_progress_bar=True)
        
        # Create FAISS index
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(self.embeddings).astype('float32'))
        print("Vector store ready!")
    
    def search(self, query: str, k: int = 4) -> list[str]:
        """Search for similar chunks."""
        if self.index is None:
            return []
        
        model = get_embeddings_model()
        query_embedding = model.encode([query])
        
        distances, indices = self.index.search(
            np.array(query_embedding).astype('float32'), k
        )
        
        results = []
        for idx in indices[0]:
            if idx < len(self.chunks):
                results.append(self.chunks[idx])
        
        return results


def load_pdfs_from_folder(folder_path: Path) -> list[str]:
    """Load all PDFs from a folder and split into chunks."""
    all_text = []
    
    pdf_files = list(folder_path.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        return []
    
    print(f"Found {len(pdf_files)} PDF file(s)")
    
    for pdf_file in pdf_files:
        try:
            print(f"Loading: {pdf_file.name}")
            reader = PdfReader(str(pdf_file))
            
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text and text.strip():
                    all_text.append(text.strip())
            
            print(f"  Extracted {len(reader.pages)} pages")
        except Exception as e:
            print(f"  Error loading {pdf_file.name}: {e}")
    
    # Split into smaller chunks
    chunks = []
    for text in all_text:
        # Split by paragraphs, then combine into ~500 char chunks
        paragraphs = text.split('\n\n')
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            if len(current_chunk) + len(para) < 500:
                current_chunk += " " + para if current_chunk else para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para
        
        if current_chunk:
            chunks.append(current_chunk)
    
    print(f"Created {len(chunks)} text chunks")
    return chunks


class VoiceAgent:
    """RAG-based Voice Agent for NovaTech Solutions using LangChain with Groq LLM."""
    
    def __init__(self):
        print("=" * 50)
        print("Initializing NovaTech Solutions Voice Agent...")
        print("=" * 50)
        
        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name=os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
            temperature=0.7,
        )
        
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=10,
            return_messages=True,
        )
        
        # Initialize vector store
        self.vector_store = SimpleVectorStore()
        self._load_documents()
        
        self.system_prompt = """You are a voice assistant exclusively for NovaTech Solutions. 
You ONLY answer questions related to NovaTech Solutions - its services, products, policies, and company information.

STRICT RULES:
1. You ONLY answer questions about NovaTech Solutions
2. If a question is NOT related to NovaTech Solutions (like general knowledge, weather, math, other companies, personal questions, etc.), you MUST respond with: "I can only answer questions related to NovaTech Solutions. Is there anything about our company, services, or products I can help you with?"
3. Use the provided company context to answer NovaTech-related questions accurately
4. If information is not in the context but the question IS about NovaTech, say: "I don't have that specific information about NovaTech Solutions. Can I help you with something else about our company?"
5. Keep responses concise and suitable for voice (1-3 sentences)
6. Be professional and helpful
7. Current date/time: {current_time}

COMPANY CONTEXT:
{context}

Remember: ONLY answer NovaTech Solutions related questions. Politely decline all other topics."""

    def _load_documents(self):
        """Load PDF documents from data folder."""
        data_dir = Path(__file__).parent / "data"
        
        if not data_dir.exists():
            data_dir.mkdir(parents=True)
            print(f"\nCreated data directory: {data_dir}")
            print("⚠️  Please add PDF files to 'backend/data/' folder and restart.\n")
            return
        
        chunks = load_pdfs_from_folder(data_dir)
        
        if chunks:
            self.vector_store.add_documents(chunks)
            print("\n✅ RAG system initialized successfully!\n")
        else:
            print("\n⚠️  No documents loaded. Add PDFs to 'backend/data/' folder.\n")

    def _get_relevant_context(self, query: str) -> str:
        """Retrieve relevant context from vector store."""
        results = self.vector_store.search(query, k=4)
        
        if not results:
            return "No company documents have been loaded yet."
        
        return "\n\n".join(results)

    def _get_system_prompt(self, context: str) -> str:
        """Get system prompt with current time and context."""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return self.system_prompt.format(current_time=current_time, context=context)
    
    async def process_message(self, message: str) -> str:
        """Process a user message and return the agent's response."""
        try:
            # Get relevant context from documents
            context = self._get_relevant_context(message)
            
            # Build messages list
            messages = [
                {"role": "system", "content": self._get_system_prompt(context)}
            ]
            
            # Add conversation history
            history = self.memory.load_memory_variables({})
            if "chat_history" in history:
                for msg in history["chat_history"]:
                    if isinstance(msg, HumanMessage):
                        messages.append({"role": "user", "content": msg.content})
                    elif isinstance(msg, AIMessage):
                        messages.append({"role": "assistant", "content": msg.content})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Get response from LLM
            response = await self.llm.ainvoke(messages)
            assistant_message = response.content
            
            # Save to memory
            self.memory.save_context(
                {"input": message},
                {"output": assistant_message}
            )
            
            return assistant_message
            
        except Exception as e:
            print(f"Agent error: {e}")
            return "I apologize, but I'm having trouble processing your request. Please try again."
    
    def clear_memory(self):
        """Clear the conversation memory."""
        self.memory.clear()
