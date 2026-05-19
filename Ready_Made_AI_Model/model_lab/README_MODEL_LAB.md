# Matting Model Lab

This folder is for testing stronger matting models beside the browser demo.

The web app captures a normal photo only. It does not run extra boundary fitting when the capture button is pressed.

## Models included in this lab

1. Robust Video Matting (RVM)
2. BackgroundMattingV2
3. PP-Matting / PaddleSeg matting

The real model weights are not included because they are large and must be downloaded from each official model repository.

## Recommended use

Use the browser app for the UI and fast camera preview.
Use this `model_lab` folder to test model quality on saved images/videos.

## Important model differences

### RVM
Best first choice for your project. It is designed for human video matting and can work without taking a separate clean background image.

### BackgroundMattingV2
Very strong quality, but it needs a clean background image of the same scene without the person. This is not the image filter background. It is the original real background before the person enters the camera.

### PP-Matting
Good for image/human matting experiments, but it requires PaddlePaddle/PaddleSeg setup. It is better used as an offline quality test, not a simple browser-only app.

## Suggested workflow

1. Record a short camera video or save a test image.
2. Put it inside `model_lab/inputs`.
3. Download the official model/repo you want to test.
4. Run the related script in `model_lab/scripts`.
5. Compare the output quality inside `model_lab/outputs`.

