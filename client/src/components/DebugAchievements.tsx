import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export function DebugAchievements() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecalculate = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/debug/recalculate-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setResult(response);
    } catch (error) {
      console.error('Error recalculating achievements:', error);
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Debug Achievement System</CardTitle>
        <CardDescription>
          Manually trigger achievement recalculation to fix missing win streak achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleRecalculate} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Recalculating...' : 'Recalculate Achievements'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Results:</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}