FROM node:20.9.0-alpine3.17

ENV TZ="Europe/Paris"

RUN apk add --no-cache curl

RUN mkdir -p /opt/app

WORKDIR /opt/app

COPY package.json package-lock.json .env ./
RUN npm install
COPY . .

EXPOSE 5655

CMD [ "npm", "start"]
