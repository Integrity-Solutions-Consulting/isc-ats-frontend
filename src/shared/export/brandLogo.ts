/** Rasterize the existing SVG at export time; Excel embeds PNG images. */
export async function loadBrandLogo(): Promise<string> {
  const image = new Image();
  image.src = '/brand/logo_integrity_full.svg';
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 780;
  canvas.height = 300;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar el logo del reporte.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
