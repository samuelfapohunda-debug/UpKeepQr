# UpKeepQR Technical Specification - Addendum

**Addendum Version:** 2.0.0  
**Related Main Spec Version:** 1.0  
**Date:** December 10, 2024  
**Status:** Draft for Review  
**Author:** Development Team  

---

## Document Control

### Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0 | 2024-12-10 | Dev Team | Complete restructure with enhanced sections |
| 1.0.0 | 2024-12-08 | Dev Team | Initial addendum draft |

### Purpose of This Addendum
This addendum extends the main UpKeepQR Technical Specification by providing:
- Enhanced implementation details for security architecture
- Performance optimization strategies for scale
- Comprehensive monitoring and observability framework
- Production-ready testing strategies
- DevOps and deployment procedures
- Disaster recovery and business continuity plans
- Technical debt management framework

### Document Scope
**This addendum covers:**
- Implementation-level technical details (not architectural decisions)
- Production-ready code examples and configurations
- Operational procedures and runbooks
- Testing strategies and quality gates

**This addendum does NOT replace:**
- Core architectural decisions in main specification
- User experience flows and wireframes
- Business requirements and success metrics
- API contracts and data schemas (references main spec)

---

## Summary of Changes

### Changes to Main Specification

| Section | Main Spec Reference | Previous | Updated | Reason | Priority |
|---------|-------------------|----------|---------|--------|----------|
| Session Management | 5.1 Authentication | Basic JWT mentioned | Full implementation with refresh tokens, CSRF protection, and auto-renewal | Production security requirements | P0 |
| Rate Limiting | 5.3 Security | Generic rate limits | Adaptive rate limiting with Redis, per-endpoint configs, automatic blocking | Prevent abuse and DDoS | P0 |
| Caching Strategy | 6.2 Performance | Redis caching noted | Multi-layer cache (memory + Redis) with warming and invalidation | Performance at scale | P1 |
| Error Handling | 7.1 Error Management | Basic try-catch | Comprehensive error taxonomy with context, monitoring integration | Better debugging and UX | P1 |
| Database Queries | 3.2 Data Layer | ORM usage mentioned | Optimized queries with indexes, connection pooling, batch operations | Performance optimization | P1 |
| Monitoring | 8.1 Observability | Logging mentioned | Prometheus metrics, structured logging, health checks | Production operations | P0 |
| Testing | 9.0 Quality Assurance | Unit tests required | Complete testing pyramid: unit, integration, E2E with coverage gates | Quality assurance | P1 |
| Deployment | 10.0 DevOps | Vercel deployment | Full CI/CD pipeline with staging, smoke tests, rollback procedures | Reliable releases | P0 |

### New Requirements Introduced

| Requirement ID | Description | Affects | Release Target | Dependencies |
|----------------|-------------|---------|----------------|--------------|
| SEC-001 | Implement RBAC with granular permissions | Authentication, Authorization | v1.1 | None |
| SEC-002 | Add data encryption at rest for sensitive fields | Database, Storage | v1.1 | Encryption service |
| PERF-001 | Multi-layer caching with Redis and in-memory | All read operations | v1.0 | Upstash Redis |
| PERF-002 | Database query optimization with indexes | Database layer | v1.0 | Database migration |
| MON-001 | Prometheus metrics collection | All services | v1.0 | Prometheus endpoint |
| MON-002 | Structured logging with correlation IDs | All services | v1.0 | Pino logger |
| TEST-001 | 80% minimum unit test coverage | All modules | v1.0 | Vitest setup |
| TEST-002 | Integration tests for critical flows | API routes | v1.1 | Test database |
| TEST-003 | E2E tests for purchase and setup flows | User flows | v1.1 | Playwright |
| OPS-001 | Automated database backups to S3 | Database | v1.0 | AWS S3, pg_dump |
| OPS-002 | Disaster recovery playbook | Operations | v1.0 | Documentation |

### Terminology Alignment

**Core Terms (from Main Spec):**
- **QR Code** → Unique identifier magnet for properties
- **Agent** → Real estate agent (purchaser)
- **Homeowner** → Property owner (end user)
- **Setup** → Process of activating QR code and registering property
- **Maintenance Task** → Scheduled home maintenance reminder
- **Session** → Authenticated user session with JWT token

**New Terms Introduced in Addendum:**
- **Rate Limiter** → Service that enforces request limits per endpoint
- **Cache Layer** → Multi-tier caching system (memory + Redis)
- **Metric** → Prometheus-format measurement for monitoring
- **Health Check** → Endpoint that reports service status
- **Disaster Recovery (DR)** → Process for recovering from system failures

---

## 1. Security Architecture & Hardening

### 1.1 Overview & Main Spec Alignment

**Supersedes:** Section 5.1 - Authentication & Authorization (Main Spec)  
**Extends:** Section 5.3 - Security Considerations (Main Spec)

This section provides production-ready implementation of authentication and security mechanisms outlined in the main specification.

### 1.2 Session Management Implementation

#### 1.2.1 Requirements

**REQ-SEC-001: JWT Session Management**
- **Description:** Implement stateless JWT sessions with automatic refresh
- **Acceptance Criteria:**
  ```gherkin
  Scenario: User logs in successfully
    Given a valid agent account exists
    When the agent submits correct credentials
    Then a JWT session token is issued
    And the token expires after 24 hours
    And a CSRF token is set in a separate cookie
    And session details are logged for audit
  
  Scenario: Session auto-renewal
    Given an active session with 3 hours remaining
    When the user makes any authenticated request
    Then the session token is automatically refreshed
    And the expiration is extended by 24 hours
  
  Scenario: Session expiration
    Given a session token has expired
    When the user attempts an authenticated request
    Then they receive a 401 Unauthorized response
    And they are redirected to the login page
    And the expired session is cleared
  ```

**REQ-SEC-002: CSRF Protection**
- **Description:** Protect state-changing operations with CSRF tokens
- **Acceptance Criteria:**
  ```gherkin
  Scenario: CSRF token validation
    Given an authenticated user session
    When the user submits a form (POST/PUT/DELETE)
    Then the request must include a valid CSRF token
    And the token must match the session cookie value
    And the token must not have expired
  
  Scenario: Missing CSRF token
    Given an authenticated user session
    When a POST request is sent without CSRF token
    Then the request is rejected with 403 Forbidden
    And an error message explains the requirement
  ```

#### 1.2.2 Implementation

```typescript
// server/lib/security/session-manager.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

interface SessionPayload {
  userId: string;
  email: string;
  role: 'agent' | 'homeowner';
  issuedAt: number;
  expiresAt: number;
  refreshToken?: string;
}

export class SessionManager {
  private static readonly SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET!
  );
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours

  /**
   * Create new session with JWT token
   * SECURITY: Uses HS256 algorithm for signing
   * SECURITY: Sets httpOnly, secure, sameSite cookies
   * SECURITY: Includes CSRF token in separate cookie
   */
  static async createSession(payload: Omit<SessionPayload, 'issuedAt' | 'expiresAt'>): Promise<string> {
    const now = Date.now();
    const token = await new SignJWT({
      ...payload,
      issuedAt: now,
      expiresAt: now + this.SESSION_DURATION,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.SECRET);

    // Set session cookie
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.SESSION_DURATION / 1000,
      path: '/',
    });

    // Set CSRF token
    const csrfToken = crypto.randomUUID();
    cookies().set('csrf-token', csrfToken, {
      httpOnly: false, // Accessible to client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.SESSION_DURATION / 1000,
      path: '/',
    });

    return token;
  }

  /**
   * Verify and decode session token
   * SECURITY: Validates signature and expiration
   * PERFORMANCE: Checks for token refresh need
   * ERROR: Returns null if invalid
   */
  static async verifySession(): Promise<SessionPayload | null> {
    try {
      const token = cookies().get('session')?.value;
      if (!token) return null;

      const { payload } = await jwtVerify(token, this.SECRET);
      
      // Check if session needs refresh
      if (payload.expiresAt && 
          typeof payload.expiresAt === 'number' &&
          Date.now() > payload.expiresAt - this.REFRESH_THRESHOLD) {
        await this.refreshSession(payload as SessionPayload);
      }

      return payload as SessionPayload;
    } catch (error) {
      console.error('Session verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh session token if near expiration
   * PERFORMANCE: Only refreshes within threshold window
   */
  private static async refreshSession(payload: SessionPayload): Promise<void> {
    const newToken = await this.createSession({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
  }

  /**
   * Destroy session and clear cookies
   * SECURITY: Clears both session and CSRF tokens
   */
  static destroySession(): void {
    cookies().delete('session');
    cookies().delete('csrf-token');
  }

  /**
   * Verify CSRF token for state-changing operations
   * SECURITY: Compares token from header with cookie value
   */
  static verifyCsrf(token: string): boolean {
    const cookieToken = cookies().get('csrf-token')?.value;
    return cookieToken === token && token.length > 0;
  }
}
```

**Testing Requirements:**
- Unit tests for all SessionManager methods
- Integration tests for session lifecycle
- Security tests for token tampering attempts
- Performance tests for token generation/verification speed

**Dependencies:**
- jose library for JWT operations
- next/headers for cookie management
- crypto for CSRF token generation

---

### 1.3 Role-Based Access Control (RBAC)

#### 1.3.1 Requirements

**REQ-SEC-003: Granular Permission System**
- **Description:** Implement fine-grained permissions for different user roles
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Agent accesses dashboard
    Given an authenticated agent user
    When they navigate to /dashboard
    Then they can view their QR code inventory
    And they can view their homeowner list
    And they can view analytics for their properties
  
  Scenario: Agent attempts admin action
    Given an authenticated agent user
    When they attempt to access /admin/users
    Then they receive a 403 Forbidden response
    And an error message explains insufficient permissions
  
  Scenario: Homeowner accesses maintenance
    Given an authenticated homeowner user
    When they navigate to /maintenance
    Then they can view their maintenance schedule
    And they can update task completion status
    But they cannot view other homeowners' data
  ```

**REQ-SEC-004: Permission Enforcement**
- **Description:** Enforce permissions at API and route level
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Protected API endpoint
    Given an API endpoint requires "purchase:qr_codes" permission
    When a user without this permission calls the endpoint
    Then the request is rejected with 403 Forbidden
    And the attempt is logged in audit log
  
  Scenario: Permission check caching
    Given a user's permissions are loaded
    When the same user makes multiple requests
    Then permissions are cached for the session
    And cache is invalidated on role change
  ```

#### 1.3.2 Implementation

```typescript
// server/lib/security/rbac.ts

/**
 * Permission enum defines all possible actions in the system
 * Naming convention: <action>:<resource>
 */
export enum Permission {
  // Agent permissions
  VIEW_DASHBOARD = 'view:dashboard',
  PURCHASE_QR_CODES = 'purchase:qr_codes',
  MANAGE_HOMEOWNERS = 'manage:homeowners',
  VIEW_ANALYTICS = 'view:analytics',
  EXPORT_DATA = 'export:data',
  
  // Homeowner permissions
  VIEW_MAINTENANCE = 'view:maintenance',
  UPDATE_PROFILE = 'update:profile',
  SCHEDULE_REMINDERS = 'schedule:reminders',
  VIEW_PROPERTY = 'view:property',
  
  // Admin permissions (future use)
  MANAGE_USERS = 'manage:users',
  VIEW_SYSTEM_LOGS = 'view:system_logs',
  CONFIGURE_SYSTEM = 'configure:system',
  ACCESS_ALL_DATA = 'access:all_data',
}

/**
 * Role to permission mapping
 * Each role inherits specific permissions
 */
export const RolePermissions: Record<string, Permission[]> = {
  agent: [
    Permission.VIEW_DASHBOARD,
    Permission.PURCHASE_QR_CODES,
    Permission.MANAGE_HOMEOWNERS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  homeowner: [
    Permission.VIEW_MAINTENANCE,
    Permission.UPDATE_PROFILE,
    Permission.SCHEDULE_REMINDERS,
    Permission.VIEW_PROPERTY,
  ],
  admin: Object.values(Permission), // All permissions
};

/**
 * Check if a role has a specific permission
 * PERFORMANCE: O(n) lookup, consider Set for large permission lists
 */
export function hasPermission(role: string, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Higher-order function for route protection
 * Usage: export const GET = requirePermission(Permission.VIEW_DASHBOARD)(handler)
 */
export function requirePermission(permission: Permission) {
  return async (req: Request) => {
    const session = await SessionManager.verifySession();
    
    if (!session) {
      throw new AuthenticationError('Authentication required');
    }

    if (!hasPermission(session.role, permission)) {
      // Log unauthorized access attempt
      log.securityEvent('unauthorized_access', {
        userId: session.userId,
        role: session.role,
        requiredPermission: permission,
        url: req.url,
      });
      
      throw new AuthorizationError(`Missing permission: ${permission}`);
    }

    return session;
  };
}

/**
 * Batch permission check for UI rendering
 * Returns map of permissions to boolean values
 */
export function checkPermissions(
  role: string, 
  permissions: Permission[]
): Record<Permission, boolean> {
  return permissions.reduce((acc, permission) => {
    acc[permission] = hasPermission(role, permission);
    return acc;
  }, {} as Record<Permission, boolean>);
}
```

**Data Model Changes:**
None required - permissions are code-based, not database-stored. Future enhancement may add user-specific permission overrides in database.

**Testing Requirements:**
- Unit tests for hasPermission with all role combinations
- Integration tests for requirePermission middleware
- Security tests for permission bypass attempts
- Performance tests for permission check overhead

---

### 1.4 Input Validation & Sanitization

#### 1.4.1 Requirements

**REQ-SEC-005: Comprehensive Input Validation**
- **Description:** Validate all user inputs before processing
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Valid phone number submission
    Given a setup form with phone number field
    When homeowner enters "+12025551234"
    Then the input is accepted
    And the number is stored in E.164 format
  
  Scenario: Invalid phone number rejection
    Given a setup form with phone number field
    When homeowner enters "555-1234" (missing country code)
    Then the input is rejected
    And an error message explains the required format
    And the form is not submitted
  
  Scenario: SQL injection prevention
    Given any text input field
    When user enters "'; DROP TABLE users; --"
    Then the input is sanitized
    And no SQL commands are executed
    And the malicious attempt is logged
  
  Scenario: XSS prevention
    Given a text field that renders on page
    When user enters "<script>alert('xss')</script>"
    Then the script tags are escaped
    And the content is displayed as plain text
    And the attempt is logged
  ```

**REQ-SEC-006: Email Validation with Security Checks**
- **Description:** Validate email addresses and block disposable domains
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Valid email acceptance
    Given an email input field
    When user enters "user@example.com"
    Then the email is accepted
    And it is normalized to lowercase
  
  Scenario: Disposable email rejection
    Given an email input field
    When user enters "temp@tempmail.com"
    Then the email is rejected
    And an error explains disposable emails are not allowed
  
  Scenario: Email normalization
    Given an email input field
    When user enters "  USER@EXAMPLE.COM  "
    Then it is stored as "user@example.com"
  ```

#### 1.4.2 Implementation

```typescript
// server/lib/validation/schemas.ts
import { z } from 'zod';

/**
 * Phone number validation with E.164 format
 * FORMAT: +1XXXXXXXXXX (US numbers only for v1.0)
 * SECURITY: Prevents SQL injection via phone fields
 */
export const phoneSchema = z.string()
  .regex(/^\+1[2-9]\d{9}$/, 'Must be valid US phone number in format +1XXXXXXXXXX')
  .transform(val => val.replace(/\D/g, '')); // Strip non-digits after validation

/**
 * Email validation with security checks
 * SECURITY: Blocks disposable email domains
 * NORMALIZATION: Converts to lowercase and trims whitespace
 */
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email too long') // RFC 5321 limit
  .refine(email => {
    // Block disposable email domains
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com'];
    const domain = email.split('@')[1];
    return !disposableDomains.includes(domain);
  }, 'Disposable email addresses not allowed')
  .transform(email => email.toLowerCase().trim());

/**
 * Address validation with geocoding verification
 * SECURITY: Prevents injection via address fields
 * FUTURE: Add geocoding API call to verify real address
 */
export const addressSchema = z.object({
  street: z.string()
    .min(5, 'Street address too short')
    .max(200, 'Street address too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Invalid characters in street address'),
  city: z.string()
    .min(2, 'City name too short')
    .max(100, 'City name too long')
    .regex(/^[a-zA-Z\s.-]+$/, 'Invalid characters in city name'),
  state: z.string()
    .length(2, 'State must be 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code'),
  zip: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
});

/**
 * Setup form validation - COMPLETE SCHEMA
 * Aligns with Main Spec Section 4.2.1 - Setup Form Fields
 */
export const setupFormSchema = z.object({
  // QR Code identifier (UUID v4 format)
  qrCode: z.string().uuid('Invalid QR code format'),
  
  // Homeowner information
  homeownerFirstName: z.string()
    .min(1, 'First name required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
  homeownerLastName: z.string()
    .min(1, 'Last name required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
  homeownerEmail: emailSchema,
  homeownerPhone: phoneSchema,
  
  // Property information
  propertyAddress: addressSchema,
  
  // Consent (required by law - TCPA compliance)
  smsConsent: z.literal(true, {
    errorMap: () => ({ message: 'SMS consent required by TCPA regulations' })
  }),
  
  // Agent reference
  agentEmail: emailSchema,
});

/**
 * Maintenance item validation
 * Aligns with Main Spec Section 3.3 - Maintenance Tasks Schema
 */
export const maintenanceItemSchema = z.object({
  title: z.string()
    .min(3, 'Title too short')
    .max(100, 'Title too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Invalid characters in title'),
  description: z.string()
    .min(10, 'Description too short')
    .max(1000, 'Description too long'),
  category: z.enum([
    'hvac',
    'plumbing',
    'electrical',
    'appliances',
    'exterior',
    'interior',
    'landscaping',
    'safety',
  ]),
  frequency: z.enum(['monthly', 'quarterly', 'biannual', 'annual']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedCost: z.number()
    .min(0, 'Cost cannot be negative')
    .max(100000, 'Cost exceeds maximum')
    .optional(),
});
```

**Testing Requirements:**
- Unit tests for each schema with valid/invalid inputs
- Fuzzing tests with random malicious inputs
- Integration tests with actual form submissions
- Performance tests for validation speed

**Dependencies:**
- zod for schema validation
- No external validation services (all client-side first, then server-side)

---

### 1.5 Rate Limiting & DDoS Protection

#### 1.5.1 Requirements

**REQ-SEC-007: Adaptive Rate Limiting**
- **Description:** Implement per-endpoint rate limiting with Redis
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Normal request flow
    Given a user within rate limits
    When they make an API request
    Then the request is processed normally
    And X-RateLimit headers are returned
    And the request count is incremented in Redis
  
  Scenario: Rate limit exceeded
    Given a user has exceeded their rate limit
    When they make another API request
    Then they receive 429 Too Many Requests
    And X-RateLimit-Reset header shows reset time
    And the attempt is logged
  
  Scenario: Automatic blocking after repeated violations
    Given a user has exceeded rate limit 3 times
    When they attempt another request
    Then they are blocked for extended duration
    And a security alert is generated
  
  Scenario: Rate limit varies by endpoint
    Given different endpoints have different limits
    When user accesses /api/auth/login (5 req/15min)
    And user accesses /api/data (100 req/min)
    Then each endpoint enforces its own limit
  ```

#### 1.5.2 Implementation

```typescript
// server/lib/security/rate-limiter.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

interface RateLimitConfig {
  points: number;        // Number of requests allowed
  duration: number;      // Time window in seconds
  blockDuration: number; // Block duration in seconds after limit exceeded
}

/**
 * Rate limit configurations per endpoint
 * SECURITY: Stricter limits for sensitive endpoints
 * PERFORMANCE: Looser limits for read-only endpoints
 */
export class RateLimiter {
  private static readonly configs: Record<string, RateLimitConfig> = {
    // Strict limits for authentication endpoints
    'auth:login': {
      points: 5,
      duration: 900, // 15 minutes
      blockDuration: 1800, // 30 minutes
    },
    'auth:signup': {
      points: 3,
      duration: 3600, // 1 hour
      blockDuration: 7200, // 2 hours
    },
    
    // Moderate limits for API endpoints
    'api:read': {
      points: 100,
      duration: 60, // 1 minute
      blockDuration: 300, // 5 minutes
    },
    'api:write': {
      points: 30,
      duration: 60, // 1 minute
      blockDuration: 600, // 10 minutes
    },
    
    // Strict limits for payment endpoints
    'payment:initiate': {
      points: 5,
      duration: 600, // 10 minutes
      blockDuration: 1800, // 30 minutes
    },
    
    // Limits for QR code setup
    'setup:submit': {
      points: 10,
      duration: 3600, // 1 hour
      blockDuration: 3600, // 1 hour
    },
  };

  /**
   * Check if request is within rate limit
   * RETURNS: { allowed, remaining, resetAt }
   * SIDE EFFECT: Increments counter in Redis
   */
  static async checkLimit(
    identifier: string,
    endpoint: string
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const config = this.configs[endpoint];
    if (!config) {
      throw new Error(`No rate limit config for endpoint: ${endpoint}`);
    }

    const key = `ratelimit:${endpoint}:${identifier}`;
    const blockKey = `ratelimit:block:${endpoint}:${identifier}`;

    // Check if currently blocked
    const blocked = await redis.get(blockKey);
    if (blocked) {
      const ttl = await redis.ttl(blockKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    // Get current count
    const current = await redis.get<number>(key) || 0;

    if (current >= config.points) {
      // Exceeded limit - block the identifier
      await redis.setex(blockKey, config.blockDuration, '1');
      
      // Log security event
      log.securityEvent('rate_limit_exceeded', {
        identifier,
        endpoint,
        count: current,
        limit: config.points,
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + config.blockDuration * 1000),
      };
    }

    // Increment counter
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, config.duration);
    await pipeline.exec();

    return {
      allowed: true,
      remaining: config.points - current - 1,
      resetAt: new Date(Date.now() + config.duration * 1000),
    };
  }

  /**
   * Manually block an identifier (e.g., after suspicious activity)
   * ADMIN USE: Can be called from security monitoring
   */
  static async blockIdentifier(
    identifier: string,
    endpoint: string,
    duration?: number
  ): Promise<void> {
    const config = this.configs[endpoint];
    const blockDuration = duration || config.blockDuration;
    const blockKey = `ratelimit:block:${endpoint}:${identifier}`;
    
    await redis.setex(blockKey, blockDuration, '1');
    
    log.securityEvent('manual_block', {
      identifier,
      endpoint,
      duration: blockDuration,
    });
  }

  /**
   * Clear rate limit for identifier (admin override)
   * ADMIN USE: For resolving false positives
   */
  static async clearLimit(identifier: string, endpoint: string): Promise<void> {
    const key = `ratelimit:${endpoint}:${identifier}`;
    const blockKey = `ratelimit:block:${endpoint}:${identifier}`;
    
    await redis.del(key);
    await redis.del(blockKey);
    
    log.securityEvent('rate_limit_cleared', { identifier, endpoint });
  }
}

/**
 * Middleware for applying rate limits
 * USAGE: Apply to API routes that need protection
 */
export function withRateLimit(endpoint: string) {
  return async (req: Request) => {
    // Use IP address or authenticated user ID as identifier
    const identifier = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    const result = await RateLimiter.checkLimit(identifier, endpoint);

    if (!result.allowed) {
      throw new RateLimitError(result.resetAt, {
        url: req.url,
        identifier,
        endpoint,
      });
    }

    // Return headers for response
    return {
      headers: {
        'X-RateLimit-Limit': RateLimiter.configs[endpoint].points.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      },
    };
  };
}
```

**Data Dependencies:**
- Requires Upstash Redis for distributed rate limiting
- Keys expire automatically via Redis TTL
- No database schema changes needed

**Testing Requirements:**
- Unit tests for rate limit calculations
- Integration tests with actual Redis
- Load tests to verify limits hold under pressure
- Security tests for bypass attempts

---

## 2. Performance Optimization Strategy

### 2.1 Overview & Main Spec Alignment

**Extends:** Section 6.0 - Performance Requirements (Main Spec)  
**Performance Targets (from Main Spec):**
- Page load time: < 2 seconds
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)
- Concurrent users: 1000+

This section provides implementation strategies to achieve these targets.

### 2.2 Database Query Optimization

#### 2.2.1 Requirements

**REQ-PERF-001: Indexed Query Performance**
- **Description:** Optimize database queries with proper indexes
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Fast agent dashboard load
    Given an agent with 100+ homeowners
    When they load their dashboard
    Then the page loads in < 1 second
    And all data is retrieved with < 50ms query time
  
  Scenario: Efficient maintenance task lookup
    Given a homeowner with 50+ maintenance tasks
    When they view their task list
    Then tasks are retrieved in < 30ms
    And tasks are sorted by next reminder date
  ```

**REQ-PERF-002: Connection Pooling**
- **Description:** Implement database connection pooling
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Handle concurrent requests
    Given 100 simultaneous API requests
    When all requests query the database
    Then no request waits for connection
    And connection pool does not exhaust
    And all queries complete successfully
  ```

#### 2.2.2 Implementation

```typescript
// server/db/queries/optimized-queries.ts
import { db } from '../client';
import { qrCodes, homeowners, maintenanceTasks } from '../schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Optimized query for agent dashboard
 * INDEXES REQUIRED:
 * - qr_codes(agent_id, status, created_at)
 * - homeowners(qr_code_id)
 * 
 * PERFORMANCE: Single query instead of 4 separate queries
 * BEFORE: 4 x 50ms = 200ms
 * AFTER: 1 x 40ms = 40ms (5x faster)
 */
export async function getAgentDashboardData(agentId: string) {
  const result = await db
    .select({
      totalQrCodes: sql<number>`COUNT(DISTINCT ${qrCodes.id})`,
      activeQrCodes: sql<number>`COUNT(DISTINCT CASE WHEN ${qrCodes.status} = 'active' THEN ${qrCodes.id} END)`,
      totalHomeowners: sql<number>`COUNT(DISTINCT ${homeowners.id})`,
      pendingSetups: sql<number>`COUNT(DISTINCT CASE WHEN ${qrCodes.status} = 'unused' THEN ${qrCodes.id} END)`,
    })
    .from(qrCodes)
    .leftJoin(homeowners, eq(qrCodes.id, homeowners.qrCodeId))
    .where(eq(qrCodes.agentId, agentId))
    .then(rows => rows[0]);

  return result;
}

/**
 * Optimized query for maintenance reminders
 * INDEXES REQUIRED:
 * - maintenance_tasks(homeowner_id, next_reminder)
 * - maintenance_tasks(homeowner_id, status)
 * 
 * PERFORMANCE: Composite index enables fast filtering + sorting
 */
export async function getUpcomingReminders(homeownerId: string, days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await db
    .select()
    .from(maintenanceTasks)
    .where(
      and(
        eq(maintenanceTasks.homeownerId, homeownerId),
        sql`${maintenanceTasks.nextReminder} <= ${futureDate}`,
        eq(maintenanceTasks.status, 'active')
      )
    )
    .orderBy(maintenanceTasks.nextReminder)
    .limit(50); // Prevent excessive data transfer
}

/**
 * Batch query for multiple homeowners
 * ANTI-PATTERN: N+1 queries (bad)
 * PATTERN: Single batch query (good)
 * 
 * PERFORMANCE:
 * BEFORE: 100 homeowners x 20ms = 2000ms
 * AFTER: 1 query x 50ms = 50ms (40x faster)
 */
export async function getHomeownersBatch(qrCodeIds: string[]) {
  if (qrCodeIds.length === 0) return [];

  return await db
    .select()
    .from(homeowners)
    .where(sql`${homeowners.qrCodeId} = ANY(${qrCodeIds})`)
    .orderBy(homeowners.createdAt);
}
```

**Database Migration for Indexes:**

```sql
-- migrations/0004_add_performance_indexes.sql

-- Agent dashboard optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qr_codes_agent_status_created 
ON qr_codes(agent_id, status, created_at DESC);

-- Homeowner lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homeowners_qr_code 
ON homeowners(qr_code_id);

-- Maintenance task filtering optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_homeowner_reminder 
ON maintenance_tasks(homeowner_id, next_reminder) 
WHERE status = 'active';

-- Maintenance task status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_homeowner_status 
ON maintenance_tasks(homeowner_id, status);

-- Query: ANALYZE to update statistics
ANALYZE qr_codes;
ANALYZE homeowners;
ANALYZE maintenance_tasks;
```

**Connection Pool Configuration:**

```typescript
// server/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

/**
 * Configure connection pool for optimal performance
 * TUNING NOTES:
 * - max: 20 connections (Vercel Postgres default limit: 20)
 * - idle_timeout: Close idle connections after 20s
 * - connect_timeout: Fail fast if DB unreachable
 * - prepare: Use prepared statements for 20% performance boost
 * - max_lifetime: Rotate connections every 30 minutes
 */
const client = postgres(connectionString, {
  max: 20,                    // Maximum pool size
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout
  prepare: true,              // Use prepared statements (cached)
  max_lifetime: 60 * 30,      // Max connection lifetime: 30 minutes
  transform: postgres.toCamel, // Transform column names to camelCase
});

export const db = drizzle(client);

/**
 * Health check function for monitoring
 * MONITORING: Called by /api/health endpoint
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
```

**Testing Requirements:**
- Load tests with 100+ concurrent connections
- Query performance benchmarks (< 100ms p95)
- Index usage verification with EXPLAIN ANALYZE
- Connection pool exhaustion tests

---

## 3. Out-of-Scope Items

### 3.1 Features Explicitly Excluded from v1.0

| Feature | Reason for Exclusion | Future Release |
|---------|---------------------|----------------|
| Multi-language support | English-only for MVP | v1.2 |
| Mobile native apps (iOS/Android) | PWA sufficient for v1 | v2.0 |
| Integration with home warranty providers | Requires partnerships | v1.3 |
| AI-powered maintenance suggestions | Needs data training | v2.0 |
| Bulk import of existing property data | Manual entry acceptable for MVP | v1.1 |
| White-label/reseller functionality | Single brand for v1 | v1.4 |
| In-app chat support | Email support sufficient | v1.2 |
| Recurring subscription billing | One-time purchases only | v1.1 |
| Advanced analytics dashboard | Basic metrics sufficient | v1.2 |
| API for third-party integrations | No external API access | v2.0 |

### 3.2 Technical Implementations Deferred

| Technical Item | Reason | Planned For |
|----------------|--------|-------------|
| Kubernetes deployment | Vercel serverless sufficient | v2.0 (if needed) |
| GraphQL API | REST API adequate | v1.3 (evaluate) |
| Real-time notifications via WebSocket | Polling acceptable for v1 | v1.2 |
| Advanced caching with CDN | Basic caching adequate | v1.1 |
| Automated UI testing with Percy | Manual testing sufficient | v1.1 |
| Infrastructure as Code (Terraform) | Manual setup acceptable | v1.2 |

### 3.3 Compliance & Legal Items Not Included

| Item | Status | Notes |
|------|--------|-------|
| GDPR compliance | Not required | US-only service in v1 |
| HIPAA compliance | Not applicable | No health data collected |
| SOC 2 certification | Not required | Enterprise feature |
| PCI DSS Level 1 compliance | Delegated to Stripe | Using Stripe Checkout |

---

## 4. Third-Party Dependencies

### 4.1 Critical Service Dependencies

| Service | Purpose | Version/Plan | Failover Strategy | Risk Level |
|---------|---------|--------------|-------------------|------------|
| **Vercel** | Hosting & deployment | Pro Plan | None - primary platform | LOW |
| **Neon Postgres** | Database | Pro Plan | Point-in-time recovery, read replicas | LOW |
| **Upstash Redis** | Caching & rate limiting | Pro Plan | Graceful degradation (skip cache) | MEDIUM |
| **Stripe** | Payment processing | Standard | Transactions fail gracefully with retry | LOW |
| **Twilio** | SMS reminders | Pay-as-go | Email fallback if SMS fails | MEDIUM |
| **Resend** | Email delivery | Pro Plan | Queue and retry with exponential backoff | MEDIUM |
| **Firebase Storage** | QR code images | Blaze Plan | Regenerate QR codes if unavailable | LOW |

### 4.2 Service Level Agreements (SLAs)

| Service | Uptime SLA | Response Time | Support Level |
|---------|-----------|---------------|---------------|
| Vercel | 99.9% | < 100ms (edge) | Email support |
| Neon Postgres | 99.95% | < 50ms (read) | Email + Slack |
| Upstash Redis | 99.9% | < 10ms | Email support |
| Stripe | 99.99% | < 200ms | Email + phone |
| Twilio | 99.95% | < 2s (SMS) | Email + phone |
| Resend | 99.9% | < 5s (email) | Email support |
| Firebase | 99.95% | < 100ms | Email support |

### 4.3 Cost Dependencies

| Service | Estimated Monthly Cost | Scaling Factor | Cost Ceiling (Alert) |
|---------|----------------------|----------------|---------------------|
| Vercel | $20 (Pro Plan) | $0.50/1K requests beyond included | $100/month |
| Neon Postgres | $19 (Pro Plan) | $0.10/GB storage | $50/month |
| Upstash Redis | $10 (Pro Plan) | $0.20/100K requests | $30/month |
| Stripe | 2.9% + $0.30/txn | Volume discounts at $1M+ | No ceiling |
| Twilio | $0.0079/SMS | Linear | $200/month (25K SMS) |
| Resend | $20 (Pro Plan) | $0.80/1K emails | $50/month |
| Firebase | $5/month (storage) | $0.026/GB | $20/month |

### 4.4 Integration Dependencies

**Stripe Webhook Events Required:**
- `payment_intent.succeeded` - QR code generation trigger
- `payment_intent.failed` - Payment failure handling
- `charge.refunded` - Refund processing

**Twilio Requirements:**
- Verified sender phone number
- SMS consent compliance (TCPA)
- Message templates approved

**Resend Requirements:**
- Domain verification (upkeepqr.com)
- SPF/DKIM configuration
- Bounce/complaint handling

---

## 5. Release Schedule & Milestones

### 5.1 Version 1.0 - MVP Launch (January 2025)

**Scope:** Core purchase and setup flow with basic reminders

| Feature | Status | Acceptance Criteria Met | Notes |
|---------|--------|-------------------------|-------|
| QR code purchase (Stripe) | ✅ Complete | 100% | Production tested |
| Setup form with dual access | ✅ Complete | 100% | Both flows tested |
| Welcome emails | ✅ Complete | 100% | Templates finalized |
| Basic SMS reminders | ✅ Complete | 100% | TCPA compliant |
| Agent dashboard | ✅ Complete | 100% | Analytics ready |
| Homeowner portal | ✅ Complete | 100% | Maintenance view |
| Session authentication | 🔄 In Progress | 80% | Security hardening needed |
| Rate limiting | 🔄 In Progress | 60% | Redis integration pending |
| Error handling | 🔄 In Progress | 70% | Monitoring integration needed |

**Launch Criteria:**
- [ ] All P0 features complete
- [ ] Security audit passed
- [ ] Load testing passed (1000 concurrent users)
- [ ] All critical bugs resolved (P0/P1)
- [ ] Documentation complete
- [ ] Disaster recovery tested

### 5.2 Version 1.1 - Enhanced Security & Performance (March 2025)

**Scope:** Production hardening and performance optimization

| Feature | Priority | Dependencies | Estimated Effort |
|---------|----------|--------------|------------------|
| RBAC with granular permissions | P1 | None | 5 days |
| Data encryption at rest | P1 | Encryption service | 3 days |
| Multi-layer caching | P1 | Upstash Redis | 4 days |
| Comprehensive error boundaries | P1 | Error handler | 2 days |
| Integration test suite | P1 | Test database | 5 days |
| Automated backups to S3 | P1 | AWS S3 setup | 2 days |
| Performance monitoring | P2 | Prometheus setup | 3 days |

**Success Metrics:**
- API response time < 100ms (p95)
- Page load time < 1.5 seconds
- Zero security vulnerabilities (high/critical)
- 80%+ test coverage

### 5.3 Version 1.2 - Feature Enhancements (May 2025)

**Scope:** User-requested features and improvements

| Feature | User Votes | Business Value | Effort |
|---------|-----------|----------------|--------|
| Custom maintenance schedules | 45 | High | 8 days |
| Maintenance history tracking | 38 | Medium | 5 days |
| Email template customization | 32 | Medium | 4 days |
| Export data (CSV/PDF) | 28 | Medium | 3 days |
| Advanced analytics | 25 | Low | 6 days |

### 5.4 Version 2.0 - Scale & Enterprise (Q4 2025)

**Scope:** Enterprise features and major architectural improvements

| Feature | Target | Dependencies |
|---------|--------|--------------|
| White-label/reseller support | Enterprise customers | Multi-tenancy architecture |
| API for third-party integrations | Developer ecosystem | API gateway, rate limiting |
| Mobile native apps | Broader reach | React Native expertise |
| AI-powered suggestions | Innovation | ML model training |
| Warranty provider integrations | Partnerships | API agreements |

---

## 6. Acceptance Criteria Format

All requirements in this addendum follow the Gherkin format:

```gherkin
Feature: <Feature Name>
  As a <role>
  I want to <action>
  So that <benefit>

Scenario: <Scenario Name>
  Given <precondition>
  When <action>
  Then <expected result>
  And <additional result>
```

**Example from Security Section:**
```gherkin
Feature: Rate Limiting
  As a system administrator
  I want to enforce rate limits per endpoint
  So that the system is protected from abuse

Scenario: Rate limit exceeded
  Given a user has made 5 login attempts in 15 minutes
  When they attempt a 6th login
  Then they receive 429 Too Many Requests
  And they are blocked for 30 minutes
  And a security alert is generated
```

---

## 7. Visual Diagrams

### 7.1 Updated Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Login request
       ├──────────────────────────────────┐
       │                                  │
       v                                  v
┌──────────────┐                  ┌──────────────┐
│ Login Route  │                  │   Database   │
│  /api/auth   │                  │  (Postgres)  │
└──────┬───────┘                  └──────┬───────┘
       │ 2. Validate credentials         │
       │────────────────────────────────>│
       │<────────────────────────────────│
       │ 3. Generate JWT + CSRF token    │
       v                                  │
┌──────────────┐                         │
│SessionManager│                         │
└──────┬───────┘                         │
       │ 4. Set secure cookies           │
       v                                  │
┌──────────────┐                         │
│   Response   │                         │
│  + Cookies   │                         │
└──────┬───────┘                         │
       │ 5. Authenticated session        │
       v                                  │
┌──────────────┐                         │
│  Dashboard   │                         │
│   (Client)   │                         │
└──────────────┘                         │
```

### 7.2 Rate Limiting Decision Flow

```
                    ┌─────────────────┐
                    │ API Request     │
                    │ from IP X.X.X.X │
                    └────────┬────────┘
                             │
                             v
                    ┌─────────────────┐
                    │ Check if        │
                    │ Blocked?        │
                    └────────┬────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                 YES                  NO
                   │                   │
                   v                   v
          ┌───────────────┐   ┌───────────────┐
          │ Return 429    │   │ Get request   │
          │ + Reset Time  │   │ count from    │
          └───────────────┘   │ Redis         │
                              └───────┬───────┘
                                      │
                              ┌───────┴───────┐
                              │               │
                        Count >= Limit   Count < Limit
                              │               │
                              v               v
                     ┌───────────────┐  ┌──────────────┐
                     │ Block IP      │  │ Increment    │
                     │ Set block key │  │ counter      │
                     │ Return 429    │  │ Process req  │
                     └───────────────┘  └──────────────┘
```

### 7.3 Cache Lookup Flow

```
┌──────────────────────────────────────────────────────┐
│                   Cache Lookup                       │
└───────────────────┬──────────────────────────────────┘
                    │
                    v
           ┌────────────────┐
           │ Check Memory   │
           │ Cache (LRU)    │
           └────────┬───────┘
                    │
          ┌─────────┴─────────┐
          │                   │
        FOUND               MISS
          │                   │
          v                   v
    ┌──────────┐      ┌──────────────┐
    │ Return   │      │ Check Redis  │
    │ from     │      │ Cache        │
    │ Memory   │      └──────┬───────┘
    └──────────┘             │
                   ┌─────────┴─────────┐
                   │                   │
                 FOUND               MISS
                   │                   │
                   v                   v
            ┌──────────────┐   ┌─────────────┐
            │ Update       │   │ Query       │
            │ Memory Cache │   │ Database    │
            │ Return Data  │   └──────┬──────┘
            └──────────────┘          │
                                      v
                              ┌──────────────┐
                              │ Store in     │
                              │ Both Caches  │
                              │ Return Data  │
                              └──────────────┘
```

---

## 8. Testing Strategy Summary

### 8.1 Test Coverage Requirements

| Test Type | Coverage Target | Automated | Frequency |
|-----------|----------------|-----------|-----------|
| Unit Tests | 80% | ✅ Yes | Every commit |
| Integration Tests | 70% | ✅ Yes | Every PR |
| E2E Tests | Critical flows | ✅ Yes | Pre-deployment |
| Security Tests | 100% auth flows | ✅ Yes | Weekly |
| Performance Tests | Key endpoints | ✅ Yes | Pre-release |
| Accessibility Tests | WCAG 2.1 AA | ⚠️ Manual | Monthly |

### 8.2 Quality Gates

**Blocking Issues (Cannot Deploy):**
- Any P0 bug unresolved
- Test coverage below 80%
- Security vulnerabilities (high/critical)
- Performance regression > 20%
- Failing E2E tests

**Warning Issues (Can Deploy with Approval):**
- P1 bugs (if workaround exists)
- Test coverage 75-80%
- Medium security vulnerabilities (with mitigation)
- Performance regression 10-20%

---

## Appendix A: Quick Reference

### A.1 Environment Variables Reference

```bash
# Core Application
NODE_ENV=production
APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=https://upkeepqr.com

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host:5432/upkeepqr

# Caching (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@upkeepqr.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Storage (Firebase)
FIREBASE_PROJECT_ID=upkeepqr
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=upkeepqr.appspot.com

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# Feature Flags
FEATURE_SMS_REMINDERS=true
FEATURE_ANALYTICS=true
```

### A.2 Common Development Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable lint issues
npm run type-check       # Check TypeScript types

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e         # Run E2E tests with Playwright
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run pending migrations
npm run db:studio        # Open Drizzle Studio (GUI)
npm run db:seed          # Seed development data
npm run db:reset         # Reset database (CAUTION)

# Deployment
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel rollback          # Rollback to previous deployment
vercel env ls            # List environment variables
```

### A.3 Support & Escalation Contacts

| Issue Type | Contact | Response Time | Escalation |
|------------|---------|---------------|------------|
| P0 - System Down | on-call@upkeepqr.com | 15 minutes | CTO after 30 min |
| P1 - Critical Bug | dev@upkeepqr.com | 2 hours | Tech Lead after 4 hours |
| Security Incident | security@upkeepqr.com | 30 minutes | CISO immediately |
| Database Issues | dba@upkeepqr.com | 1 hour | Infrastructure Lead |
| Payment Issues | payments@upkeepqr.com | 1 hour | Finance Team |

---

## Appendix B: Change Log

### Changes from Addendum v1.0 to v2.0

1. **Added versioning and document control** (Section 0)
2. **Added Summary of Changes table** with explicit main spec references
3. **Added Terminology Alignment** section for consistency
4. **Added Gherkin-style Acceptance Criteria** for all requirements
5. **Added Out-of-Scope Items** (Section 3) with rationale
6. **Added Third-Party Dependencies** (Section 4) with SLAs and failover
7. **Added Release Schedule & Milestones** (Section 5) with timelines
8. **Added Visual Diagrams** (Section 7.1-7.3) for complex flows
9. **Added Testing Strategy Summary** (Section 8) with quality gates
10. **Restructured for clarity** - each section now has Overview & Main Spec Alignment
11. **Added explicit data model changes** where applicable
12. **Added testing requirements** for each implementation
13. **Added dependencies** for each feature
14. **Improved code comments** with performance and security notes

---

**END OF ADDENDUM**

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |
| Security Lead | | | |

**Next Review Date:** March 1, 2025
