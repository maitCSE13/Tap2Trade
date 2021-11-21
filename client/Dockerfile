FROM node:14 AS builder

LABEL version="1.0"
LABEL description="This is the base docker image for the Tap2Trade s frontend react app."
LABEL maintainer = ["tap2trade11@gmail.com", "govind,meq752dhingra@gmail.com"]

WORKDIR /app

COPY . .
RUN npm install
RUN yarn build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/build .

CMD [ "nginx", "-g", "daemon off;"]

