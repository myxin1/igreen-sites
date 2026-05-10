function stamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(message: string) {
    console.log(`[${stamp()}] INFO  ${message}`);
  },
  warn(message: string) {
    console.warn(`[${stamp()}] WARN  ${message}`);
  },
  error(message: string) {
    console.error(`[${stamp()}] ERROR ${message}`);
  },
};
