"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        connected ? "bg-emerald-500" : "bg-gray-300"
      }`}
    />
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 rounded-md bg-muted p-4 text-sm overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API 串接指南</h1>

      {/* Section 1: GA4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StatusDot connected={false} />
            <CardTitle>Google Analytics 4 設定</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepList
            steps={[
              "前往 Google Cloud Console 建立新專案 (或選擇現有專案)",
              "啟用 Google Analytics Data API",
              "建立服務帳戶 (Service Account)，並授予 GA4 屬性的檢視者權限",
              "下載服務帳戶的 JSON 金鑰檔案",
              "將金鑰內容加入 .env 環境變數",
            ]}
          />
          <CodeBlock
            code={`# .env
GA4_PROPERTY_ID=your_property_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
          />
        </CardContent>
      </Card>

      {/* Section 2: Meta Marketing API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StatusDot connected={false} />
            <CardTitle>Meta Marketing API 設定</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepList
            steps={[
              "前往 Meta for Developers 建立應用程式",
              "取得長期存取權杖 (Long-lived Access Token)",
              "找到您的廣告帳戶 ID (Ad Account ID，格式: act_XXXXXXXXX)",
              "將以上資訊加入 .env 環境變數",
            ]}
          />
          <CodeBlock
            code={`# .env
META_ACCESS_TOKEN=your_long_lived_access_token
META_AD_ACCOUNT_ID=act_XXXXXXXXX`}
          />
        </CardContent>
      </Card>

      {/* Section 3: Anthropic API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StatusDot connected={false} />
            <CardTitle>Anthropic API 設定 (選配)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepList
            steps={[
              "前往 console.anthropic.com 取得 API Key",
              "將 API Key 加入 .env 環境變數",
            ]}
          />
          <CodeBlock
            code={`# .env
ANTHROPIC_API_KEY=sk-ant-...`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
