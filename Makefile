COMPOSE ?= docker compose
API_SERVICE ?= api

.PHONY: help up up-build down restart ps logs health api-sh ensure-deps typecheck test build prod-up prod-down

help:
	@echo "Container-only workflows (no host npm):"
	@echo "  make up         - Start dev services"
	@echo "  make up-build   - Rebuild and start dev services"
	@echo "  make down       - Stop dev services"
	@echo "  make restart    - Restart dev services"
	@echo "  make ps         - Show service status"
	@echo "  make logs       - Tail API logs"
	@echo "  make health     - Check API health endpoint"
	@echo "  make api-sh     - Open shell in API container"
	@echo "  make ensure-deps - Install API deps in container if missing"
	@echo "  make typecheck  - Run backend typecheck in container"
	@echo "  make test       - Run backend tests in container"
	@echo "  make build      - Build backend in container"
	@echo "  make prod-up    - Start API in prod-style mode (compiled dist)"
	@echo "  make prod-down  - Stop prod-style services"

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) down
	$(COMPOSE) up -d

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f --tail 100 $(API_SERVICE)

health:
	curl -fsS http://localhost:3000/api/health

api-sh:
	$(COMPOSE) exec $(API_SERVICE) sh

ensure-deps:
	$(COMPOSE) exec -T $(API_SERVICE) sh -lc "command -v tsc >/dev/null 2>&1 || npm install"

typecheck: ensure-deps
	$(COMPOSE) exec -T $(API_SERVICE) npm run typecheck

test: ensure-deps
	$(COMPOSE) exec -T $(API_SERVICE) npm run test

build: ensure-deps
	$(COMPOSE) exec -T $(API_SERVICE) npm run build

prod-up:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-down:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml down
