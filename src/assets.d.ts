/** Static assets Vite serves as URLs. (Ambient file — keep import-free so it stays global.) */
declare module '*.wav' {
  const src: string;
  export default src;
}
