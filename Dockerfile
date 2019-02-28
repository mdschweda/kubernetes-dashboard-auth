FROM node:10 as build-stage

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --only=prod --prefix dist .
RUN npm i

COPY . .
RUN npx tsc && npm run build-frontend

FROM node:10

WORKDIR /app

COPY --from=build-stage /app/dist .

CMD [ "node", "/app/index.js" ]
