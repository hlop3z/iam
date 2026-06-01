import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading dev resources (client JS / HMR) from devices on the LAN,
  // e.g. testing on a phone via http://192.168.x.x:3000. Without this, the
  // page server-renders but never hydrates on those hosts, so interactive
  // components (buttons, the mobile menu) don't respond.
  //
  // Next blocks a bare "*"/"**", so this is the closest "allow any device":
  // each "*" matches one segment, so "*.*.*.*" matches any IPv4 address.
  // Only takes effect in dev (it's a dev-only CSRF guard). Tighten to specific
  // IPs if you'd rather not allow every LAN host.
  allowedDevOrigins: ["*.*.*.*"],
};

export default nextConfig;
