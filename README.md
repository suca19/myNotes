# myNotes

## Backend (TypeScript)

Use the shared Makefile to keep workflows container-only (no host npm):

- Start services:
	- `make up`
- Rebuild and start:
	- `make up-build`
- Type check:
	- `make typecheck`
- Build:
	- `make build`
- Test:
	- `make test`
- Ensure dependencies inside container:
	- `make ensure-deps`
- Health check:
	- `make health`
- View all commands:
	- `make help`

`make typecheck`, `make test`, and `make build` automatically install dependencies inside the API container if they are missing.

Direct Docker commands are still available if needed:

- Dev (Docker, hot reload):
	- `docker compose up -d --build api`
- Type check:
	- `docker compose exec -T api npm run typecheck`
- Build:
	- `docker compose exec -T api npm run build`
- Test:
	- `docker compose exec -T api npm run test`

## Production-style Backend Run (compiled dist)

- `make prod-up`

or

- `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api`

This override removes bind mounts for the API container and starts the compiled `dist` server.
