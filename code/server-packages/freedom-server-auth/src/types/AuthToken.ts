import type { AuthTokenDeliveryMode, SessionTokenDetails } from 'freedom-basic-data';

export interface AuthToken {
  details: SessionTokenDetails;
  authToken: string;
  deliveryMode: AuthTokenDeliveryMode;
}
