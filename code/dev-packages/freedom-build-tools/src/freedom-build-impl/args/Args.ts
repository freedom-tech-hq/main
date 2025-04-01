export interface BuildArgs {
  tsconfig: string;

  /** @defaultValue `false` */
  bundle?: boolean;
  /** @defaultValue Established from includes list from tsconfig file */
  entryPoints?: Array<string | number>;
  /** @defaultValue `false` */
  splitting?: boolean;
  /** @defaultValue `any` */
  platform?: 'any' | 'web' | 'node';
}
