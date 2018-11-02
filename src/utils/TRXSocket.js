class TRXSocket extends WebSocket {
  constructor (url) {
    super(url)
    this.instanceName = undefined
    this.timer = undefined
  }

  name (name) {
    if (name === undefined && this.instanceName) {
      return this.instanceName
    } else if (name !== this.instanceName) {
      this.instanceName = name
    }
    return this.instanceName
  }
}

export default TRXSocket
