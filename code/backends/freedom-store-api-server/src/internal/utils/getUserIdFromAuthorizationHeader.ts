import { type EmailUserId, emailUserIdInfo } from 'freedom-email-sync';

export function getUserIdFromAuthorizationHeader(headers: Record<string, string> | undefined): EmailUserId | undefined {
  const authorizationHeader = headers?.authorization;
  if (authorizationHeader === undefined || !authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return emailUserIdInfo.parse(authorizationHeader, 7)?.value;
}
