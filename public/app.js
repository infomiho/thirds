import { validateScreenshot, sliceIntoThirds, SLICE_COUNT } from './slicer.js'

const dropzone = document.getElementById('dropzone')
const fileInput = document.getElementById('file-input')
const report = document.getElementById('report')
const result = document.getElementById('result')
const carousel = document.getElementById('carousel')
const carouselPrev = document.getElementById('carousel-prev')
const carouselNext = document.getElementById('carousel-next')
const postMeta = document.getElementById('post-meta')
const downloads = document.getElementById('downloads')
const downloadAll = document.getElementById('download-all')

let objectUrls = []

dropzone.addEventListener('click', () => fileInput.click())
dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    fileInput.click()
  }
})
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault()
  dropzone.classList.add('is-over')
})
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-over'))
dropzone.addEventListener('drop', (event) => {
  event.preventDefault()
  dropzone.classList.remove('is-over')
  handleFile(event.dataTransfer.files[0])
})
fileInput.addEventListener('change', () => {
  handleFile(fileInput.files[0])
  fileInput.value = ''
})
document.addEventListener('paste', (event) => {
  if (event.target.isContentEditable) return
  const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith('image/'))
  if (imageItem) handleFile(imageItem.getAsFile())
})

carouselPrev.addEventListener('click', () => scrollCarousel(-1))
carouselNext.addEventListener('click', () => scrollCarousel(1))
carousel.addEventListener('scroll', updateCarouselNav)
window.addEventListener('resize', updateCarouselNav)
downloadAll.addEventListener('click', () => {
  downloads.querySelectorAll('a[download]').forEach((link, index) => {
    setTimeout(() => link.click(), index * 300)
  })
})

async function handleFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    return showReport({ errors: ['That file is not an image.'], warnings: [] })
  }

  let image
  try {
    image = await createImageBitmap(file)
  } catch {
    return showReport({ errors: ['Could not decode that image. PNG or JPEG works best.'], warnings: [] })
  }

  const verdict = validateScreenshot(image)
  showReport(verdict, image)
  if (!verdict.ok) {
    result.hidden = true
    return
  }

  const slices = await sliceIntoThirds(image)
  image.close()
  renderResult(slices, baseName(file.name))
}

function showReport({ errors, warnings, ok }, image) {
  report.replaceChildren()
  if (image) {
    const dims = document.createElement('p')
    dims.className = 'report-dims'
    dims.textContent = describeDimensions(image)
    report.append(dims)
  }
  const notes = [
    ...errors.map((text) => ({ text, className: 'is-error' })),
    ...warnings.map((text) => ({ text, className: 'is-warning' })),
  ]
  if (ok && notes.length === 0) {
    notes.push({ text: 'Looks good. This will slice cleanly.', className: 'is-ok' })
  }
  const list = document.createElement('ul')
  for (const note of notes) {
    const item = document.createElement('li')
    item.className = note.className
    item.textContent = note.text
    list.append(item)
  }
  report.append(list)
  report.hidden = false
}

function describeDimensions({ width, height }) {
  const aspect = (width / height).toFixed(2)
  const sliceWidth = Math.floor(width / SLICE_COUNT)
  return `${width} × ${height} · ${aspect}:1 · each third ${sliceWidth} × ${height}`
}

function renderResult(slices, name) {
  revokeObjectUrls()
  carousel.replaceChildren()
  downloads.replaceChildren()

  slices.forEach((slice, index) => {
    const url = URL.createObjectURL(slice.blob)
    objectUrls.push(url)
    const fileName = `${name}-${index + 1}of${SLICE_COUNT}.png`

    carousel.append(buildCarouselItem({ url, index }))

    downloads.append(buildDownloadCard({ url, fileName, slice, index }))
  })

  carousel.style.setProperty('--slice-aspect', slices[0].width / slices[0].height)
  postMeta.innerHTML = `${formatPostTime(new Date())} · <strong>386</strong> Views`
  result.hidden = false
  carousel.scrollTo({ left: 0 })
  requestAnimationFrame(updateCarouselNav)
  result.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function buildCarouselItem({ url, index }) {
  const item = document.createElement('div')
  item.className = 'carousel-item'
  const image = document.createElement('img')
  image.src = url
  image.alt = `Third ${index + 1} of ${SLICE_COUNT}`
  item.append(image)
  return item
}

function buildDownloadCard({ url, fileName, slice, index }) {
  const card = document.createElement('div')
  card.className = 'download-card'

  const thumb = document.createElement('img')
  thumb.src = url
  thumb.alt = ''

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.textContent = `Download ${index + 1}`

  const dims = document.createElement('small')
  dims.textContent = `${slice.width} × ${slice.height}`

  card.append(thumb, link, dims)
  return card
}

function scrollCarousel(direction) {
  const item = carousel.firstElementChild
  const step = item ? item.offsetWidth + parseFloat(getComputedStyle(carousel).gap) : carousel.clientWidth
  carousel.scrollBy({ left: direction * step, behavior: 'smooth' })
}

function updateCarouselNav() {
  const maxScroll = carousel.scrollWidth - carousel.clientWidth
  carouselPrev.hidden = carousel.scrollLeft <= 1
  carouselNext.hidden = carousel.scrollLeft >= maxScroll - 1
}

function formatPostTime(date) {
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${time} · ${day}`
}

function baseName(fileName) {
  const withoutExtension = (fileName || 'screenshot').replace(/\.[^.]+$/, '')
  return withoutExtension.replace(/[^\w-]+/g, '-') || 'screenshot'
}

function revokeObjectUrls() {
  objectUrls.forEach((url) => URL.revokeObjectURL(url))
  objectUrls = []
}
