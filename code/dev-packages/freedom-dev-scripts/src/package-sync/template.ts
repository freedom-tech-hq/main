import type { TemplateObject } from './types/types.ts';
import { ALLOW_ANY, KEEP_ORDER, PER_PACKAGE } from './utils/tags.ts';

export const packageTemplate: TemplateObject = {
  // TODO: Semantical order
  browserslist: ALLOW_ANY,
  dependencies: ALLOW_ANY,
  devDependencies: ALLOW_ANY,
  peerDependencies: ALLOW_ANY,
  exports: ALLOW_ANY,
  type: ALLOW_ANY, // TODO: "module",
  main: ALLOW_ANY,
  name: ALLOW_ANY,
  description: ALLOW_ANY,
  nx: ALLOW_ANY,
  private: true,
  scripts: KEEP_ORDER({
    // TODO
    'deploy:extract': PER_PACKAGE({
      'backends/delivery-host': './deploy.extract.sh',
      'dev-packages/freedom-localization-tools': undefined,
      'dev-packages/freedom-mock-smtp-server': undefined,
      '*': '../../poc/repo/deploy.extract.sh'
    })
  }),
  types: ALLOW_ANY,
  typesVersions: ALLOW_ANY,
  version: /^\d+\.\d+\.\d+$/
};
