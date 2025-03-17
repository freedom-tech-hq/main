import * as Y from 'yjs';

export const cloneYDoc = (doc: Y.Doc) => {
  const docState = Y.encodeStateAsUpdateV2(doc);
  const newDoc = new Y.Doc();
  Y.applyUpdateV2(newDoc, docState);
  return newDoc;
};
