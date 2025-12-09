# 1. Imagem base (Node.js leve)
FROM node:18-alpine

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

# 7. Expor a porta que a aplicação usa (o Render injeta a porta na variável PORT)
EXPOSE 3000

# 8. Comando para iniciar a aplicação em produção
CMD ["npm", "run", "start:prod"]