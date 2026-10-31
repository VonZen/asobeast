FROM python:3.12-slim
ARG SOURCE_SHA=7b16a02aea78a1f55c101f3dfbb622894b01a041
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN python -m pip install --no-cache-dir uv
RUN mkdir /src && cd /src && git init -q && git remote add origin https://github.com/overx-ai/aso-light.git && git fetch --depth 1 origin "${SOURCE_SHA}" && git checkout -q --detach FETCH_HEAD
WORKDIR /src/backend
RUN uv sync --frozen --no-dev
ENV PATH="/src/backend/.venv/bin:${PATH}" PYTHONUNBUFFERED=1
EXPOSE 8002
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8002"]
