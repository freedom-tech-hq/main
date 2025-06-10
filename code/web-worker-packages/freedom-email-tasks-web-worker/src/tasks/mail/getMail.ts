import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError, UnauthorizedError } from 'freedom-common-errors';
import { api, clientApi, type DecryptedViewMessage, type MailId } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { generatePseudoWord } from 'pseudo-words';
import sanitizeHtml from 'sanitize-html';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { cachedMessagesByDataSetId } from '../../caches/cachedMessagesByDataSetId.ts';
import { useActiveCredential } from '../../contexts/active-credential.ts';
import { sanitizeHtmlOptions } from '../../internal/consts/sanitizeHtmlOptions.ts';
import { makeUserKeysFromEmailCredential } from '../../internal/utils/makeUserKeysFromEmailCredential.ts';
import type { MailMessagesDataSetId } from '../../types/mail/MailMessagesDataSetId.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

const getMessageFromRemote = makeApiFetchTask([import.meta.filename, 'getMessageFromRemote'], api.message.id.GET);

export const getMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, dataSetId: MailMessagesDataSetId | undefined, mailId: MailId): PR<DecryptedViewMessage, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ mailId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    if (dataSetId !== undefined) {
      const messageCache = cachedMessagesByDataSetId.get(dataSetId);
      if (messageCache === undefined) {
        return makeFailure(
          new NotFoundError(trace, { message: `Data set with ID: ${dataSetId} was disconnected`, errorCode: 'not-found' })
        );
      }

      const message = messageCache.get(mailId);
      if (message === undefined) {
        return makeFailure(new NotFoundError(trace, { message: `No mail item found with ID ${mailId}`, errorCode: 'not-found' }));
      }

      if (!message.encrypted) {
        return makeSuccess(message.value);
      }

      const userKeys = makeUserKeysFromEmailCredential(credential);
      const decrypted = await clientApi.decryptViewMessage(trace, userKeys, message.value);
      if (!decrypted.ok) {
        return decrypted;
      }

      messageCache.set(mailId, { encrypted: false, value: decrypted.value });

      return makeSuccess(decrypted.value);
    } else {
      const message = await getMessageFromRemote(trace, {
        headers: { authorization: `Bearer ${credential.userId}` },
        params: { mailId },
        context: getDefaultApiRoutingContext()
      });
      if (!message.ok) {
        return message;
      }

      const userKeys = makeUserKeysFromEmailCredential(credential);
      const decrypted = await clientApi.decryptViewMessage(trace, userKeys, message.value.body);
      if (!decrypted.ok) {
        return decrypted;
      }

      if (decrypted.value.isBodyHtml) {
        decrypted.value.body = sanitizeHtml(decrypted.value.body, sanitizeHtmlOptions);
      }

      return makeSuccess(decrypted.value);
    }
  }
);

let makeDemoModeResult: (args: { mailId: MailId }) => Promise<SuccessResult<DecryptedViewMessage>> = () => {
  throw new Error();
};

DEV: {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generatePseudoText = (min: number = 10, max: number = 200) =>
    Array(rand(min, max))
      .fill(0)
      .map(() => generatePseudoWord())
      .join(' ');

  const generateRandomColor = (): string =>
    `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;

  const generateRandomSvgDimensionPxValue = () => rand(100, 700);
  const generateRandomSvgPositionPxValue = () => rand(0, 600);

  const getRandomSvgDataUri = (): string => {
    const generateRandomSvgShape = () => {
      const color = generateRandomColor();
      return Math.random() > 0.5
        ? `<rect
            width="${generateRandomSvgDimensionPxValue()}"
            height="${generateRandomSvgDimensionPxValue()}"
            fill="${color}" />`
        : `<circle
            cx="${generateRandomSvgPositionPxValue()}"
            cy="${generateRandomSvgPositionPxValue()}"
            r="${generateRandomSvgDimensionPxValue() / 2}"
            fill="${color}" />`;
    };

    const svg = `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${generateRandomSvgDimensionPxValue()}"
      height="${generateRandomSvgDimensionPxValue()}">${Array(rand(1, 20)).fill(0).map(generateRandomSvgShape).join('')}</svg>`;
    const encoded = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${encoded}`;
  };

  const getRandomDisallowedTag = (): string => {
    const tags = [
      '</div>',
      `<script>alert('xss')</script>`,
      `<style>body { background: pink !important; }</style>`,
      `<iframe src="http://example.com"></iframe>`,
      `<marquee>${generatePseudoText(5, 10)}</marquee>`,
      `<object data="http://example.com/bad.swf"></object>`
    ];
    return tags[rand(0, tags.length - 1)];
  };

  const generateRandomHtmlEmail = (): string => {
    const html = [`<!DOCTYPE html><html><head><title>${generatePseudoText(3, 7)}</title></head><body>`];

    const numSections = rand(3, 8);
    for (let sectionIndex = 0; sectionIndex < numSections; sectionIndex++) {
      const tagType = rand(0, 2) as 0 | 1 | 2;
      switch (tagType) {
        case 0:
          html.push(`<h2>${generatePseudoText(5, 8)}</h2>`);
          break;
        case 1:
          // Anchor (a) tags should have target set to '_blank'
          html.push(
            `<p style="color:${generateRandomColor()}; font-family:'Comic Sans MS';">${generatePseudoText()}${Math.random() < 0.5 ? ` <a href="https://www.freedomtechhq.com">Click Here</a>` : ''}</p>`
          );
          break;
        case 2:
          // Including onclick, which should get removed
          html.push(
            `<div style="border: 1px solid ${generateRandomColor()}; padding: 10px;" onclick="alert('Hello World');">${generatePseudoText(12, 20)}</div>`
          );
          break;
      }

      // Occasionally add a bad/unsupported tag
      if (Math.random() < 0.25) {
        html.push(getRandomDisallowedTag());
      }

      // Occasionally add an inline image
      if (Math.random() < 0.4) {
        html.push(`<img src="${getRandomSvgDataUri()}" width="100" height="50" style="display:block; margin:10px 0;" />`);
      }
    }

    html.push(`</body></html>`);

    return html.join('');
  };

  const generateRandomPlainTextEmail = (): string =>
    Array(rand(1, 10))
      .fill(0)
      .map(() => generatePseudoText())
      .join('\n\n');

  makeDemoModeResult = async ({ mailId }) => {
    await sleep(Math.random() * ONE_SEC_MSEC);

    const isBodyHtml = Math.random() < 0.5;
    const body = isBodyHtml ? sanitizeHtml(generateRandomHtmlEmail(), sanitizeHtmlOptions) : generateRandomPlainTextEmail();

    return makeSuccess({
      id: mailId,
      from: [{ name: 'Demo User', address: `demo@${getConfig().defaultEmailDomain}` }],
      to: [{ name: 'Demo User', address: `demo@${getConfig().defaultEmailDomain}` }],
      cc: [],
      messageId: `<${mailId}@${getConfig().defaultEmailDomain}>`,
      subject: generatePseudoText(1, 6),
      body,
      isBodyHtml,
      date: makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC)),
      updatedAt: makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC)),
      snippet: generatePseudoText().substring(0, 200)
    });
  };
}
