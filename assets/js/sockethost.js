const hostname =
  window.location.hostname + window.location.hostname.endsWith('.net')
    ? ''
    : ':3000';
const socketHost = window.location.protocol + '//' + hostname;
