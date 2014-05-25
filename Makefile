all: lint test

include node_modules/make-jshint/index.mk
include node_modules/make-test/index.mk

.PHONY: all
