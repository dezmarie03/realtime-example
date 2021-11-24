/*
  Utlity to convert binary received from a WebSocket
  connection into a JSON string
*/
export default function parseMessage(buffer) {
  const firstByte = buffer.readUInt8(0);
  const opCode = firstByte & 0xf;

  if (opCode === 8) {
    // Connection closed
    return null;
  }

  if (opCode !== 1) {
    // Text-only frames
    return;
  }

  const secondByte = buffer.readUInt8(1);
  const isMasked = secondByte >>> 7 === 1;

  if (!isMasked) {
    throw new Error("Only masked frames are counted");
  }

  const maskingKey = buffer.readUInt32BE(2);

  let currentOffset = 6;

  const messageLength = secondByte & 0x7f;

  if (messageLength > 125) {
    throw new Error("Frame is too large");
  }

  const response = Buffer.alloc(messageLength);

  for (let i = 0; i < messageLength; i++) {
    const maskPosition = i % 4;

    let shift;

    if (maskPosition === 3) {
      shift = 0;
    } else {
      shift = (3 - maskPosition) << 3;
    }

    let mask;

    if (shift === 0) {
      mask = maskingKey & 0xff;
    } else {
      mask = (maskingKey >>> shift) & 0xff;
    }

    const source = buffer.readUInt8(currentOffset);
    currentOffset++;
    response.writeUInt8(mask ^ source, i);
  }

  return JSON.parse(response.toString("utf8"));
}
