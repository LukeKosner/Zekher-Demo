import os
from dotenv import load_dotenv
from tqdm import tqdm
from langchain_community.vectorstores import UpstashVectorStore
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import LocalFileStore
from langchain.storage._lc_store import create_kv_docstore

# Load environment variables
load_dotenv()

# Step 1: Load documents
print("Loading documents...")
loader = DirectoryLoader("data/sources", glob="**/*.txt", loader_cls=TextLoader)
docs = loader.load()
print(f"Loaded {len(docs)} documents")

if len(docs) == 0:
    print("No documents found in the specified directory")
    exit(1)

# Step 2: Ensure the directory for storing doc_ids exists
os.makedirs("data/vectorstore", exist_ok=True)

# Step 3: Initialize text splitters for parent and child documents
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)

# Step 4: Initialize vector store
print("Initializing vector store...")
vectorstore = UpstashVectorStore(embedding=True, namespace="v11")

# Step 5: Initialize document store
print("Setting up document store...")
fs = LocalFileStore("./data/vectorstore/kv")
store = create_kv_docstore(fs)

# Step 6: Initialize the ParentDocumentRetriever with the correct configuration
print("Setting up retriever...")
retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,  # This is crucial for proper functioning
)

# # Step 7: Add documents to the vector store without specifying IDs
# print("Adding documents to vector store...")
# try:
#     # Process in smaller batches to avoid overwhelming the system
#     batch_size = 10
#     for i in range(0, len(docs), batch_size):
#         end = min(i + batch_size, len(docs))
#         batch = docs[i:end]
#         print(
#             f"Processing batch {i//batch_size + 1}/{(len(docs) + batch_size - 1)//batch_size} ({len(batch)} documents)"
#         )
#         # Let the retriever generate IDs internally
#         retriever.add_documents(batch)

#     print("Documents successfully added to vector store.")
# except Exception as e:
#     print(f"Error adding documents to vector store: {e}")
#     exit(1)

# Debugging: Verify storage
stored_doc_ids = list(store.yield_keys())
print(f"Total documents in parent store: {len(stored_doc_ids)}")

# Add a test document
print("\nTesting parent-child relationship...")
test_doc = Document(page_content="This is a test document mentioning Rita Benmayor.")
retriever.add_documents([test_doc])  # No explicit ID

# Step 8: Test a similarity search
query = "rita"
print(f"\nPerforming similarity search for query: '{query}'")
try:
    sub_docs = vectorstore.similarity_search(query, k=3)
    if sub_docs:
        print(f"Found {len(sub_docs)} matching documents")
        for i, doc in enumerate(sub_docs[:3], 1):
            print(f"\nMatch {i}:")
            print("-" * 40)
            print(doc.page_content)
            print(f"Has parent ID: {'Yes' if doc.metadata.get('parent_id') else 'No'}")
            print("-" * 40)
    else:
        print("No similar documents found.")
except Exception as e:
    print(f"Error during vector search: {e}")

# Step 9: Retrieve documents using the ParentDocumentRetriever
print(f"\nRetrieving documents with context for query: '{query}'")
try:
    retrieved_docs = retriever.invoke(query)
    if retrieved_docs:
        print(f"Retrieved {len(retrieved_docs)} documents with context:")
        for i, doc in enumerate(retrieved_docs[:3], 1):
            print(f"\nResult {i}:")
            print("=" * 50)
            print(doc.page_content)
            print("=" * 50)
    else:
        print("No documents retrieved.")
except Exception as e:
    print(f"Error during document retrieval: {e}")

print("\nProcess completed.")
