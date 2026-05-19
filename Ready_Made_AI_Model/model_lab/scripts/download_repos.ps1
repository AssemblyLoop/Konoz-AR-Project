# Run this from the model_lab folder in PowerShell.
# It downloads the official source code repositories, not the large model weights.

mkdir repos -ErrorAction SilentlyContinue
cd repos

if (!(Test-Path RobustVideoMatting)) {
  git clone https://github.com/PeterL1n/RobustVideoMatting.git
}

if (!(Test-Path BackgroundMattingV2)) {
  git clone https://github.com/PeterL1n/BackgroundMattingV2.git
}

if (!(Test-Path PaddleSeg)) {
  git clone https://github.com/PaddlePaddle/PaddleSeg.git
}

Write-Host "Repos downloaded. Now download the required model weights from each official repo README."
