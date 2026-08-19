declare module 'omggif' {
  export class GifReader {
    constructor(buf: Uint8Array)
    width: number
    height: number
    numFrames(): number
    decodeAndBlitFrameRGBA(frame: number, out: Uint8Array | Uint8ClampedArray): void
  }
}
