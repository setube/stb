export const getIpAddress = callback => {
  const myPeerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.qq.com' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  })
  myPeerConnection.createDataChannel('')
  myPeerConnection.createOffer().then(offer => myPeerConnection.setLocalDescription(offer))
  myPeerConnection.onicecandidate = event => {
    if (event.candidate) {
      callback(event.candidate.candidate.split(' ')[4])
    }
  }
}
