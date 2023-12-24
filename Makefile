check: lint test

include node_modules/make-jshint/index.mk

test:
	node --test --test-concurrency 1 test/*.js

.PHONY: test
.PHONY: check
