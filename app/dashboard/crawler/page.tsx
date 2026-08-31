import { lusitana } from '@/app/ui/fonts';
import { fetchApiEndpoints } from '@/app/lib/data';
import CrawlerForm from '@/app/ui/crawler/crawler-form';
import EndpointsTable from '@/app/ui/crawler/endpoints-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文档爬取',
};

export default async function Page() {
  const endpoints = await fetchApiEndpoints();

  return (
    <main>
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>API 文档爬取</h1>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        输入 OpenAPI / Swagger JSON URL，爬取并保存接口文档
      </p>

      <div className="mt-6">
        <CrawlerForm />
      </div>

      <EndpointsTable endpoints={endpoints} />
    </main>
  );
}
