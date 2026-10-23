FROM node:20

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY dist ./dist

EXPOSE 8080

CMD ["node", "dist/indexprod.js"]