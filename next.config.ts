import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.29.48.1"],
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/payment/:path*",
  //       destination: "http://localhost:8081/:path*",
  //     },
  //     {
  //       source: "/api/auth/:path*",
  //       destination: "http://localhost:8082/:path*",
  //     },
  //     {
  //       source: "/api/inventory/:path*",
  //       destination: "http://localhost:8083/:path*",
  //     },
  //     {
  //       source: "/api/order/:path*",
  //       destination: "http://localhost:8084/:path*",
  //     },
  //   ];
  // },
  async rewrites() {
    return [
      {
        source: "/api/payment/:path*",
        destination: "http://100.55.196.2/payment/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://100.55.196.2/auth/:path*",
      },
      {
        source: "/api/inventory/:path*",
        destination: "http://100.55.196.2/inventory/:path*",
      },
      {
        source: "/api/order/:path*",
        destination: "http://100.55.196.2/order/:path*",
      },
    ];
  },
};

export default nextConfig;
