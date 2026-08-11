// normalmap.js
// Utility to compute and render normal map from a height field (h(x,z))

function computeNormalMap(heightField, width, height, scale) {
  // heightField: Float32Array or 2D array, width x height
  // Returns: Uint8ClampedArray (RGB normal map)
  const normalMap = new Uint8ClampedArray(width * height * 4);
  for (let y = 1; y < height - 1; ++y) {
    for (let x = 1; x < width - 1; ++x) {
      const hL = heightField[(y * width) + (x - 1)];
      const hR = heightField[(y * width) + (x + 1)];
      const hD = heightField[((y + 1) * width) + x];
      const hU = heightField[((y - 1) * width) + x];
      // Central differences
      const dx = (hR - hL) * scale;
      const dz = (hD - hU) * scale;
      // Normal vector
      let nx = -dx, ny = 2.0, nz = -dz;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len; ny /= len; nz /= len;
      // Map [-1,1] to [0,255]
      const r = Math.round((nx * 0.5 + 0.5) * 255);
      const g = Math.round((ny * 0.5 + 0.5) * 255);
      const b = Math.round((nz * 0.5 + 0.5) * 255);
      const idx = (y * width + x) * 4;
      normalMap[idx] = r;
      normalMap[idx + 1] = g;
      normalMap[idx + 2] = b;
      normalMap[idx + 3] = 255;
    }
  }
  return normalMap;
}

function drawNormalMap(ctx, normalMap, width, height) {
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(normalMap);
  ctx.putImageData(imageData, 0, 0);
}

// Export for use in main script
window.computeNormalMap = computeNormalMap;
window.drawNormalMap = drawNormalMap;
