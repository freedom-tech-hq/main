export type InferErrorCode<BodyT> = BodyT extends { errorCode?: string } ? BodyT['errorCode'] : never;
