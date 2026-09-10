export function authorizedCron(header: string | null, secret: string | undefined) {
  return !!secret && header === 'Bearer ' + secret;
}
