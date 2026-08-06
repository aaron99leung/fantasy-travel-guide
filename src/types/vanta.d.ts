declare module 'vanta/dist/vanta.clouds.min' {
  import * as THREE from 'three'
  interface VantaEffect {
    destroy: () => void
  }
  interface CloudsOptions {
    el: HTMLElement | null
    THREE: typeof THREE
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    skyColor?: number
    cloudShadowColor?: number
    sunColor?: number
    sunGlareColor?: number
    speed?: number
  }
  export default function CLOUDS(options: CloudsOptions): VantaEffect
}
