export interface CopyTemplateArgs {
  include: Array<string | number>;
  exclude: Array<string | number> | undefined;
  dropPrefixes: Array<string | number> | undefined;
  outdir: string;
}
