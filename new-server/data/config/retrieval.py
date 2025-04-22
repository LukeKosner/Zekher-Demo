import json
from tqdm import tqdm
from typing import List
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_community.vectorstores import UpstashVectorStore
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.storage import InMemoryByteStore
from langchain.retrievers import MultiVectorRetriever
from dotenv import load_dotenv
import getpass
import os
import uuid

# Load environment variables
load_dotenv()

if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter API key for OpenAI: ")

# Step 1: Load and split documents
loader = DirectoryLoader(
    "data/sources",
    glob="**/*.txt",
    loader_cls=TextLoader,
)
docs = loader.load()

# Ensure the directory for storing doc_ids exists
os.makedirs("data/vectorstore", exist_ok=True)

# Assign unique IDs to parent documents and save
doc_ids = {str(i): str(uuid.uuid4()) for i in range(len(docs))}
with open("data/vectorstore/doc_ids.json", "w") as f:
    json.dump(doc_ids, f, indent=4)

# Split documents into smaller chunks while retaining parent IDs
text_splitter = RecursiveCharacterTextSplitter(chunk_size=400)
sub_docs = []
for i, doc in enumerate(tqdm(docs, desc="Splitting documents")):
    parent_id = doc_ids[str(i)]  # Retrieve parent doc_id
    doc.metadata["doc_id"] = parent_id  # Add parent ID to metadata
    # Split into smaller chunks
    chunks = text_splitter.split_documents([doc])
    for chunk in chunks:
        chunk.metadata["doc_id"] = parent_id  # Assign parent doc_id to each chunk
    sub_docs.extend(chunks)

# Step 2: Set up vector store and document store
vectorstore = UpstashVectorStore(namespace="v2", embedding=True)
document_store = InMemoryByteStore()
id_key = "doc_id"

# Step 3: Add documents to the retriever
retriever = MultiVectorRetriever(
    vectorstore=vectorstore,
    byte_store=document_store,
    id_key=id_key,
)

# Add parent documents to the document store
retriever.docstore.mset(list(zip(doc_ids.values(), docs)))
print(f"Added {len(docs)} parent documents to the document store.")

# Add sub-document chunks to the vectorstore
retriever.vectorstore.add_documents(sub_docs)
print(f"Added {len(sub_docs)} sub-documents to the vector store.")

# Save retriever configuration for later use
with open("data/vectorstore/retriever_config.json", "w") as f:
    json.dump({"doc_ids": doc_ids, "namespace": "v2", "chunk_size": 400}, f, indent=4)


# Retrieval Example with Enhanced Debugging
def retrieve(query: str):
    print("\nRetrieving sub-documents...")
    sub_doc_results = retriever.vectorstore.similarity_search(query, k=5)

    # Log sub-document results
    if not sub_doc_results:
        print("No sub-documents found for the query.")
        return

    for result in sub_doc_results:
        print(f"Sub-document: {result.page_content}\n")

    print("\nRetrieving parent documents...")
    # Extract parent document IDs from sub-documents
    parent_ids = {result.metadata["doc_id"] for result in sub_doc_results}
    print(f"Parent IDs extracted: {parent_ids}")

    # Retrieve parent documents by ID
    # Step 3: Add documents to the retriever with corrected metadata and logging


parent_docs = []
for i, doc in enumerate(docs):
    parent_id = doc_ids[str(i)]  # Retrieve the corresponding doc_id
    doc.metadata["doc_id"] = parent_id  # Set the doc_id in metadata
    parent_docs.append(doc)

# Add parent documents to the document store
retriever.docstore.mset(list(zip(doc_ids.values(), parent_docs)))
print(f"Added {len(parent_docs)} parent documents to the document store.")


# Enhanced Retrieval Function
def retrieve(query: str):
    print("\nRetrieving sub-documents...")
    sub_doc_results = retriever.vectorstore.similarity_search(query, k=5)

    # Log sub-document results
    if not sub_doc_results:
        print("No sub-documents found for the query.")
        return

    for result in sub_doc_results:
        print(f"Sub-document: {result.page_content}\n")

    print("\nRetrieving parent documents...")
    # Extract parent document IDs from sub-documents
    parent_ids = {result.metadata["doc_id"] for result in sub_doc_results}
    print(f"Parent IDs extracted: {parent_ids}")

    # Retrieve parent documents by ID
    parent_docs = retriever.docstore.mget(list(parent_ids))
    for parent_id, parent_doc in zip(parent_ids, parent_docs):
        if parent_doc:
            print(
                f"Parent document (ID: {parent_doc.metadata['doc_id']}): {parent_doc.page_content[:500]}...\n"
            )
        else:
            print(
                f"Parent document with ID {parent_id} could not be retrieved. Check the docstore."
            )

    # Debug: Validate that documents are correctly stored and retrievable
    for parent_id in parent_ids:
        test_doc = retriever.docstore.mget([parent_id])
        if test_doc and test_doc[0]:
            print(
                f"\nTest retrieval succeeded for ID {parent_id}:\n{test_doc[0].page_content[:500]}"
            )
        else:
            print(f"\nTest retrieval failed for ID {parent_id}. Document not found.")

retrieve("Who was Rita?")