export class SessionIdExpired extends Error {
  constructor() {
    super()

    this.message = 'session id maybe is expired'
  }
}
