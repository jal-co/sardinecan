import { LABEL_HEIGHT, LABEL_WIDTH, svgDataUrl } from "./label.ts"

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(
        new Error(
          "Could not read this image. Use a PNG, JPG, WebP, or self-contained SVG.",
        ),
      )
    image.src = url
  })
}

export async function rasterizeSvg(svg: string) {
  const image = await loadImage(svgDataUrl(svg))
  const canvas = document.createElement("canvas")
  canvas.width = LABEL_WIDTH
  canvas.height = LABEL_HEIGHT
  const context = canvas.getContext("2d")
  if (!context)
    throw new Error("Your browser could not create the label canvas.")
  context.drawImage(image, 0, 0)
  return canvas
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else
        reject(
          new Error(
            "The image could not be exported. Try a smaller export size.",
          ),
        )
    }, "image/png"),
  )
}

export async function uploadLabel(file: File) {
  if (file.size > 12 * 1024 * 1024)
    throw new Error("Choose an image smaller than 12 MB.")
  if (!/\.(png|jpe?g|webp|svg)$/i.test(file.name))
    throw new Error("Choose a PNG, JPG, WebP, or SVG label.")
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    if (image.naturalWidth * image.naturalHeight > 64_000_000)
      throw new Error("Choose an image smaller than 64 megapixels.")
    const canvas = document.createElement("canvas")
    canvas.width = LABEL_WIDTH
    canvas.height = LABEL_HEIGHT
    const context = canvas.getContext("2d")
    if (!context)
      throw new Error("Your browser could not create the label canvas.")
    const scale = Math.max(
      LABEL_WIDTH / image.naturalWidth,
      LABEL_HEIGHT / image.naturalHeight,
    )
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    context.drawImage(
      image,
      (LABEL_WIDTH - width) / 2,
      (LABEL_HEIGHT - height) / 2,
      width,
      height,
    )
    return { url: canvas.toDataURL("image/png"), name: file.name }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
