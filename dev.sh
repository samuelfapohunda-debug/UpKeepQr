#!/bin/bash
node --require ./server/preload-stripe.cjs --import tsx --watch server/index.ts
