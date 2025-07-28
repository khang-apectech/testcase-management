"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";

interface TestApiCallsProps {
  projectId?: string;
}

export function TestApiCalls({ projectId }: TestApiCallsProps) {
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string>("");

  const testApi = async (apiPath: string, label: string) => {
    setLoading(label);
    try {
      const response = await fetchWithAuth(apiPath);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [label]: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));

      toast({
        title: response.ok ? "Thành công" : "Lỗi",
        description: `${label}: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [label]: {
          status: "ERROR",
          ok: false,
          error: error.message
        }
      }));
      
      toast({
        title: "Lỗi",
        description: `${label}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading("");
    }
  };

  const tests = [
    {
      label: "Admin Testers",
      path: "/api/admin/testers"
    },
    ...(projectId ? [
      {
        label: "Project Testers",
        path: `/api/projects/${projectId}/testers`
      },
      {
        label: "Available Testers",
        path: `/api/projects/${projectId}/available-testers`
      }
    ] : []),
    {
      label: "Tất cả người dùng",
      path: "/api/users"
    },
    {
      label: "Dữ liệu Debug",
      path: "/api/debug/test-assignments"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test API Calls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tests.map((test) => (
            <Button
              key={test.label}
              variant="outline"
              onClick={() => testApi(test.path, test.label)}
              disabled={loading === test.label}
            >
              {loading === test.label ? "Testing..." : `Test ${test.label}`}
            </Button>
          ))}
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Results:</h3>
            {Object.entries(results).map(([label, result]: [string, any]) => (
              <div key={label} className="p-4 border rounded-lg">
                <div className="font-medium flex items-center justify-between">
                  <span>{label}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}