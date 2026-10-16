// A tiny ZIP maker (no compression), so members can download their whole scrapbook with no extra tools.
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const enc = new TextEncoder();

// files: [{ name, data: Uint8Array }]
export function makeZip(files) {
  const chunks = [], central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true); local.setUint16(12, dosDate, true); local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true);
    cd.setUint16(12, dosTime, true); cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

export async function dataUrlToBytes(url) {
  if (url.startsWith('data:')) {
    const b64 = url.split(',')[1]; const bin = atob(b64); const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8;
  }
  const r = await fetch(url); return new Uint8Array(await r.arrayBuffer());
}
export const textBytes = (s) => enc.encode(s);

// Save a Blob to the phone. Falls back to opening it when downloads are blocked.
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
