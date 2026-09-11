import { publicEnv } from './env';

export function contributeLink(cardId: string, contributorToken: string): string {
  return `${publicEnv.appUrl}/contribute/${cardId}/${contributorToken}`;
}

export function recipientLink(cardId: string, accessToken: string): string {
  return `${publicEnv.appUrl}/view/${cardId}/${accessToken}`;
}

export function creatorLink(cardId: string, creatorToken: string): string {
  return `${publicEnv.appUrl}/card/${cardId}/${creatorToken}`;
}
