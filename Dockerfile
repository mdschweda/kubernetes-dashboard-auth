FROM node:10 as build-stage

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i
RUN npm i --prefix ./dist --only=prod

COPY src/static dist/static
COPY src tsconfig.json ./
RUN npx tsc

FROM node:10

WORKDIR /app

COPY --from=build-stage /app/dist .

CMD [ "node", "/app/backend/index.js" ]
