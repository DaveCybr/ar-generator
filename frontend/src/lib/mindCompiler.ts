type MindARCompilerInstance = {
  compileImageTargets: (images: HTMLImageElement[], onProgress: (progress: number) => void) => Promise<void>
  exportData: () => ArrayBuffer
}

type MindARModule = {
  Compiler?: new () => MindARCompilerInstance
  default?: { Compiler?: new () => MindARCompilerInstance }
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function compileMindFile(
  markerFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const mod = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'
  ) as MindARModule

  const Compiler = mod.Compiler ?? mod.default?.Compiler
  if (!Compiler) throw new Error('MindAR Compiler tidak ditemukan. Coba refresh halaman.')

  const image = await fileToImage(markerFile)
  const compiler = new Compiler()

  await compiler.compileImageTargets([image], (progress) => {
    onProgress?.(Math.round(progress * 100))
  })

  const buffer = compiler.exportData()
  return new Blob([buffer], { type: 'application/octet-stream' })
}
