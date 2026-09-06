import { firebaseConfig } from './firebaseConfig';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Requests client-side OAuth consent for Google Calendar read-only access.
 * The resulting ephemeral token is directly delivered to the caller to be securely
 * sent to the server and is never persisted on the frontend.
 */
export async function requestGoogleCalendarOAuthToken(): Promise<string> {
  const clientId = firebaseConfig.oAuthClientId;
  if (!clientId) {
    throw new Error('Google OAuth Client ID is not configured in firebase-applet-config.json.');
  }

  // Ensure Google Identity Services script is available
  if (!window.google?.accounts?.oauth2) {
    // Wait briefly if script is still loading
    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services script failed to load. Please check your internet connection and reload.'));
        }
      }, 100);
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
        callback: (response) => {
          if (response.error) {
            console.warn('[Google OAuth] Error:', response.error);
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received from Google OAuth.'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      console.error('[Google OAuth] Initialization error:', err);
      reject(new Error(err.message || 'Failed to start Google OAuth flow.'));
    }
  });
}
