#!/bin/sh

echo "--- INICIANDO CONTAINER ---"

# 1. Tenta rodar o seed usando a versão JAVASCRIPT compilada (Muito mais leve e rápido)
# O NestJS geralmente compila 'src/seeds/admin-user.seed.ts' para 'dist/seeds/admin-user.seed.js'
SEED_JS_PATH="dist/seeds/admin-user.seed.js"

echo "Verificando seed compilado em: $SEED_JS_PATH"

if [ -f "$SEED_JS_PATH" ]; then
    echo "✅ Seed compilado encontrado! Executando modo leve (node)..."
    node "$SEED_JS_PATH"
else
    echo "⚠️ Seed compilado não encontrado em $SEED_JS_PATH."
    echo "Tentando fallback para o comando npm run seed:admin (Pode consumir muita memória)..."
    npm run seed:admin
fi

# Verifica o status do comando anterior (seja o node direto ou o npm)
if [ $? -ne 0 ]; then
    echo "❌ FALHA NO SEED: O script de criação de admin falhou."
    echo "O servidor continuará a inicialização, mas o usuário admin pode não existir."
else
    echo "✅ Seed executado com sucesso ou usuário já existente."
fi

# 2. Inicia a aplicação NestJS
echo "🚀 Iniciando servidor NestJS..."
npm run start:prod