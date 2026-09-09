export const SLICE_COUNT = 3

const MIN_SLICE_WIDTH = 300
const MIN_ASPECT = 1
const NARROW_ASPECT = 1.3
const WIDE_ASPECT = 3

export function validateScreenshot({ width, height }) {
  const aspect = width / height
  const errors = []
  const warnings = []

  if (width < MIN_SLICE_WIDTH * SLICE_COUNT) {
    errors.push(`Too small. Each third would be under ${MIN_SLICE_WIDTH}px wide.`)
  }

  if (aspect < MIN_ASPECT) {
    errors.push('Use a wide screenshot. This one is taller than it is wide.')
  } else if (aspect < NARROW_ASPECT) {
    warnings.push('Almost square. X may crop the top and bottom of each third.')
  }

  if (aspect > WIDE_ASPECT) {
    warnings.push('Very wide. X may show a grid instead of a carousel.')
  }

  return { ok: errors.length === 0, errors, warnings, aspect }
}

export async function sliceIntoThirds(image) {
  const sliceWidth = Math.floor(image.width / SLICE_COUNT)
  const leftover = image.width - sliceWidth * SLICE_COUNT
  const startX = Math.floor(leftover / 2)

  const slices = []
  for (let index = 0; index < SLICE_COUNT; index++) {
    const canvas = document.createElement('canvas')
    canvas.width = sliceWidth
    canvas.height = image.height
    const context = canvas.getContext('2d')
    const sourceX = startX + index * sliceWidth
    context.drawImage(image, sourceX, 0, sliceWidth, image.height, 0, 0, sliceWidth, image.height)
    slices.push({ blob: await toPngBlob(canvas), width: sliceWidth, height: image.height })
  }
  return slices
}

function toPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))), 'image/png')
  })
}
