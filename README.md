# Thirds

Split a wide screenshot into three tall images. Post them to X in order and X shows them side by side, like one wide image.

Everything runs in the browser. There is no backend and no build step.

## Run locally

```sh
npx serve public
```

## OG image

`public/og.png` is a 1200×630 screenshot of `assets/og.html`.

## Deploy

```sh
buzz deploy ./public --site thirds
```
