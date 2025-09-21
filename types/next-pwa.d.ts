declare module 'next-pwa' {
    import { NextConfig } from 'next';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextPwa: (config: any) => (nextConfig: NextConfig) => NextConfig;
    export default nextPwa;
}
