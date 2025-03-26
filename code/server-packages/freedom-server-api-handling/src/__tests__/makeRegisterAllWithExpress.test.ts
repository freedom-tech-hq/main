import type * as http from 'node:http';
import type { TestContext } from 'node:test';
import { after, before, describe, it } from 'node:test';

import bodyParser from 'body-parser';
import express from 'express';
import {
  addYaschemaApiExpressContextAccessorToExpress,
  finalizeApiHandlerRegistrations,
  makeYaschemaApiExpressContext
} from 'express-yaschema-api-handler';
import { makeFailure, makeSuccess } from 'freedom-async';
import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { getEnv } from 'freedom-contexts';
import { expectNotOk, expectOk, sleep } from 'freedom-testing-tools';
import { StatusCodes } from 'http-status-codes';
import { get } from 'lodash-es';
import { schema } from 'yaschema';
import { makeHttpApi, setDefaultUrlBase } from 'yaschema-api';
import { apiFetch } from 'yaschema-api-fetcher';

import { makeHttpApiHandler } from '../utils/makeHttpApiHandler.ts';
import { makeRegisterAllWithExpress } from '../utils/makeRegisterAllWithExpress.ts';

const port = Number.parseInt(getEnv('PORT', process.env.PORT) ?? '18088');

const POST_WITH_CREDENTIALS = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/params/{one}/and/{two}',
  isSafeToRetry: true,
  credentials: 'include',
  schemas: {
    request: {
      params: schema.object({
        one: schema.string(),
        two: schema.regex(/\d{8}-\d{4}/)
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.string()
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});

const POST_WITHOUT_CREDENTIALS = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/params/no-credentials',
  isSafeToRetry: true,
  schemas: {
    request: {},
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.string()
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});

describe('makeRegisterAllWithExpress', () => {
  let server: http.Server | undefined;

  before(
    () =>
      new Promise<void>((resolve, reject) => {
        const app = addYaschemaApiExpressContextAccessorToExpress(express(), makeYaschemaApiExpressContext());

        app.use(bodyParser.json({ type: 'application/json' }));

        makeRegisterAllWithExpress(
          makeHttpApiHandler(['test'], { api: POST_WITH_CREDENTIALS }, async (trace, { input }) => {
            await sleep(Math.random() * 100);

            if (input.params.two === '00000000-0000') {
              return makeFailure(new InputSchemaValidationError(trace, { message: "00000000-0000 isn't supported" }));
            } else if (input.params.two === '11111111-1111') {
              throw new Error('something went wrong');
            }

            return makeSuccess({
              body: `GOT ${input.params.one} AND ${input.params.two}`
            });
          }),

          makeHttpApiHandler(['test'], { api: POST_WITHOUT_CREDENTIALS }, async () => {
            await sleep(Math.random() * 100);

            return makeSuccess({
              body: 'OK'
            });
          })
        )(app);

        finalizeApiHandlerRegistrations({ context: app.getYaschemaApiExpressContext?.() });

        try {
          server = app.listen(port, () => {
            console.log(`Service test listening on port ${port}`);

            resolve();
          });
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(e);
        }
      })
  );

  before(() => {
    setDefaultUrlBase(`http://localhost:${port}`);
  });

  after(
    () =>
      new Promise<void>((resolve, reject) => {
        if (server === undefined) {
          setTimeout(resolve, 0);
          return;
        }

        server.close((error) => {
          if (error !== undefined) {
            reject(error);
          } else {
            setTimeout(resolve, 0);
          }
        });
      })
  );

  it('should work when correctly formed', async (t: TestContext) => {
    const res = await apiFetch(POST_WITH_CREDENTIALS, { params: { one: 'hello', two: '12345678-9876' } });
    expectOk(res);

    t.assert.strictEqual(res.status, StatusCodes.OK);
    t.assert.strictEqual(res.body, 'GOT hello AND 12345678-9876');

    t.assert.strictEqual(true, true);
  });

  it("should fail when there's an error", async (t: TestContext) => {
    const res = await apiFetch(POST_WITH_CREDENTIALS, { params: { one: 'hello', two: '00000000-0000' } });
    expectNotOk(res);

    t.assert.strictEqual(res.status, StatusCodes.BAD_REQUEST);
    t.assert.strictEqual(get(res.body, 'message'), 'Bad request');

    t.assert.strictEqual(true, true);
  });

  it('should fail when a error is thrown', async (t: TestContext) => {
    const res = await apiFetch(POST_WITH_CREDENTIALS, { params: { one: 'hello', two: '11111111-1111' } });
    expectNotOk(res);

    t.assert.strictEqual(res.status, StatusCodes.INTERNAL_SERVER_ERROR);

    t.assert.strictEqual(true, true);
  });

  it('without credentials API should work', async (t: TestContext) => {
    const res = await apiFetch(POST_WITHOUT_CREDENTIALS, {});
    expectOk(res);

    t.assert.strictEqual(res.status, StatusCodes.OK);
    t.assert.strictEqual(res.body, 'OK');

    t.assert.strictEqual(true, true);
  });
});
