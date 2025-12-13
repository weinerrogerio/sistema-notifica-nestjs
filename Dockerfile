# 1. Imagem base (Node.js leve)
FROM node:22-alpine

# 2. Definir diretório de trabalho dentro do container
WORKDIR /usr/src/app

# 3. Copiar apenas os arquivos de dependência primeiro (para cache)
COPY package*.json ./

# 4. Instalar dependências
RUN npm install

# 5. Copiar o resto do código fonte
COPY . .

# 6. Buildar a aplicação (NestJS -> JS na pasta dist)
RUN npm run build

# --- INÍCIO DAS ALTERAÇÕES PARA O ENTRYPOINT ---

# 7. Copiar o script de entrada para o container
COPY docker-entrypoint.sh /usr/src/app/

# 8. Dar permissão de execução ao script
# Isso é essencial para que o Docker possa rodá-lo
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# 9. Definir o PONTO DE ENTRADA principal do container
# Este é o primeiro script que será executado. Ele se encarregará de
# rodar o seed e depois chamar o servidor NestJS.
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# --- FIM DAS ALTERAÇÕES PARA O ENTRYPOINT ---


# 10. Expor a porta que a aplicação usa
EXPOSE 3000

# 11. O CMD agora está vazio ou define apenas o que seria o comando padrão.
# Como o ENTRYPOINT já chama "npm run start:prod", o CMD é opcional aqui
# para garantir que apenas o ENTRYPOINT seja o foco.
CMD []