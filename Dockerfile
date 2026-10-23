FROM node:20

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Assets dos jogos primeiro: camada grande, mas que quase nunca muda.
COPY dist/public ./dist/public

# Resto do codigo compilado, pasta a pasta (camada pequena, muda a cada deploy).
COPY dist/*.js ./dist/
COPY dist/classes ./dist/classes
COPY dist/controllers ./dist/controllers
COPY dist/database ./dist/database
COPY dist/functions ./dist/functions
COPY dist/jsons ./dist/jsons
COPY dist/logger ./dist/logger

EXPOSE 8080

CMD ["node", "dist/indexprod.js"]