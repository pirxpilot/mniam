check: lint test

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome check --fix

test:
	node --test --test-concurrency 1 test/*.js

.PHONY: test
.PHONY: check
