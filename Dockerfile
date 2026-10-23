FROM node:20

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Assets dos jogos primeiro: camada grande, mas que quase nunca muda.
COPY dist/public ./dist/public

# Resto do codigo compilado: camada pequena, muda a cada deploy.
COPY dist/*.js dist/classes dist/controllers dist/database dist/functions dist/jsons dist/logger ./dist/

EXPOSE 8080

CMD ["node", "dist/indexprod.js"]