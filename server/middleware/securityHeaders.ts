import { Request, Response, NextFunction } from 'express';

interface SecurityHeadersConfig {
  contentSecurityPolicy?: false | {
    directives?: {
      defaultSrc?: string[];
      scriptSrc?: string[];
      styleSrc?: string[];
      imgSrc?: string[];
      connectSrc?: string[];
      fontSrc?: string[];
      objectSrc?: string[];
      mediaSrc?: string[];
      frameSrc?: string[];
      workerSrc?: string[];
      frameAncestors?: string[];
      formAction?: string[];
      baseUri?: string[];
      upgradeInsecureRequests?: boolean;
    };
    reportUri?: string;
    reportOnly?: boolean;
  };
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?:
    | 'same-origin'
    | 'same-origin-allow-popups'
    | 'unsafe-none'
    | string;
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin' | string;
  originAgentCluster?: boolean;
  referrerPolicy?: string;
  strictTransportSecurity?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xContentTypeOptions?: boolean;
  xDNSPrefetchControl?: boolean | { allow: boolean };
  xFrameOptions?: {
    action: 'DENY' | 'SAMEORIGIN' | string;
    allowFrom?: string;
  };
  xPermittedCrossDomainPolicies?: string;
  xXSSProtection?: boolean;
  permissionsPolicy?: Record<string, string[]>;
}

const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://js.stripe.com',
        'https://unpkg.com',
        'https://cdn.thermoneural.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://unpkg.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://cdn.thermoneural.com',
        'https://*.supabase.co',
      ],
      connectSrc: [
        "'self'",
        'https:',
        'https://*.supabase.co',
        'https://api.stripe.com',
        'https://*.thermoneural.com',
      ],
      fontSrc: [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
      ],
      workerSrc: ["'self'", 'blob:'],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: true,
    },
    reportUri: '/csp-report',
    reportOnly: false,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  originAgentCluster: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: true,
  xDNSPrefetchControl: {
    allow: false,
  },
  xFrameOptions: {
    action: 'SAMEORIGIN',
  },
  xPermittedCrossDomainPolicies: 'none',
  xXSSProtection: true,
  permissionsPolicy: {
    accelerometer: ['self'],
    camera: ['self'],
    geolocation: ['self'],
    gyroscope: ['self'],
    magnetometer: ['self'],
    microphone: ['self'],
    payment: ['self'],
    usb: ['self'],
  },
};

export function securityHeaders(config: SecurityHeadersConfig = defaultConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (config.contentSecurityPolicy) {
      const csp = buildContentSecurityPolicy(config.contentSecurityPolicy);
      if (config.contentSecurityPolicy.reportOnly) {
        res.setHeader('Content-Security-Policy-Report-Only', csp);
      } else {
        res.setHeader('Content-Security-Policy', csp);
      }
    }

    if (config.crossOriginEmbedderPolicy !== undefined) {
      res.setHeader('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy ? 'require-corp' : 'unsafe-none');
    }

    if (config.crossOriginOpenerPolicy) {
      res.setHeader('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
    }

    if (config.crossOriginResourcePolicy) {
      res.setHeader('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
    }

    if (config.originAgentCluster !== undefined) {
      res.setHeader('Origin-Agent-Cluster', config.originAgentCluster ? '?1' : '?0');
    }

    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }

    if (config.strictTransportSecurity) {
      const sts = [
        `max-age=${config.strictTransportSecurity.maxAge || 31536000}`,
      ];
      if (config.strictTransportSecurity.includeSubDomains) {
        sts.push('includeSubDomains');
      }
      if (config.strictTransportSecurity.preload) {
        sts.push('preload');
      }
      res.setHeader('Strict-Transport-Security', sts.join('; '));
    }

    if (config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    if (config.xDNSPrefetchControl !== undefined) {
      const allow =
        typeof config.xDNSPrefetchControl === 'object'
          ? config.xDNSPrefetchControl.allow
          : Boolean(config.xDNSPrefetchControl);
      res.setHeader('X-DNSPrefetch-Control', allow ? 'on' : 'off');
    }

    if (config.xFrameOptions) {
      if (config.xFrameOptions.action === 'DENY') {
        res.setHeader('X-Frame-Options', 'DENY');
      } else if (config.xFrameOptions.action === 'SAMEORIGIN') {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else if (config.xFrameOptions.allowFrom) {
        res.setHeader('X-Frame-Options', `ALLOW-FROM ${config.xFrameOptions.allowFrom}`);
      }
    }

    if (config.xPermittedCrossDomainPolicies) {
      res.setHeader('X-Permitted-Cross-Domain-Policies', config.xPermittedCrossDomainPolicies);
    }

    if (config.xXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    if (config.permissionsPolicy) {
      const permissions = Object.entries(config.permissionsPolicy)
        .map(([key, value]) => `${key}=(${value.join(' ')})`)
        .join(', ');
      res.setHeader('Permissions-Policy', permissions);
    }

    res.setHeader('X-Cache', 'HIT');
    res.setHeader('X-Database-Requests', '0');

    next();
  };
}

function buildContentSecurityPolicy(config: SecurityHeadersConfig['contentSecurityPolicy']): string {
  if (!config || typeof config !== 'object' || !config.directives) {
    return '';
  }

  const directives: string[] = [];
  const { directives: d, reportUri } = config;

  for (const [key, value] of Object.entries(d)) {
    if (value === undefined || value === null) continue;
    
    const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    if (key === 'upgradeInsecureRequests') {
      if (value === true) {
        directives.push('upgrade-insecure-requests');
      }
    } else if (Array.isArray(value) && value.length > 0) {
      directives.push(`${directive} ${value.join(' ')}`);
    }
  }

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

const defaultContentSecurityPolicy =
  typeof defaultConfig.contentSecurityPolicy === 'object'
    ? defaultConfig.contentSecurityPolicy
    : undefined;

export const strictSecurityHeaders = securityHeaders({
  ...defaultConfig,
  contentSecurityPolicy: {
    ...defaultContentSecurityPolicy,
    directives: {
      ...defaultContentSecurityPolicy?.directives,
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
});

export const apiSecurityHeaders = securityHeaders({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  originAgentCluster: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: true,
  xFrameOptions: {
    action: 'DENY',
  },
  xPermittedCrossDomainPolicies: 'none',
  xXSSProtection: true,
});

export function hidePoweredBy(req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Generated-By', 'ThermoNeural');
  next();
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('X-Request-ID', id);
  (req as any).requestId = id;
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function serverTiming(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.setHeader('Server-Timing', 'total;desc="Total Response Time"');
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('Server-Timing', `total;desc="Total Response Time";dur=${duration}`);
  });
  
  next();
}

export const cspReportingEndpoint = (req: Request, res: Response) => {
  let cspReport;
  try {
    cspReport = req.body['csp-report'] || req.body;
  } catch {
    cspReport = null;
  }
  
  if (cspReport) {
    console.warn('[CSP Violation]', {
      timestamp: new Date().toISOString(),
      documentUri: cspReport['document-uri'],
      violatedDirective: cspReport['violated-directive'],
      blockedUri: cspReport['blocked-uri'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  }
  
  res.status(204).end();
};

export function getSecurityHeaders(_req: Request, res: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  
  const headerNames = [
    'Content-Security-Policy',
    'Cross-Origin-Embedder-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-Permitted-Cross-Domain-Policies',
    'X-XSS-Protection',
    'Permissions-Policy',
  ];
  
  for (const name of headerNames) {
    const value = res.getHeader(name);
    if (value) {
      headers[name] = String(value);
    }
  }
  
  return headers;
}

export function reportSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  const headers = getSecurityHeaders(req, res);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Security Headers]', headers);
  }
  
  next();
}
