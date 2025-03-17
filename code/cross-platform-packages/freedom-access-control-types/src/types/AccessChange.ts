import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { AddAccessChange, AddAccessChangeParams } from './AddAccessChange.ts';
import { makeAddAccessChangeParamsSchema, makeAddAccessChangeSchema } from './AddAccessChange.ts';
import type { ModifyAccessChange, ModifyAccessChangeParams } from './ModifyAccessChange.ts';
import { makeModifyAccessChangeParamsSchema, makeModifyAccessChangeSchema } from './ModifyAccessChange.ts';
import type { RemoveAccessChange, RemoveAccessChangeParams } from './RemoveAccessChange.ts';
import { makeRemoveAccessChangeParamsSchema, makeRemoveAccessChangeSchema } from './RemoveAccessChange.ts';

export const makeAccessChangeParamsSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.oneOf3(
    makeAddAccessChangeParamsSchema({ roleSchema }),
    makeRemoveAccessChangeParamsSchema({ roleSchema }),
    makeModifyAccessChangeParamsSchema({ roleSchema })
  );
export type AccessChangeParams<RoleT extends string> =
  | AddAccessChangeParams<RoleT>
  | RemoveAccessChangeParams<RoleT>
  | ModifyAccessChangeParams<RoleT>;

export const makeAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.oneOf3(
    makeAddAccessChangeSchema({ roleSchema }),
    makeRemoveAccessChangeSchema({ roleSchema }),
    makeModifyAccessChangeSchema({ roleSchema })
  );
export type AccessChange<RoleT extends string> = AddAccessChange<RoleT> | RemoveAccessChange<RoleT> | ModifyAccessChange<RoleT>;
