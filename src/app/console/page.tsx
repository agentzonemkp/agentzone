'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function ConsolePage() {
  const { address } = useAccount();
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoPayment, setAutoPayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('0.01');

  const executeRequest = async () => {
    if (!endpoint) return;

    setLoading(true);
    setResponse(null);

    try {
      const parsedHeaders = JSON.parse(headers);

      // Auto-inject X-PAYMENT header if enabled
      if (autoPayment && address) {
        parsedHeaders['X-PAYMENT'] = `x402://payment?amount=${paymentAmount}&currency=USDC&recipient=${address}&facilitator=0xc949AEa380D7b7984806143ddbfE519B03ABd68B`;
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
      };

      if (method !== 'GET' && body) {
        options.body = body;
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#e8eaed] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-['Outfit'] text-[#00ff88] mb-2">
            x402 API Console
          </h1>
          <p className="text-[#7a8194]">
            Interactive playground for testing agent APIs with auto-injected x402 payment headers
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Request Panel */}
          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#00ff88]">Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#7a8194] mb-2">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-[#111318] border border-[#1a1d24] rounded px-4 py-2 text-[#e8eaed] font-mono"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#7a8194] mb-2">Endpoint</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com/agent/execute"
                  className="w-full bg-[#111318] border border-[#1a1d24] rounded px-4 py-2 text-[#e8eaed] font-mono"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPayment}
                    onChange={(e) => setAutoPayment(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#7a8194]">Auto-inject X-PAYMENT</span>
                </label>
                {autoPayment && (
                  <input
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.01"
                    className="w-24 bg-[#111318] border border-[#1a1d24] rounded px-3 py-1 text-[#e8eaed] font-mono text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-[#7a8194] mb-2">Headers (JSON)</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111318] border border-[#1a1d24] rounded px-4 py-2 text-[#e8eaed] font-mono text-sm"
                />
              </div>

              {method !== 'GET' && (
                <div>
                  <label className="block text-sm text-[#7a8194] mb-2">Body (JSON)</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="w-full bg-[#111318] border border-[#1a1d24] rounded px-4 py-2 text-[#e8eaed] font-mono text-sm"
                  />
                </div>
              )}

              <button
                onClick={executeRequest}
                disabled={loading || !endpoint}
                className="w-full bg-[#00ff88] text-[#07080a] font-semibold py-3 rounded hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>

          {/* Response Panel */}
          <div className="bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#00ff88]">Response</h2>

            {response ? (
              <div className="space-y-4">
                {response.error ? (
                  <div className="bg-[#ff3b5c]/10 border border-[#ff3b5c] rounded p-4">
                    <p className="text-[#ff3b5c] font-mono text-sm">{response.error}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-[#7a8194]">Status:</span>{' '}
                      <span
                        className={`font-mono font-semibold ${
                          response.status >= 200 && response.status < 300
                            ? 'text-[#00ff88]'
                            : 'text-[#ff3b5c]'
                        }`}
                      >
                        {response.status} {response.statusText}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a8194] mb-2">Headers:</p>
                      <pre className="bg-[#111318] border border-[#1a1d24] rounded p-4 text-xs font-mono text-[#7a8194] overflow-x-auto">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a8194] mb-2">Body:</p>
                      <pre className="bg-[#111318] border border-[#1a1d24] rounded p-4 text-xs font-mono text-[#e8eaed] overflow-x-auto max-h-96 overflow-y-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-[#454b5a] py-12">
                <p>No response yet</p>
                <p className="text-sm mt-2">Configure your request and click Send</p>
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-8 bg-[#0d0f12] border border-[#1a1d24] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#00ff88] mb-4">Quick Examples</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setMethod('GET');
                setEndpoint('https://api.agentzone.xyz/v1/agents');
                setBody('');
              }}
              className="bg-[#111318] border border-[#1a1d24] rounded p-3 text-left hover:border-[#00ff88] transition-colors"
            >
              <p className="font-mono text-sm text-[#00ff88]">GET /agents</p>
              <p className="text-xs text-[#7a8194] mt-1">List all agents</p>
            </button>

            <button
              onClick={() => {
                setMethod('POST');
                setEndpoint('https://api.example.com/agent/execute');
                setBody('{\n  "prompt": "Analyze this data",\n  "params": {}\n}');
              }}
              className="bg-[#111318] border border-[#1a1d24] rounded p-3 text-left hover:border-[#00ff88] transition-colors"
            >
              <p className="font-mono text-sm text-[#00ff88]">POST /execute</p>
              <p className="text-xs text-[#7a8194] mt-1">Execute agent task</p>
            </button>

            <button
              onClick={() => {
                setMethod('GET');
                setEndpoint('https://api.example.com/agent/status');
                setBody('');
              }}
              className="bg-[#111318] border border-[#1a1d24] rounded p-3 text-left hover:border-[#00ff88] transition-colors"
            >
              <p className="font-mono text-sm text-[#00ff88]">GET /status</p>
              <p className="text-xs text-[#7a8194] mt-1">Check agent health</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
