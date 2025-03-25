import type { ParsedEmail } from '../../../types/ParsedEmail.ts';
import type { User } from '../../../types/User.ts';
import type { EncryptedEmail, EncryptedPart } from '../../../types/EncryptedEmail.ts';
import { encryptFile } from './encryptFile.ts';
import { generateFileId } from './generateFileId.ts';
import { getUserPublicKey } from './getUserPublicKey.ts';
import type { PublicKey } from '../../../types/PublicKey.ts';

/**
 * Encrypt an email for a specific user using their public key
 *
 * @param params Parameters for email encryption
 * @param params.user User with email and public key
 * @param params.parsedEmail Parsed email data
 * @param params.receivedAt Date and time when the email was received, ISO seconds
 * @returns Promise resolving to encrypted email data
 */
export async function encryptEmail({
  user,
  parsedEmail,
  receivedAt,
}: {
  user: User;
  parsedEmail: ParsedEmail;
  receivedAt: string;
}): Promise<EncryptedEmail> {
  const publicKey = await getUserPublicKey(user);

  // Encrypt all sections TODO: Consider Promise.all()
  // Attachments
  const attachments: EncryptedEmail['attachments'] = [];
  const metaAttachments: EncryptedEmail['body']['source']['attachments'] = [];
  for (const attachment of parsedEmail.attachments) {
    const { content, ...metaAttachment } = attachment;

    const part = await encryptPart(content, publicKey);

    metaAttachments.push({
      ...metaAttachment.render,
      contentId: part.filename,
    });

    attachments.push(part);
  }

  // Archive
  const archive: EncryptedEmail['archive'] = await encryptPart(parsedEmail.archive, publicKey);

  // Body
  const body = await encryptPart<EncryptedEmail['body']['source']>(
    {
      body: parsedEmail.body,
      htmlBody: parsedEmail.htmlBody,
      attachments: metaAttachments,
      archiveId: archive.filename,
    },
    publicKey
  );

  // Render
  const render = await encryptPart<EncryptedEmail['render']['source']>(
    {
      ...parsedEmail.render,
      receivedAt,
      bodyId: body.filename,
    },
    publicKey
  );
  render.filename += '.email'; // Adjust with a marker

  // Pack
  return {
    render,
    archive,
    body,
    attachments,
  };
}

async function encryptPart<Source>(
  source: Source,
  publicKey: PublicKey,
): Promise<EncryptedPart<Source>> {
  const serialized = JSON.stringify(source);
  const filename = generateFileId(serialized);
  const payload = await encryptFile(serialized, publicKey);
  return { source, filename, payload };
}
