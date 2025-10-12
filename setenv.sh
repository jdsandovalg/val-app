#!/bin/bash
# setenv.sh — agrega el directorio scripts al PATH temporalmente para este proyecto

export PATH="$(pwd)/scripts:$PATH"
echo "✅ Directorio scripts agregado al PATH temporalmente para este proyecto."

