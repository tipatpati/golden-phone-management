import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Smartphone, HardDrive, Zap } from 'lucide-react';

export function SerialNumberFormatHelper() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Serial Number Format Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="font-medium">
            <strong>Important:</strong> To display RAM and Storage on thermal labels, include them in your serial numbers using this format:
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-mono text-sm mb-2">
              SERIAL123456789012345 Space Black 256GB 8GB-RAM 85%
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Serial Number
              </Badge>
              <Badge variant="outline">Color</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Storage
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                RAM
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Battery
              </Badge>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <div><strong>Format:</strong> SERIAL [COLOR] [STORAGE] [RAM] [BATTERY%]</div>
            <div><strong>Storage:</strong> 16GB, 32GB, 64GB, 128GB, 256GB, 512GB, 1024GB</div>
            <div><strong>RAM:</strong> 1GB-RAM, 2GB-RAM, 4GB-RAM, 6GB-RAM, 8GB-RAM, 12GB-RAM, 16GB-RAM, etc.</div>
            <div><strong>Battery:</strong> 0% to 100% (e.g., 85%)</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Examples:</div>
            <div className="space-y-1 text-sm font-mono">
              <div>IMEI123456789012345 Black 128GB 6GB-RAM 90%</div>
              <div>SER001 Red 64GB 4GB-RAM</div>
              <div>ABC123 256GB 8GB-RAM</div>
              <div>XYZ789 512GB</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}