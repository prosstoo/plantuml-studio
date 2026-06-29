export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}

export async function svgToPng(
  svg: string,
  options: { scale?: number; background?: string } = {},
): Promise<Blob> {
  const { scale = 2, background = '#ffffff' } = options

  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const svgEl = doc.documentElement

  let width = parseFloat(svgEl.getAttribute('width') || '800')
  let height = parseFloat(svgEl.getAttribute('height') || '600')

  const viewBox = svgEl.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number)
    if (parts.length === 4) {
      width = parts[2]
      height = parts[3]
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Не удалось создать canvas context')
  }

  ctx.scale(scale, scale)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  const serialized = new XMLSerializer().serializeToString(svgEl)
  const dataUrl =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Не удалось создать PNG'))
        },
        'image/png',
        1,
      )
    }
    img.onerror = () => reject(new Error('Не удалось загрузить SVG для конвертации'))
    img.src = dataUrl
  })
}

export async function downloadPng(
  svg: string,
  filename: string,
  options?: { scale?: number; background?: string },
): Promise<void> {
  const blob = await svgToPng(svg, options)
  downloadBlob(blob, filename)
}
