declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        Compiler: new () => {
          compileImageTargets: (images: HTMLImageElement[], onProgress: (progress: number) => void) => Promise<void>
          exportData: () => ArrayBuffer
        }
      }
    }
  }
}

function waitForMINDAR(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      if (window.MINDAR?.IMAGE?.Compiler) resolve()
      else if (Date.now() - start > timeoutMs) reject(new Error('MindAR gagal dimuat. Coba refresh halaman.'))
      else setTimeout(check, 100)
    }
    check()
  })
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
  markerFiles: File[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const mod = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'
  ) as { Compiler?: new () => InstanceType<Window['MINDAR']['IMAGE']['Compiler']>; default?: { Compiler?: new () => InstanceType<Window['MINDAR']['IMAGE']['Compiler']> } }

  const Compiler = mod.Compiler ?? mod.default?.Compiler

  if (!Compiler) {
    await waitForMINDAR()
  }

  const FinalCompiler = Compiler ?? window.MINDAR.IMAGE.Compiler
  const images = await Promise.all(markerFiles.map(fileToImage))
  const compiler = new FinalCompiler()

  await compiler.compileImageTargets(images, (progress) => {
    onProgress?.(Math.round(progress * 100))
  })

  const buffer = compiler.exportData()
  return new Blob([buffer], { type: 'application/octet-stream' })
}
