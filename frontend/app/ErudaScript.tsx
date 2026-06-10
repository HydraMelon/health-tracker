'use client'

import Script from 'next/script'

export default function ErudaScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/eruda"
      onLoad={() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).eruda.init()
      }}
    />
  )
}
