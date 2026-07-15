// src/components/common/ChatWidget.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, Send } from 'lucide-react';

/* ---------- OpenAI function definitions ---------- */
const functions = [
  {
    name: 'get_coin_balance',
    description: 'Get the current Nicoin balance of the logged‑in provider.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_profile',
    description: 'Get the provider’s profile information including business name, description, category, and location.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_description',
    description: 'Update the provider’s business description. Only call after the user has confirmed the new description.',
    parameters: {
      type: 'object',
      properties: { new_description: { type: 'string', description: 'The new description text' } },
      required: ['new_description'],
    },
  },
  {
    name: 'get_location_change_status',
    description: 'Check whether the provider can change their location for free or needs to pay.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'switch_to_provider',
    description: 'Switch the current customer account to a provider account. The user must confirm they want to do this.',
    parameters: {
      type: 'object',
      properties: { confirmed: { type: 'boolean', description: 'Whether the user explicitly confirmed the switch.' } },
      required: ['confirmed'],
    },
  },
];

/* ---------- System instructions (the rulebook) ---------- */
const INSTRUCTIONS = `
You are a helpful assistant built into Nimart, a Nigerian service marketplace.
You help providers and customers manage their accounts, answer questions, and perform actions on their behalf.

## About Nimart
- Founder: Edidiong Edem from Akwa Ibom State, Nigeria.
- Born: September 2025.
- Headquarters: Abuja, Nigeria.
- Nimart is and will always be completely free. No registration fee, no commission. Providers keep 100% of what they earn.

## Service Categories
Nimart covers the following tiers (with example categories):
- **Automotive** – Vehicle Mechanics, Roadside Emergencies, Auto Repair, Auto Maintenance, Auto Parts, Commercial Vehicles, Official Vehicle Services
- **Home & Property** – Plumbing, Electrical, Construction, Carpentry, Painting, Metal Works, Glass, Appliance Repair, Home Security
- **Emergency** – Medical Emergency, Fire & Rescue, Security Guarding
- **Professional** – Legal, Financial, Business, Real Estate, Architecture
- **Technology** – Computer & IT, Mobile Phone, Digital Creative, Printing
- **Beauty** – Hair, Makeup, Nail, Spa, Fashion
- **Food** – Catering, Private Chef, Food Delivery, Drinks, Professional Food Services
- **Events** – Photography, Event Planning, Entertainment, Weddings
- **Education** – Tutoring, Skills Training, Music & Arts, Special Needs, Educational Support
- **Health** – Medical Home Visit, Alternative Medicine, Mental Health, Fitness
- **Logistics** – Moving & Relocation, Delivery, Rentals
- **Social** – Social Groups, Venues
- **Business Partners** – B2B Partners, SME Services, Creative Partners
- **Trade** – Export, Import, Cross‑Border Trade

Each category has subcategories. If a user asks for a specific service, you can guide them to the right category.

## Careers
We are looking for talented programmers, marketers, and individuals willing to learn. Interested persons can contact us through the platform or WhatsApp.

## WhatsApp Support
If you are unable to resolve a user's issue, tell them to reach the founder directly on WhatsApp at **+234 803 888 7589**. They can also call 08038887589.

## Security Rules (NEVER break these)
- Before any action that changes data, ask for the user's password or send a one‑time code to their email.
- Never reveal one user's data to another.
- Never delete an account, change an email, or process a withdrawal.
- If you're unsure about any request, refuse politely and suggest contacting human support.

## Location Change
- Every provider gets one free location change after signup.
- After the free change is used, changes within 30 days cost 5000 Nicoin.
- After 30 days, the next change is free again.
- Always confirm the new location with the user before proceeding.

## Profile Updates
- Editable fields: business_name, description, phone, avatar, gender, age, education, languages, street_address, landmark.
- Update only the fields the user mentions.
- Before updating description, suggest a better version based on their category.

## Suggesting Descriptions
- Ask what category they belong to, then generate a professional 2‑3 sentence description including their LGA and State if available.
- Use proper grammar and correct typos.

## Coin Balance & Transactions
- Tell users their current coin balance when asked.

## Switching to Provider
- A customer can switch to a provider account. Ask them to confirm, then call the switch_to_provider function with confirmed: true.
- After switching, remind them to complete their business profile.

## Bookings
- Help a customer find a provider and initiate a booking. Always confirm details before creating.

## Password Reset
- If a user forgets their password, trigger the Supabase password reset flow (the frontend will handle it).

Always be friendly, professional, and concise. If you can't do something, explain why and offer an alternative.
`;

/* ---------- Function implementations (call Supabase) ---------- */
async function executeFunction(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<string> {
  try {
    switch (name) {
      case 'get_coin_balance': {
        const { data, error } = await supabase
          .from('providers')
          .select('coin_balance')
          .eq('id', userId)
          .single();
        if (error) return 'Error fetching coin balance.';
        return `Your current Nicoin balance is ${data.coin_balance ?? 0}.`;
      }
      case 'get_profile': {
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('business_name, description, selected_category_slug')
          .eq('id', userId)
          .single();
        if (providerError) return 'Error fetching profile.';
        const { data: profile } = await supabase
          .from('profiles')
          .select('lga_name, state_name')
          .eq('id', userId)
          .single();
        const loc = profile ? `${profile.lga_name}, ${profile.state_name}` : 'Location not set';
        return JSON.stringify({
          business_name: provider.business_name,
          description: provider.description,
          category: provider.selected_category_slug,
          location: loc,
        });
      }
      case 'update_description': {
        const newDesc = args.new_description as string;
        if (!newDesc) return 'Missing description.';
        const { error } = await supabase
          .from('providers')
          .update({ description: newDesc })
          .eq('id', userId);
        if (error) return 'Failed to update description.';
        return 'Description updated successfully.';
      }
      case 'get_location_change_status': {
        const { data, error } = await supabase.rpc('get_location_change_status', {
          p_provider_id: userId,
        });
        if (error) return 'Error checking location change status.';
        return JSON.stringify(data);
      }
      case 'switch_to_provider': {
        if (!args.confirmed) {
          return 'Please confirm you want to switch to a provider account. You will need to complete your business profile afterwards.';
        }
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'provider', is_complete: false })
          .eq('id', userId);
        if (error) return 'Failed to switch account.';
        return 'You have been switched to a provider account. Please complete your business profile on the Setup page to appear in search results.';
      }
      default:
        return `Unknown function: ${name}`;
    }
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

/* ---------- Helper to format timestamps ---------- */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ---------- Component ---------- */
export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ id?: number; role: 'user' | 'assistant'; text: string; created_at?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ALL hooks must be called before any return
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Lock background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when opened
  useEffect(() => {
    if (!user || !open) return;
    const loadHistory = async () => {
      setLoadingHistory(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) {
        setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', text: m.content, created_at: m.created_at })));
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [user, open]);

  // Save a single message to Supabase – placed BEFORE the early return
  const saveMessage = useCallback(async (role: 'user' | 'assistant', text: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role, content: text })
      .select('id, created_at')
      .single();
    return data;
  }, [user]);

  // Early return AFTER all hooks
  if (!user) return null;

  async function callOpenAI(inputItems: any[]) {
    const body: any = {
      model: 'gpt-4o-mini',
      instructions: INSTRUCTIONS,
      tools: functions.map(fn => ({
        type: 'function',
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      })),
      input: inputItems,
    };
    if (responseId) body.previous_response_id = responseId;

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      if (res.status === 402 || err?.error?.type === 'insufficient_quota') {
        throw new Error('AI assistant is currently offline. Please try again later.');
      }
      throw new Error(err?.error?.message || 'AI request failed.');
    }
    return res.json();
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const userMeta = await saveMessage('user', userMsg);
    setMessages(prev => [...prev, { id: userMeta?.id, role: 'user', text: userMsg, created_at: userMeta?.created_at }]);
    setLoading(true);

    try {
      let resp = await callOpenAI([{ role: 'user', content: userMsg }]);
      setResponseId(resp.id);

      while (resp.output) {
        for (const item of resp.output) {
          if (item.type === 'message' && item.role === 'assistant') {
            const text = item.content
              .filter((c: any) => c.type === 'output_text')
              .map((c: any) => c.text)
              .join('\n');
            if (text) {
              const asstMeta = await saveMessage('assistant', text);
              setMessages(prev => [...prev, { id: asstMeta?.id, role: 'assistant', text, created_at: asstMeta?.created_at }]);
            }
          } else if (item.type === 'function_call') {
            const result = await executeFunction(item.name, JSON.parse(item.arguments || '{}'), user.id);
            resp = await callOpenAI([{ type: 'function_call_output', call_id: item.call_id, output: result }]);
            setResponseId(resp.id);
            break;
          }
        }
        if (!resp.output.some((i: any) => i.type === 'function_call')) break;
      }
    } catch (err: any) {
      const errText = err.message || 'Something went wrong.';
      const errMeta = await saveMessage('assistant', errText);
      setMessages(prev => [...prev, { id: errMeta?.id, role: 'assistant', text: errText, created_at: errMeta?.created_at }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40"
          aria-label="Open AI Assistant"
        >
          <img src="/ai.png" alt="AI Assistant" className="h-12 w-12" />
        </button>
      )}

      {/* Chat panel – glass blur, locks background scroll */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full sm:w-96 h-[70vh] sm:h-[500px] bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#008751] text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <img src="/ai.png" alt="AI" className="h-6 w-6" />
                <h3 className="font-semibold">Nimart Assistant</h3>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/40">
              {loadingHistory && <p className="text-center text-gray-400 text-sm">Loading history…</p>}
              {messages.length === 0 && !loadingHistory && (
                <p className="text-center text-gray-400 text-sm mt-10">
                  👋 Hi! I can help you with your profile, location, coins, and more.
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#008751] text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.created_at && (
                    <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                </div>
              ))}
              {loading && <div className="text-center text-gray-400 text-sm">Thinking…</div>}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white/60">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#008751] text-sm bg-white"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-[#008751] text-white p-2 rounded-full hover:bg-green-700 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}