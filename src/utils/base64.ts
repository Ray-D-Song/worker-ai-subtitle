function safeEncode(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  } else {
    return decodeURIComponent(atob(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  }
}

function safeDecode(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8');
  } else {
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
}

export {
  safeEncode,
  safeDecode
}