export interface ServeArgs {
  tsconfig: string;

  /** @defaultValue Established from includes list from tsconfig file */
  entryPoints?: Array<string | number>;
}
