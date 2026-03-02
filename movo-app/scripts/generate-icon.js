/**
 * Generates assets/icon.png and assets/adaptive-icon.png
 * using the MOVO "M" brand mark.
 * Run:  node scripts/generate-icon.js
 */
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

function drawMark(ctx, x0, y0, size, color) {
    const s = size / 100;

    // Left slab
    const left = [
        [13,77], [13,23], // control flow — we'll use bezier per segment
    ];

    ctx.fillStyle = color;

    // Left slab path
    ctx.beginPath();
    ctx.moveTo((13)*s+x0, (77)*s+y0);
    ctx.bezierCurveTo((13)*s+x0,(86)*s+y0, (19)*s+x0,(92)*s+y0, (28)*s+x0,(92)*s+y0);
    ctx.lineTo((34)*s+x0, (92)*s+y0);
    ctx.bezierCurveTo((43)*s+x0,(92)*s+y0, (47)*s+x0,(86)*s+y0, (47)*s+x0,(77)*s+y0);
    ctx.lineTo((47)*s+x0, (62)*s+y0);
    ctx.bezierCurveTo((47)*s+x0,(53)*s+y0, (40)*s+x0,(47)*s+y0, (34)*s+x0,(47)*s+y0);
    ctx.bezierCurveTo((40)*s+x0,(47)*s+y0, (47)*s+x0,(41)*s+y0, (47)*s+x0,(32)*s+y0);
    ctx.lineTo((47)*s+x0, (23)*s+y0);
    ctx.bezierCurveTo((47)*s+x0,(14)*s+y0, (43)*s+x0,(8)*s+y0, (34)*s+x0,(8)*s+y0);
    ctx.lineTo((28)*s+x0, (8)*s+y0);
    ctx.bezierCurveTo((19)*s+x0,(8)*s+y0, (13)*s+x0,(14)*s+y0, (13)*s+x0,(23)*s+y0);
    ctx.closePath();
    ctx.fill();

    // Right slab (mirror)
    ctx.beginPath();
    ctx.moveTo((87)*s+x0, (77)*s+y0);
    ctx.bezierCurveTo((87)*s+x0,(86)*s+y0, (81)*s+x0,(92)*s+y0, (72)*s+x0,(92)*s+y0);
    ctx.lineTo((66)*s+x0, (92)*s+y0);
    ctx.bezierCurveTo((57)*s+x0,(92)*s+y0, (53)*s+x0,(86)*s+y0, (53)*s+x0,(77)*s+y0);
    ctx.lineTo((53)*s+x0, (62)*s+y0);
    ctx.bezierCurveTo((53)*s+x0,(53)*s+y0, (60)*s+x0,(47)*s+y0, (66)*s+x0,(47)*s+y0);
    ctx.bezierCurveTo((60)*s+x0,(47)*s+y0, (53)*s+x0,(41)*s+y0, (53)*s+x0,(32)*s+y0);
    ctx.lineTo((53)*s+x0, (23)*s+y0);
    ctx.bezierCurveTo((53)*s+x0,(14)*s+y0, (57)*s+x0,(8)*s+y0, (66)*s+x0,(8)*s+y0);
    ctx.lineTo((72)*s+x0, (8)*s+y0);
    ctx.bezierCurveTo((81)*s+x0,(8)*s+y0, (87)*s+x0,(14)*s+y0, (87)*s+x0,(23)*s+y0);
    ctx.closePath();
    ctx.fill();
}

function generateIcon(outputPath, canvasSize, bgColor, markColor, markSize) {
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Center the mark
    const offset = (canvasSize - markSize) / 2;
    drawMark(ctx, offset, offset, markSize, markColor);

    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`✅ Generated: ${outputPath} (${canvasSize}x${canvasSize})`);
}

const assetsDir = path.join(__dirname, '..', 'assets');

// icon.png — 1024x1024 (required by Expo for iOS)
generateIcon(path.join(assetsDir, 'icon.png'),       1024, '#000000', '#ffffff', 700);

// adaptive-icon.png — 1024x1024, slightly smaller mark for Android safe zone
generateIcon(path.join(assetsDir, 'adaptive-icon.png'), 1024, '#0A0A0A', '#ffffff', 600);

// favicon.png — 64x64
generateIcon(path.join(assetsDir, 'favicon.png'),     64,   '#000000', '#ffffff', 44);

console.log('\n🎉 All icons generated!');
