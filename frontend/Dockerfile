FROM node:10-alpine AS build
WORKDIR /user/src/app
RUN apk add --update \
  python \
  make \
  g++
COPY package*.json ./
RUN npm i
COPY src/ ./
RUN npm run build

FROM nginx
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/mime.types /etc/nginx/conf/mime.types
COPY config/server.key /etc/nginx/ssl/server.key
COPY config/server.crt /etc/nginx/ssl/server.crt
COPY --from=build /user/src/app/dist/* /var/www/
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]