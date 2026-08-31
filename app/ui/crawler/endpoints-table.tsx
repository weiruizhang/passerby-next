'use client';

import { ApiEndpoint } from '@/app/lib/definitions';

type Props = {
  endpoints: ApiEndpoint[];
};

export default function EndpointsTable({ endpoints }: Props) {
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

  if (endpoints.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-8 text-center text-gray-500">
        暂无保存的接口数据
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-md bg-white shadow">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-medium">已保存的接口列表</h2>
        <p className="text-sm text-gray-500">共 {endpoints.length} 个接口</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">来源</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">方法</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">路径</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">描述</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">保存时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {endpoints.map((ep) => (
              <tr key={ep.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={ep.source_url}>
                  {ep.source_url}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${getMethodColor(ep.method)}`}>
                    {ep.method}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{ep.path}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={ep.summary || ''}>
                  {ep.summary || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(ep.created_at).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
