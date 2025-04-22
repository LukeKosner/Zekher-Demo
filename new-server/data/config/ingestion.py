import os
from dotenv import load_dotenv
from tqdm import tqdm
from langchain_community.vectorstores import UpstashVectorStore
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore, LocalFileStore
from langchain.storage._lc_store import create_kv_docstore

# Load environment variables
load_dotenv()

# Step 1: Load documents
print("Loading documents...")
loader = DirectoryLoader("data/sources", glob="**/*.txt", loader_cls=TextLoader)
docs = loader.load()


# Step 2: Ensure the directory for storing doc_ids exists
os.makedirs("data/vectorstore", exist_ok=True)

# Step 3: Initialize text splitters for parent and child documents
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400)

# Step 4: Initialize vector store (UpstashVectorStore)
vectorstore = UpstashVectorStore(embedding=True, namespace="v10")

# Step 5: Initialize an in-memory document store for efficient retrieval
fs = LocalFileStore("./data/vectorstore/kv")
store = create_kv_docstore(fs)

# Step 6: Initialize the ParentDocumentRetriever with parent-child structure
retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    child_splitter=child_splitter,
)

# Step 7: Add documents to the vector store with progress tracking
print("Adding documents to vector store...")
try:
    retriever.add_documents(docs, ids=None)
    print("Documents successfully added to vector store.")
except Exception as e:
    print(f"Error adding documents to vector store: {e}")
    exit(1)

# Debugging: Verify the number of stored documents in the InMemoryStore
stored_doc_ids = list(store.yield_keys())
print(f"Total documents in store: {len(stored_doc_ids)}")

# Step 8: Perform a similarity search directly on the vector store
query = "rita"
print(f"Performing similarity search for query: '{query}'")
sub_docs = vectorstore.similarity_search(query)

if sub_docs:
    print("Similar document(s) found:")
    for sub_doc in sub_docs[:3]:  # Display up to 3 similar documents for brevity
        print(sub_doc.page_content)
else:
    print("No similar documents found.")

# Step 9: Retrieve documents using the ParentDocumentRetriever
print(f"Retrieving documents for query: '{query}'")
retrieved_docs = retriever.invoke(query)

if retrieved_docs:
    print("Retrieved document content:")
    for retrieved_doc in retrieved_docs[:3]:  # Display up to 3 retrieved documents
        print(retrieved_doc.page_content)
else:
    print("No documents retrieved.")
