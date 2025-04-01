export const bufferFromBufferSource = (bufferSource: BufferSource): Buffer => {
  if (ArrayBuffer.isView(bufferSource)) {
    return Buffer.from(bufferSource.buffer, bufferSource.byteOffset, bufferSource.byteLength);
  }

  return Buffer.from(bufferSource);
};
