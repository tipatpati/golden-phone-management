import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  Wallet,
  ArrowRightLeft
} from "lucide-react";

type PaymentMethodSelectorProps = {
  value: string;
  onChange: (method: string) => void;
  totalAmount: number;
};

export function PaymentMethodSelector({ value, onChange, totalAmount }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'cash',
      label: 'Contanti',
      icon: <Banknote className="h-5 w-5" />,
      description: 'Pagamento in contanti',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      id: 'card',
      label: 'Carta',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Carta di credito/debito',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      id: 'bank_transfer',
      label: 'Bonifico',
      icon: <Building2 className="h-5 w-5" />,
      description: 'Bonifico bancario',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      id: 'hybrid',
      label: 'Misto',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      description: 'Combinazione di metodi',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      id: 'other',
      label: 'Altro',
      icon: <Wallet className="h-5 w-5" />,
      description: 'Altri metodi di pagamento',
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground mb-1">Totale da pagare</div>
        <div className="text-2xl font-bold">€{totalAmount.toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              value === method.id 
                ? 'ring-2 ring-primary shadow-md ' + method.color
                : 'hover:' + method.color
            }`}
            onClick={() => onChange(method.id)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  value === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{method.label}</div>
                  {value === method.id && (
                    <Badge variant="default" className="mt-1">Selezionato</Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {method.description}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {value === 'hybrid' && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="text-sm font-medium text-orange-800 mb-2">
            Pagamento Misto Selezionato
          </div>
          <div className="text-xs text-orange-700">
            Potrai specificare gli importi per ciascun metodo nel prossimo passaggio
          </div>
        </Card>
      )}
    </div>
  );
}