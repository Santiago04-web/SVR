import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xdexbunttiykmaykpoyr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AoWQ1iCtVWRQ_FBf_EhKsg_I3IM5MzS';
const VAULT_ID = 'svr-2026';

function parseBancolombiaSms(text) {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Amount
  const amountMatch = raw.match(/\$\s*([\d.,]+)|\b([\d.,]+)\s*cop\b/i);
  let parsedAmount = 0;

  if (amountMatch) {
    let numStr = (amountMatch[1] || amountMatch[2]).replace(/\s+/g, '');
    if (numStr.includes('.') && numStr.includes(',')) {
      if (numStr.lastIndexOf(',') > numStr.lastIndexOf('.')) {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else {
        numStr = numStr.replace(/,/g, '');
      }
    } else if (numStr.includes('.')) {
      const parts = numStr.split('.');
      if (parts[parts.length - 1].length === 3) {
        numStr = numStr.replace(/\./g, '');
      }
    } else if (numStr.includes(',')) {
      const parts = numStr.split(',');
      if (parts[parts.length - 1].length === 3) {
        numStr = numStr.replace(/,/g, '');
      }
    }
    parsedAmount = parseFloat(numStr);
  }

  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
    const loneMatch = raw.match(/\b(\d{4,9})\b/);
    if (loneMatch) parsedAmount = parseFloat(loneMatch[1]);
  }

  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return null;

  // 2. Type (Ingreso vs Gasto)
  const isIncome =
    lower.includes('recibiste') ||
    lower.includes('transferencia recibida') ||
    lower.includes('te enviaron') ||
    lower.includes('abono recibido') ||
    lower.includes('pago por') ||
    lower.includes('pago de nomina') ||
    lower.includes('consignacion');

  const type = isIncome ? 'ingreso' : 'gasto';

  // 3. Payment Method
  let paymentMethod = 'debito';
  let installments = undefined;

  if (lower.includes('t.cred') || lower.includes('tarjeta de credito') || lower.includes('t.crédito') || lower.includes('credito')) {
    paymentMethod = 'tarjeta_credito';
    const cuotasMatch = raw.match(/a\s*(\d+)\s*cuota/i) || raw.match(/(\d+)\s*cuotas/i);
    const cuotas = cuotasMatch ? parseInt(cuotasMatch[1]) : 1;
    installments = { current: 1, total: cuotas };
  } else if (lower.includes('nequi')) {
    paymentMethod = 'nequi';
  } else if (lower.includes('efectivo')) {
    paymentMethod = 'efectivo';
  }

  // 4. Commerce & Category
  let description = isIncome ? 'Ingreso Bancolombia' : 'Compra Bancolombia';
  let category = 'Varios';

  const enMatch = raw.match(/\ben\s+([A-Za-z0-9\s._-]+?)(?:\s+con|\s+el|\s+por|\.|\d|\n|$)/i);
  const deMatch = raw.match(/\bde\s+([A-Za-z0-9\s._-]+?)(?:\s+en|\s+el|\s+por|\.|\d|\n|$)/i);
  const aCuentaMatch = raw.match(/\ba\s+la\s+cuenta\s+([*0-9]+)/i);

  if (enMatch && enMatch[1].trim().length > 1) {
    description = enMatch[1].trim().toUpperCase();
  } else if (deMatch && deMatch[1].trim().length > 1) {
    description = deMatch[1].trim().toUpperCase();
  } else if (aCuentaMatch) {
    description = `Transferencia a ${aCuentaMatch[1]}`;
  }

  const descLower = description.toLowerCase();

  if (isIncome) {
    if (descLower.includes('uber')) {
      category = 'Uber / Extras';
      description = 'Ganancia Uber BV';
    } else if (lower.includes('nomina') || lower.includes('quincena')) {
      category = 'Nómina';
    } else {
      category = 'Ingreso Extra';
    }
  } else {
    if (descLower.includes('distracom') || descLower.includes('terpel') || descLower.includes('primax') || descLower.includes('gasolina') || descLower.includes('texaco')) {
      category = 'Transporte';
      if (!description.includes('DISTRACOM')) description = 'Gasolina Moto';
    } else if (descLower.includes('jumbo') || descLower.includes('d1') || descLower.includes('éxito') || descLower.includes('exito') || descLower.includes('ara') || descLower.includes('mercado')) {
      category = 'Mercado';
    } else if (descLower.includes('cocorollo') || descLower.includes('restaurante') || descLower.includes('almuerzo') || descLower.includes('burger') || descLower.includes('pizza') || descLower.includes('comida')) {
      category = 'Comida';
    } else if (descLower.includes('smart fit') || descLower.includes('gym')) {
      category = 'Gym';
    } else if (descLower.includes('movistar') || descLower.includes('claro') || descLower.includes('tigo') || descLower.includes('epm')) {
      category = 'Servicios';
    } else if (paymentMethod === 'tarjeta_credito') {
      category = 'Tarjeta';
    } else if (lower.includes('transferiste')) {
      category = 'Transferencia';
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return {
    id: `tx-sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    description,
    amount: parsedAmount,
    type,
    category,
    date: today,
    paymentMethod,
    installments,
    status: 'completado',
  };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'SVR iOS Webhook Endpoint',
      usage: 'Envía un POST con { "mensaje": "Bancolombia: Compraste $40.000 en DISTRACOM..." }',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const smsText = body.mensaje || body.message || body.text || body.body || (typeof body === 'string' ? body : '');

    if (!smsText) {
      return res.status(400).json({
        error: 'No SMS message received in request body. Use { "mensaje": "..." }',
      });
    }

    const transaction = parseBancolombiaSms(smsText);
    if (!transaction) {
      return res.status(422).json({
        error: 'No se pudo interpretar el monto o formato del SMS bancario.',
        receivedText: smsText,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fetch current cloud state
    const { data, error } = await supabase
      .from('user_finances')
      .select('*')
      .eq('vault_id', VAULT_ID)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'Database fetch error: ' + error.message });
    }

    let stateObj = {};
    if (data && data.state_json) {
      stateObj = typeof data.state_json === 'string' ? JSON.parse(data.state_json) : data.state_json;
    }

    const state = stateObj.state || stateObj;
    if (!state.transactions) state.transactions = [];
    if (!state.accounts) state.accounts = [];

    // Avoid duplicate transactions if received twice in last 10 minutes
    const isDuplicate = state.transactions.some(
      (t) =>
        t.amount === transaction.amount &&
        t.description === transaction.description &&
        t.date === transaction.date &&
        Math.abs(Date.now() - (t.createdAt || Date.now())) < 600000
    );

    if (!isDuplicate) {
      state.transactions = [transaction, ...state.transactions];

      // Update account balance
      const delta = transaction.type === 'ingreso' ? transaction.amount : -transaction.amount;
      state.accounts = state.accounts.map((a) => {
        if (
          (a.type === 'efectivo' && transaction.paymentMethod === 'efectivo') ||
          (a.isMain && transaction.paymentMethod === 'debito')
        ) {
          const nextBal = a.balance + delta;
          return { ...a, balance: nextBal < 0 ? 0 : nextBal };
        }
        return a;
      });

      const mainAcc = state.accounts.find((a) => a.isMain);
      if (mainAcc) {
        state.initialBalance = mainAcc.balance;
      }

      // Upsert back to Supabase
      const payload = stateObj.state ? { ...stateObj, state } : state;
      const { error: saveError } = await supabase.from('user_finances').upsert(
        {
          vault_id: VAULT_ID,
          state_json: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'vault_id' }
      );

      if (saveError) {
        return res.status(500).json({ error: 'Save error: ' + saveError.message });
      }
    }

    return res.status(200).json({
      success: true,
      isDuplicate,
      transaction,
      message: `¡${transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'} de $${transaction.amount.toLocaleString()} registrado con éxito!`,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
