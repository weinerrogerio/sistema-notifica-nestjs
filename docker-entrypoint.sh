#!/bin/sh

# Tenta rodar o seed de administração
echo "Tentando rodar o seed de administrador..."
# O comando é o mesmo definido no seu package.json
# Ele precisa do ambiente Typescript/TS-Node, por isso a chamada completa.
npm run seed:admin

# Verifica o código de saída do comando seed
if [ $? -ne 0 ]; then
    echo "Falha ao rodar o script de seed. Verifique os logs."
    # Não vamos parar o container aqui, mas é bom logar o erro.
fi

# Inicia a aplicação NestJS em modo de produção (CMD anterior)
echo "Iniciando o servidor NestJS..."
npm run start:prod