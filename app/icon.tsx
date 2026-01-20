import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 22,
          background: '#B7410E', // Rust Orange (Inverted Background)
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f8f8f8', // Deep Charcoal (Inverted Foreground)
          borderRadius: '4px',
          fontFamily: 'serif',
          fontWeight: 900,
          border: '1px solid #f8f8f8', // Deep Charcoal Border
        }}
      >
        R
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}