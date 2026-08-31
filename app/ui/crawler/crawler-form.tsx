'use client';

import { useState } from 'react';
import { ParsedEndpoint } from '@/app/lib/definitions';
import { crawlOpenApi, saveApiEndpoints } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

type CrawlerStatus = 'idle' | 'crawling' | 'success' | 'error';

export default function CrawlerForm() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<CrawlerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleCrawl = async () => {
    if (!url.trim()) return;

    setStatus('crawling');
    setError(null);
    setEndpoints([]);
    setSaveStatus('idle');

    const result = await crawlOpenApi(url);

    if (result.error) {
      setStatus('error');
      setError(result.error);
    } else {
      setStatus('success');
      setEndpoints(result.endpoints);
    }
  };

  const handleSave = async () => {
    if (endpoints.length === 0) return;

    setSaveStatus('saving');
    const result = await saveApiEndpoints(endpoints, url);

    if (result.success) {
      setSaveStatus('saved');
      setEndpoints([]);
      setUrl('');
      setStatus('idle');
    } else {
      setSaveStatus('error');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-700';
      case 'POST': return 'bg-green-100 text-green-700';
      case 'PUT': return 'bg-orange-100 text-orange-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'PATCH': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="rounded-md bg-gray-50 p-4 md:p-6">
      {/* URL Input */}
      <div className="mb-4">
        <label htmlFor="url" className="mb-2 block text-sm font-medium">
          OpenAPI / Swagger JSON URL
        </label>
        <div className="flex gap-2">
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://petstore.swagger.io/v2/swagger.json"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
          />
          <Button onClick={handleCrawl} disabled={status === 'crawling' || !url.trim()}>
            {status === 'crawling' ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                爬取中...
              </>
            ) : (
              '开始爬取'
            )}
          </Button>
        </div>
      </div>

      {/* Status Display */}
      {status === 'error' && error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <XCircleIcon className="h-5 w-5" />
          {error}
        </div>
      )}

      {status === 'success' && endpoints.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
          <CheckCircleIcon className="h-5 w-5" />
          爬取成功，共找到 {endpoints.length} 个接口
        </div>
      )}

      {status === 'success' && endpoints.length === 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-600">
          <XCircleIcon className="h-5 w-5" />
          未找到任何接口
        </div>
      )}

      {/* Endpoints Preview */}
      {status === 'success' && endpoints.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium">接口预览</h3>
          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">方法</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">路径</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">描述</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {endpoints.slice(0, 50).map((ep, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${getMethodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{ep.path}</td>
                    <td className="px-3 py-2 text-gray-500">{ep.summary || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {endpoints.length > 50 && (
              <p className="p-2 text-center text-sm text-gray-500">
                仅显示前 50 条，共 {endpoints.length} 条
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      {status === 'success' && endpoints.length > 0 && (
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          >
            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存到数据库'}
          </Button>
        </div>
      )}
    </div>
  );
}
