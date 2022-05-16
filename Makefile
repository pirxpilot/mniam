all: lint test

include node_modules/make-jshint/index.mk

test:
	@./node_modules/.bin/tape test/*.js

.PHONY: test
.PHONY: all
