import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/enhanced-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  autoFixable?: boolean;
}

export function SecurityComplianceChecker() {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const performSecurityChecks = async () => {
    setIsRunning(true);
    const results: SecurityCheck[] = [];

    // Check 1: HTTPS Usage
    results.push({
      id: 'https',
      name: 'HTTPS Connection',
      description: 'Verifica che l\'applicazione utilizzi HTTPS',
      status: location.protocol === 'https:' ? 'pass' : 'fail',
      severity: location.protocol === 'https:' ? 'low' : 'critical',
      recommendation: 'Assicurarsi che l\'applicazione sia servita tramite HTTPS in produzione'
    });

    // Check 2: Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    results.push({
      id: 'csp',
      name: 'Content Security Policy',
      description: 'Verifica la presenza di Content Security Policy',
      status: cspMeta ? 'pass' : 'warning',
      severity: cspMeta ? 'low' : 'medium',
      recommendation: 'Implementare Content Security Policy per prevenire attacchi XSS'
    });

    // Check 3: Web Crypto API
    results.push({
      id: 'webcrypto',
      name: 'Web Crypto API',
      description: 'Verifica la disponibilità di Web Crypto API per crittografia sicura',
      status: !!window.crypto?.subtle ? 'pass' : 'fail',
      severity: !!window.crypto?.subtle ? 'low' : 'high',
      recommendation: 'Web Crypto API è necessario per operazioni crittografiche sicure'
    });

    // Check 4: Local Storage Security
    try {
      const testKey = 'security_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      results.push({
        id: 'localstorage',
        name: 'Local Storage Access',
        description: 'Verifica l\'accesso sicuro al Local Storage',
        status: 'pass',
        severity: 'low'
      });
    } catch {
      results.push({
        id: 'localstorage',
        name: 'Local Storage Access',
        description: 'Verifica l\'accesso sicuro al Local Storage',
        status: 'fail',
        severity: 'medium',
        recommendation: 'Local Storage non accessibile - verificare le impostazioni del browser'
      });
    }

    // Check 5: Service Worker Security
    results.push({
      id: 'serviceworker',
      name: 'Service Worker',
      description: 'Verifica la disponibilità di Service Workers per sicurezza aggiuntiva',
      status: 'serviceWorker' in navigator ? 'pass' : 'warning',
      severity: 'serviceWorker' in navigator ? 'low' : 'low',
      recommendation: 'Service Workers possono migliorare la sicurezza e le prestazioni'
    });

    // Check 6: Geolocation API Security
    results.push({
      id: 'geolocation',
      name: 'Geolocation Security',
      description: 'Verifica che le API di geolocalizzazione siano sicure',
      status: location.protocol === 'https:' || location.hostname === 'localhost' ? 'pass' : 'fail',
      severity: location.protocol === 'https:' || location.hostname === 'localhost' ? 'low' : 'medium',
      recommendation: 'Geolocation API richiede HTTPS per funzionare in sicurezza'
    });

    // Check 7: Browser Security Features
    const hasSecureContext = window.isSecureContext;
    results.push({
      id: 'securecontext',
      name: 'Secure Context',
      description: 'Verifica che l\'applicazione sia eseguita in un contesto sicuro',
      status: hasSecureContext ? 'pass' : 'fail',
      severity: hasSecureContext ? 'low' : 'high',
      recommendation: 'Contesto sicuro necessario per API sensibili'
    });

    setChecks(results);
    setIsRunning(false);
  };

  useEffect(() => {
    performSecurityChecks();
  }, []);

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSeverityBadge = (severity: SecurityCheck['severity']) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getOverallScore = () => {
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    return totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  };

  const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status === 'fail');
  const highIssues = checks.filter(c => c.severity === 'high' && c.status === 'fail');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controllo Conformità Sicurezza
          </CardTitle>
          <CardDescription>
            Verifica automatica delle configurazioni di sicurezza dell'applicazione
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Nascondi' : 'Dettagli'}
          </Button>
          <Button
            onClick={performSecurityChecks}
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? 'Scansione...' : 'Riesegui Controlli'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-3xl font-bold text-primary mb-2">
            {getOverallScore()}%
          </div>
          <div className="text-sm text-muted-foreground">
            Punteggio Sicurezza Complessivo
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalIssues.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-800">
              <strong>Problemi Critici Rilevati:</strong> {criticalIssues.length} problemi critici 
              richiedono attenzione immediata per la sicurezza dell'applicazione.
            </AlertDescription>
          </Alert>
        )}

        {/* High Priority Alerts */}
        {highIssues.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-800">
              <strong>Problemi Prioritari:</strong> {highIssues.length} problemi ad alta priorità 
              dovrebbero essere risolti presto.
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Results */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-semibold">Risultati Dettagliati:</h4>
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="space-y-1">
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {check.description}
                    </div>
                    {check.recommendation && check.status !== 'pass' && (
                      <div className="text-xs text-blue-600 mt-1">
                        💡 {check.recommendation}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {getSeverityBadge(check.severity)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Supabase Settings */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Configurazioni Supabase Richieste:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Abilita protezione password compromesse in Auth &gt; Settings</li>
              <li>Riduci scadenza OTP a 60 secondi in Auth &gt; Settings</li>
              <li>Configura URL di reindirizzamento corretti in Auth &gt; URL Configuration</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}