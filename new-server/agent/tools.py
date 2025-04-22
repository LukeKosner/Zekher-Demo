"""This module provides example tools for web scraping and search functionality.

It includes a basic Tavily search function (as an example)

These tools are intended as free examples to get started. For production use,
consider implementing more robust and specialized tools tailored to your needs.
"""

from typing import Any, Callable, List, Optional, cast

from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import UpstashVectorStore
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import InjectedToolArg, create_retriever_tool
from langchain_openai import OpenAIEmbeddings
from typing_extensions import Annotated
from langchain.retrievers import MultiVectorRetriever
from langchain.storage import InMemoryByteStore

from langchain.retrievers import ParentDocumentRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.storage import LocalFileStore
from langchain.storage._lc_store import create_kv_docstore

from agent.configuration import Configuration

load_dotenv()

# TODO: Figure out if configuration is needed
# configuration = Configuration.from_runnable_config(config)

vectorstore = UpstashVectorStore(namespace="v11", embedding=True)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)

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


retriever_tool = create_retriever_tool(
    retriever,
    "retriever",
    "Use this tool to answer questions about specific individuals or themes in the context of the Holocaust. You must use this tool if you are asked about a specific individual in the context of the Holocaust. Return your answer in plaintext; no XML, markdown, or other formatting is necessary.",
)


TOOLS: List[Callable[..., Any]] = [retriever_tool]
