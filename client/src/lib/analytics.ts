/**
 * Analytics tracking for UpKeepQr
 * Implements privacy-safe event tracking
 */

interface AnalyticsEvent {
  event: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

class Analytics {
  private enabled: boolean = true;

  constructor() {
    // Check if analytics is enabled (respect user preferences)
    this.enabled = !window.localStorage.getItem('analytics-disabled');
  }

  /**
   * Track an event
   * @param event Event name (e.g., "home_extra_saved")
   * @param payload Event data (no PII)
   */
  track(event: string, payload?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const eventData: AnalyticsEvent = {
      event,
      payload: payload || {},
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventData);
    }

    // Send to analytics service (implement your preferred service)
    // Examples: PostHog, Mixpanel, Segment, Google Analytics
    this.sendToService(eventData);
  }

  private sendToService(_data: AnalyticsEvent): void {
    // TODO: Implement your analytics service integration
    console.log("Analytics event:", data);
    
    // Example for PostHog:
    // window.posthog?.capture(data.event, data.payload);
    
    // Example for Segment:
    // window.analytics?.track(data.event, data.payload);
    
    // Example for custom API:
    // fetch('/api/analytics/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // }).catch(err => console.error('Analytics error:', err));
  }

  /**
   * Disable analytics tracking
   */
  disable(): void {
    this.enabled = false;
    window.localStorage.setItem('analytics-disabled', 'true');
  }

  /**
   * Enable analytics tracking
   */
  enable(): void {
    this.enabled = true;
    window.localStorage.removeItem('analytics-disabled');
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Make available globally for debugging
declare global {
  interface Window {
    analytics?: Analytics;
  }
}

if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

// Event name constants for type safety
export const ANALYTICS_EVENTS = {
  HOME_EXTRA_SAVED: 'home_extra_saved',
  INTENT_SELL_WINDOW_SELECTED: 'intent_sell_window_selected',
  INTENT_PROJECT_SELECTED: 'intent_project_selected',
  CONSENT_MARKETING_TOGGLED: 'consent_marketing_toggled',
} as const;
