// Hostinger Node.js entry point.
process.env.NODE_ENV ||= 'production';
await import('./dist/server.cjs');
