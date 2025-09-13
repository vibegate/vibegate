import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatchAllPage({ params, searchParams }: PageProps) {
  const headersList = await headers();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const requestHeaders: Record<string, string> = {};

  headersList.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  const currentPath = resolvedParams.slug ? `/${resolvedParams.slug.join('/')}` : '/';

  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: requestHeaders['x-forwarded-method'] || 'GET',
    path: currentPath,
    searchParams: resolvedSearchParams,
    url: requestHeaders['x-forwarded-url'] || requestHeaders['host'] + currentPath,
    headers: requestHeaders,
    ip: requestHeaders['x-forwarded-for'] ||
        requestHeaders['x-real-ip'] ||
        requestHeaders['remote-addr'] || 'unknown',
    userAgent: requestHeaders['user-agent'] || 'unknown',
    protocol: requestHeaders['x-forwarded-proto'] || 'http'
  };


  return (
    <div style={{ fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '24px' }}>🔍 Request Debugger</h1>

      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '12px' }}>📋 Request Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
          <strong>Timestamp:</strong> <span>{requestInfo.timestamp}</span>
          <strong>Method:</strong> <span style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>{requestInfo.method}</span>
          <strong>Path:</strong> <span style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>{requestInfo.path}</span>
          <strong>URL:</strong> <span>{requestInfo.url}</span>
          <strong>Protocol:</strong> <span>{requestInfo.protocol}</span>
          <strong>IP Address:</strong> <span>{requestInfo.ip}</span>
          <strong>User Agent:</strong> <span style={{ wordBreak: 'break-all' }}>{requestInfo.userAgent}</span>
        </div>
      </div>

      {Object.keys(requestInfo.searchParams).length > 0 && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#1e293b', marginBottom: '12px' }}>🔍 Query Parameters</h2>
          <pre style={{
            backgroundColor: '#0c4a6e',
            color: '#e0f2fe',
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
{JSON.stringify(requestInfo.searchParams, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '12px' }}>📤 Request Headers</h2>
        <pre style={{
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
{JSON.stringify(requestInfo.headers, null, 2)}
        </pre>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px'
      }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          💡 <strong>Usage:</strong> 将其他服务的请求转发到这个调试器来查看完整的请求详情。
          在VibeGate中配置代理路由指向此调试器服务即可。访问任何路径都会显示对应的路由信息。
        </p>
      </div>
    </div>
  );
}