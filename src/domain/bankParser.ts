import type { Category, PaymentMethod, TransactionType } from '../types/finance';

export interface ParsedBankNotification {
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  category: Category;
  lastFourDigits?: string;
  bankName?: string;
  rawText: string;
  senderName?: string;
}

export function parseBankNotification(text: string): ParsedBankNotification | null {
  if (!text || text.trim().length < 5) return null;

  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Determine Transaction Type (Ingreso vs Gasto)
  let type: TransactionType = 'gasto';
  if (
    lowerText.includes('recibiste') ||
    lowerText.includes('te transfirieron') ||
    lowerText.includes('te enviaron') ||
    lowerText.includes('te pasaron') ||
    lowerText.includes('consignaron') ||
    lowerText.includes('consignación') ||
    lowerText.includes('abono') ||
    lowerText.includes('ingreso') ||
    lowerText.includes('pago recibido') ||
    lowerText.includes('concedido')
  ) {
    type = 'ingreso';
  }

  // 2. Extract amount
  // Handles: $5.040,00 | $40.000,00 | $25,000.00 | $50000 | por $50.000
  const amountMatch =
    cleanText.match(/\$\s?([\d.,]+)/) || cleanText.match(/por\s+\$?\s?([\d.,]+)/i);

  let amount = 0;
  if (amountMatch) {
    let rawStr = amountMatch[1];
    if (rawStr.includes(',') && rawStr.includes('.')) {
      if (rawStr.indexOf('.') < rawStr.indexOf(',')) {
        // Format: 5.040,00
        rawStr = rawStr.split(',')[0].replace(/\./g, '');
      } else {
        // Format: 5,040.00
        rawStr = rawStr.split('.')[0].replace(/,/g, '');
      }
    } else if (rawStr.includes('.')) {
      const parts = rawStr.split('.');
      if (parts[parts.length - 1].length === 2) {
        // Format: 25000.00
        rawStr = parts.slice(0, -1).join('');
      } else {
        // Format: 5.040
        rawStr = rawStr.replace(/\./g, '');
      }
    } else if (rawStr.includes(',')) {
      const parts = rawStr.split(',');
      if (parts[parts.length - 1].length === 2) {
        rawStr = parts.slice(0, -1).join('');
      } else {
        rawStr = rawStr.replace(/,/g, '');
      }
    }
    amount = parseFloat(rawStr) || 0;
  }

  // 3. Extract Merchant / Sender / Description
  let description = type === 'ingreso' ? 'Transferencia Recibida' : 'Gasto Bancario';

  if (type === 'ingreso') {
    // Pattern: "Recibiste $50.000 de CARLOS PEREZ" or "Te enviaron $50.000 de JUAN"
    const deMatch = cleanText.match(/\bde\s+([A-Za-z0-9\s._-]+?)(?=\s+en|\s+a|\s+con|\.|$)/i);
    if (deMatch && deMatch[1] && deMatch[1].trim().length > 1 && !deMatch[1].toLowerCase().includes('cuenta')) {
      description = `Ingreso de ${deMatch[1].trim()}`;
    } else {
      const desdeMatch = cleanText.match(/desde\s+la\s+cuenta\s+\*?(\d+)/i);
      if (desdeMatch) {
        description = `Ingreso desde cuenta *${desdeMatch[1]}`;
      } else {
        description = 'Transferencia Recibida (SMS)';
      }
    }
  } else {
    // Expense Description Pattern: "Compraste $5.040,00 en JUMBO VEGAS con tu..."
    const enMatch = cleanText.match(/\ben\s+([A-Za-z0-9\s._-]+?)(?=\s+con|\s+el|\s+\*|\.|$)/i);
    if (enMatch && enMatch[1] && enMatch[1].trim().length > 1) {
      description = enMatch[1].trim();
    }

    // Pattern: "Transferiste $25,000.00 desde tu cuenta *7688 a la cuenta *3122297636"
    if (lowerText.includes('transferiste')) {
      const destAccountMatch = cleanText.match(/a\s+la\s+cuenta\s+\*?(\d+)/i);
      if (destAccountMatch) {
        description = `Transferencia a cuenta *${destAccountMatch[1]}`;
      } else {
        description = 'Transferencia Salida';
      }
    }
  }

  // 4. Extract Card / Account Last 4 Digits
  const cardMatch =
    cleanText.match(/\*+(\d{4})/) || cleanText.match(/terminada\s+en\s+(\d{4})/i);
  const lastFourDigits = cardMatch ? cardMatch[1] : undefined;

  // 5. Payment Method
  let paymentMethod: PaymentMethod = 'debito';
  if (lowerText.includes('t.cred') || lowerText.includes('tarjeta de crédito')) {
    paymentMethod = 'tarjeta_credito';
  } else if (lowerText.includes('t.deb') || lowerText.includes('debito')) {
    paymentMethod = 'debito';
  } else if (
    lowerText.includes('transferiste') ||
    lowerText.includes('transferencia') ||
    lowerText.includes('transfirieron') ||
    lowerText.includes('recibiste')
  ) {
    paymentMethod = 'transferencia';
  } else if (lowerText.includes('addi')) {
    paymentMethod = 'addi';
  }

  // 6. Bank Name detection
  let bankName = 'Bancolombia';
  if (lowerText.includes('nu') || lowerText.includes('nubank')) {
    bankName = 'Nu Bank';
  } else if (lowerText.includes('nequi')) {
    bankName = 'Nequi';
  } else if (lowerText.includes('daviplata') || lowerText.includes('davivienda')) {
    bankName = 'Davivienda / Daviplata';
  }

  // 7. Category mapping by keywords
  let category: Category = type === 'ingreso' ? 'Transporte' : 'Personal';
  const descLower = (description + ' ' + cleanText).toLowerCase();

  if (type === 'ingreso') {
    if (descLower.includes('uber')) {
      category = 'Transporte';
    } else {
      category = 'Personal';
    }
  } else {
    if (
      descLower.includes('distracom') ||
      descLower.includes('terpel') ||
      descLower.includes('gasolina') ||
      descLower.includes('texaco') ||
      descLower.includes('mobil') ||
      descLower.includes('apolo')
    ) {
      category = 'Moto';
    } else if (
      descLower.includes('jumbo') ||
      descLower.includes('exito') ||
      descLower.includes('carulla') ||
      descLower.includes('d1') ||
      descLower.includes('ara') ||
      descLower.includes('restaurante')
    ) {
      category = 'Comida';
    } else if (
      descLower.includes('uber') ||
      descLower.includes('didi') ||
      descLower.includes('cabify')
    ) {
      category = 'Transporte';
    } else if (
      descLower.includes('spotify') ||
      descLower.includes('netflix') ||
      descLower.includes('movistar')
    ) {
      category = descLower.includes('movistar') ? 'Servicios' : 'Suscripciones';
    }
  }

  return {
    description,
    amount,
    type,
    paymentMethod,
    category,
    lastFourDigits,
    bankName,
    rawText: cleanText,
  };
}
