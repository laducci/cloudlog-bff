#!/usr/bin/env bash
# docker build / login / push no padrão pedido no enunciado.
# Uso: ./scripts/docker-publish.sh <usuario-dockerhub> [tag]
set -euo pipefail
USER_DH="${1:?usuario do Docker Hub}"; TAG="${2:-v1}"
IMAGE="docker.io/${USER_DH}/cloudlog-bff:${TAG}"
docker build --platform linux/amd64 -t "$IMAGE" .
docker login docker.io
docker push "$IMAGE"
