# Thirds

Split a wide screenshot into three tall images. Post them to X in order and the carousel shows them as one seamless panorama.

Everything runs in the browser. There is no backend and no build step.

## Run locally

```sh
npx serve public
```

## Docker

```sh
docker build -t thirds .
docker run -p 8080:80 thirds
```

The image serves the app on port 80.

## Deploy

```sh
buzz deploy ./public --site thirds
```
