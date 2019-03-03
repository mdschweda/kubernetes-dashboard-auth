FROM node:10 as build-stage

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm i --only=prod --prefix dist . && npm i

COPY . .

RUN npx tsc && npm run build-frontend

# ---

FROM node:10

WORKDIR /app
COPY --from=build-stage /app/dist .

EXPOSE 443

CMD [ "node", "/app/index.js" ]
