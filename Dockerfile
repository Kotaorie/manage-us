FROM node:20-alpine

# Ajouter les dépendances nécessaires
RUN apk add --no-cache openssl musl

WORKDIR /app
COPY package.json /app
COPY . /app

RUN npm install

CMD ["npm", "run", "dev"]
