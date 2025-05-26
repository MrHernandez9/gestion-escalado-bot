import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function App() {
  const [inputCode, setInputCode] = useState('');
  const [accountSize, setAccountSize] = useState(10000);
  const [maxRisk, setMaxRisk] = useState(4.0);
  const [initialLot, setInitialLot] = useState(0.1);
  const [lotMultiplier, setLotMultiplier] = useState(2.0);
  const [maxLosses, setMaxLosses] = useState(2);
  const [distance, setDistance] = useState(200);
  const [outputCode, setOutputCode] = useState('');

  const handleInject = () => {
    const scalingLogic = `
input double AccountSize = ${accountSize};
input double MaxDailyRiskPercent = ${maxRisk};
input double InitialLotSize = ${initialLot};
input double LotMultiplier = ${lotMultiplier};
input int MaxConsecutiveLosses = ${maxLosses};
input double DistanceBetweenOrders = ${distance};

int ConsecutiveLosses = 0;
bool UseDistanceScaling = false;
double CurrentLotSize = InitialLotSize;
double LastEntryPrice = 0;
double dailyRisk = 0;
int lastTradeDay;

bool CanOpenNewTrade() {
  int today = TimeDay(TimeCurrent());
  if (today != lastTradeDay) {
    dailyRisk = 0;
    lastTradeDay = today;
  }
  return dailyRisk < (AccountSize * MaxDailyRiskPercent / 100.0);
}

void OnTradeTransaction(const MqlTradeTransaction &trans, const MqlTradeRequest &request, const MqlTradeResult &result) {
  if (trans.type == TRADE_TRANSACTION_DEAL_ADD && (trans.deal_type == DEAL_TYPE_BUY || trans.deal_type == DEAL_TYPE_SELL)) {
    double profit = trans.profit;
    int today = TimeDay(TimeCurrent());
    if (today != lastTradeDay) {
      dailyRisk = 0;
      lastTradeDay = today;
    }
    if (profit < 0) {
      dailyRisk += MathAbs(profit);
      ConsecutiveLosses++;
      if (ConsecutiveLosses >= MaxConsecutiveLosses) UseDistanceScaling = true;
      else CurrentLotSize *= LotMultiplier;
    } else {
      ConsecutiveLosses = 0;
      CurrentLotSize = InitialLotSize;
      UseDistanceScaling = false;
    }
  }
}`;

    const result = inputCode + '\n\n// Lógica de gestión de escalado añadida\n' + scalingLogic;
    setOutputCode(result);
  };

  const handleDownload = () => {
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot_escalado.mq5';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editor de Bot MQ5 con Escalado</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input type="number" value={accountSize} onChange={e => setAccountSize(+e.target.value)} placeholder="Tamaño de cuenta" />
        <Input type="number" value={maxRisk} onChange={e => setMaxRisk(+e.target.value)} placeholder="Riesgo diario (%)" />
        <Input type="number" value={initialLot} onChange={e => setInitialLot(+e.target.value)} placeholder="Lote inicial" />
        <Input type="number" value={lotMultiplier} onChange={e => setLotMultiplier(+e.target.value)} placeholder="Multiplicador" />
        <Input type="number" value={maxLosses} onChange={e => setMaxLosses(+e.target.value)} placeholder="Pérdidas antes de distancia" />
        <Input type="number" value={distance} onChange={e => setDistance(+e.target.value)} placeholder="Distancia entre órdenes (pts)" />
      </div>

      <Textarea className="mb-4" rows={12} value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="Pega aquí tu código MQ5 original" />

      <Button className="mr-2" onClick={handleInject}>Agregar gestión de escalado</Button>
      <Button onClick={handleDownload} variant="outline">Descargar .mq5</Button>

      <Textarea className="mt-6" rows={16} value={outputCode} readOnly placeholder="Aquí aparecerá tu código actualizado" />
    </div>
  );
}



