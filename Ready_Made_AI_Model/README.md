# AR Background Camera + Matting Model Lab

This project has two parts:

1. A browser camera app with your selected background filters only.
2. A `model_lab` folder for testing stronger matting models: RVM, BackgroundMattingV2, and PP-Matting.

## Browser app

The browser app keeps the person from the camera and replaces the background with the selected image filter.

Important change: when you click the capture button, it now takes a normal photo of the current output. It does not run extra boundary fitting or extra enhancement after capture.

## Run the browser app

Open PowerShell in this folder and run:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Click `Camera On`.

## Files

```text
index.html       Main app page
style.css        App design/theme
app.js           Camera, live segmentation, filters, normal capture
assets/          Your selected filter background images
model_lab/       Offline model-testing workspace for RVM / BackgroundMattingV2 / PP-Matting
```

## Why the browser app still uses MediaPipe

RVM, BackgroundMattingV2, and PP-Matting are heavy deep learning matting models. They usually need PyTorch/PaddlePaddle, model weights, and preferably a GPU. They are not simple drop-in browser scripts like MediaPipe Selfie Segmentation.

So the correct setup is:

- Browser app: simple UI + fast live preview + normal photo capture
- Model lab: test high-accuracy models offline and compare boundary quality

## Model lab

Go to:

```text
model_lab/README_MODEL_LAB.md
```

That folder contains scripts for:

```text
Robust Video Matting
BackgroundMattingV2
PP-Matting / PaddleSeg
```


## Responsive update
This version was updated to work better on desktop, tablets, and phones.

What was improved:
- Uses `100dvh` and safe-area padding for mobile browsers and iPhone notch areas.
- The top buttons, live badge, capture button, and filter carousel resize automatically.
- The filter bar becomes a bottom mobile carousel on phones.
- Landscape mobile screens use a compact side filter bar so the camera view stays visible.
- The result modal scales correctly on small screens.
- JavaScript now resizes the canvas using the real visual viewport, which helps when mobile browser address bars appear/disappear.

For best mobile testing, open the app using localhost or HTTPS, not by double-clicking `index.html`.
