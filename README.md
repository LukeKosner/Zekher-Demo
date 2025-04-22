# Zekher Demo

## Starting the Project

Either use the VSCode command palette and search for `Run Task` or run the following commands in the terminal:

```bash
# Start the old server
cd old-server && poetry run langchain serve
# Start the new server
cd new-server && uv run langgraph dev
# Start the frontend
cd frontend && bun dev
```
