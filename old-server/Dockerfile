FROM python:3.13-alpine

RUN pip install poetry==1.6.1

RUN poetry config virtualenvs.create false

WORKDIR /

COPY ./pyproject.toml ./README.md ./poetry.lock* ./

RUN poetry install  --no-interaction --no-ansi --no-root

COPY ./app ./app

RUN poetry install --no-interaction --no-ansi

EXPOSE 8080

CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8080"]
