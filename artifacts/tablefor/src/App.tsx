import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Clock3, Divide, ReceiptText, Sparkles, UsersRound } from 'lucide-react';

type Calculation = {
  id: string;
  totalCents: number;
  people: number;
  perPersonCents: number;
  createdAt: number;
};

const HISTORY_KEY = 'tablefor-calculation-history';
const MAX_HISTORY = 8;

function parseCents(value: string) {
  const normalized = value.trim().replace(/[$,\s]/g, '');
  if (!/^(?:\d+\.?\d{0,2}|\.\d{1,2})$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function readHistory(): Calculation[] {
  try {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Calculation =>
      typeof item === 'object' && item !== null &&
      typeof (item as Calculation).id === 'string' &&
      typeof (item as Calculation).totalCents === 'number' &&
      typeof (item as Calculation).people === 'number' &&
      typeof (item as Calculation).perPersonCents === 'number' &&
      typeof (item as Calculation).createdAt === 'number',
    ).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function App() {
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState('');
  const [history, setHistory] = useState<Calculation[]>([]);
  const [result, setResult] = useState<Calculation | null>(null);
  const [errors, setErrors] = useState<{ total?: string; people?: string }>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = readHistory();
    setHistory(saved);
    if (saved[0]) setResult(saved[0]);
  }, []);

  const hasHistory = history.length > 0;
  const helperText = useMemo(() => {
    if (errors.total || errors.people) return 'A small correction and you’ll be ready to split.';
    return 'No tips, no fees — just an even split.';
  }, [errors.people, errors.total]);

  function validate() {
    const nextErrors: { total?: string; people?: string } = {};
    const cents = parseCents(total);
    const count = Number(people);
    if (cents === null) {
      nextErrors.total = total.trim() ? 'Enter an amount greater than $0.00.' : 'Add the total bill amount.';
    }
    if (!people.trim()) {
      nextErrors.people = 'Add the number of people.';
    } else if (!Number.isInteger(count) || count < 1) {
      nextErrors.people = 'Use a whole number of 1 or more.';
    } else if (count > 999) {
      nextErrors.people = 'That’s a lot of people — keep it under 1,000.';
    }
    setErrors(nextErrors);
    return { cents, count, valid: Object.keys(nextErrors).length === 0 };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { cents, count, valid } = validate();
    if (!valid || cents === null) return;
    const calculation: Calculation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      totalCents: cents,
      people: count,
      perPersonCents: Math.round(cents / count),
      createdAt: Date.now(),
    };
    const nextHistory = [calculation, ...history].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    setResult(calculation);
    setIsSaved(true);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    window.setTimeout(() => setIsSaved(false), 1600);
  }

  return (
    <main className="tablefor-noise min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-44 -top-44 h-[30rem] w-[30rem] rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-secondary/60 blur-3xl" />
      <div className="relative mx-auto min-h-[100dvh] max-w-[1220px] px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
        <header className="tablefor-rise flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-foreground text-background shadow-[4px_4px_0_hsl(var(--primary)/.85)]" aria-hidden="true">
              <Divide size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-serif text-[1.45rem] font-semibold leading-none tracking-[-.04em]">TableFor</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">the easy split</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-2 text-[11px] font-semibold text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            stays on this device
          </div>
        </header>

        <div className="mx-auto mt-16 grid min-w-0 max-w-[1040px] gap-14 lg:mt-24 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-24">
          <section className="tablefor-rise min-w-0 max-w-[650px]">
            <div className="mb-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-primary">
              <Sparkles size={14} strokeWidth={2.2} />
              shared bill, sorted
            </div>
            <h1 className="max-w-[660px] break-words font-serif text-[clamp(2.75rem,12vw,6.9rem)] font-semibold leading-[.88] tracking-[-.075em] text-foreground sm:text-[clamp(3.65rem,8vw,6.9rem)]">
              Make the awkward<br /><span className="text-primary">math disappear.</span>
            </h1>
            <p className="mt-8 max-w-[450px] text-[15px] leading-7 text-muted-foreground sm:text-base">
              One total. A few people. One calm answer for the table.
            </p>

            <form onSubmit={handleSubmit} className="mt-12" noValidate>
              <div className="grid min-w-0 gap-5 sm:grid-cols-[1.15fr_.85fr]">
                <label className="group block min-w-0">
                  <span className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-[.12em] text-foreground/70">
                    Total bill
                    <span className="font-medium normal-case tracking-normal text-muted-foreground">USD</span>
                  </span>
                  <div className={`flex h-[68px] items-center rounded-2xl border bg-card px-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] transition-all duration-200 group-focus-within:border-primary group-focus-within:shadow-[0_8px_30px_hsl(var(--primary)/.13)] ${errors.total ? 'border-destructive/70' : 'border-border'}`}>
                    <span className="mr-2 font-serif text-2xl text-muted-foreground">$</span>
                    <input
                      data-testid="input-total"
                      aria-label="Total bill amount"
                      aria-invalid={Boolean(errors.total)}
                      aria-describedby={errors.total ? 'total-error' : undefined}
                      value={total}
                      onChange={(event) => { setTotal(event.target.value); if (errors.total) setErrors((current) => ({ ...current, total: undefined })); }}
                      placeholder="0.00"
                      inputMode="decimal"
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent font-serif text-[2rem] font-semibold tracking-[-.04em] text-foreground outline-none placeholder:text-muted-foreground/35"
                    />
                  </div>
                  {errors.total && <p id="total-error" className="mt-2 text-xs font-semibold text-destructive">{errors.total}</p>}
                </label>
                <label className="group block min-w-0">
                  <span className="mb-2.5 block text-xs font-bold uppercase tracking-[.12em] text-foreground/70">People</span>
                  <div className={`flex h-[68px] items-center rounded-2xl border bg-card px-5 shadow-[0_8px_24px_hsl(var(--foreground)/.035)] transition-all duration-200 group-focus-within:border-primary group-focus-within:shadow-[0_8px_30px_hsl(var(--primary)/.13)] ${errors.people ? 'border-destructive/70' : 'border-border'}`}>
                    <input
                      data-testid="input-people"
                      aria-label="Number of people"
                      aria-invalid={Boolean(errors.people)}
                      aria-describedby={errors.people ? 'people-error' : undefined}
                      value={people}
                      onChange={(event) => { setPeople(event.target.value); if (errors.people) setErrors((current) => ({ ...current, people: undefined })); }}
                      placeholder="2"
                      inputMode="numeric"
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent font-serif text-[2rem] font-semibold tracking-[-.04em] text-foreground outline-none placeholder:text-muted-foreground/35"
                    />
                    <UsersRound size={21} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                  {errors.people && <p id="people-error" className="mt-2 text-xs font-semibold text-destructive">{errors.people}</p>}
                </label>
              </div>
              <div className="mt-4 flex min-h-6 items-start justify-between gap-4">
                <p className={`text-xs ${errors.total || errors.people ? 'text-destructive' : 'text-muted-foreground'}`}>{helperText}</p>
                <p className="hidden shrink-0 text-right text-[11px] text-muted-foreground sm:block">Press Enter to split</p>
              </div>
              <button
                data-testid="button-split-expense"
                type="submit"
                className="group mt-7 flex h-[60px] w-full items-center justify-between rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_22px_hsl(var(--primary)/.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_hsl(var(--primary)/.28)] active:translate-y-0 sm:max-w-[320px]"
              >
                <span className="flex items-center gap-2.5">
                  {isSaved ? <Check size={18} strokeWidth={2.7} className="tablefor-check" /> : <ReceiptText size={18} strokeWidth={2.2} />}
                  <span>{isSaved ? 'Split saved' : 'Split expense'}</span>
                </span>
                <ChevronRight size={19} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </form>
          </section>

          <section className="tablefor-rise-delay lg:pt-16" aria-live="polite">
            {result ? (
              <div className="tablefor-pop overflow-hidden rounded-[28px] border border-foreground/10 bg-foreground text-background shadow-[0_22px_60px_hsl(var(--foreground)/.16)]">
                <div className="flex items-center justify-between border-b border-background/10 px-6 py-5">
                  <span className="text-[11px] font-bold uppercase tracking-[.18em] text-background/55">Your split</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-background/55"><Check size={13} /> all even</span>
                </div>
                <div className="px-6 pb-7 pt-8">
                  <p className="text-sm text-background/60">Each person pays</p>
                  <p data-testid="text-per-person" className="mt-2 font-serif text-[4.6rem] font-semibold leading-none tracking-[-.075em] text-accent sm:text-[5.2rem]">{money(result.perPersonCents)}</p>
                  <div className="mt-8 grid grid-cols-2 gap-3 border-t border-background/10 pt-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-background/45">Total</p>
                      <p data-testid="text-result-total" className="mt-1.5 font-serif text-xl">{money(result.totalCents)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-background/45">People</p>
                      <p data-testid="text-result-people" className="mt-1.5 font-serif text-xl">{result.people}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tablefor-grid flex min-h-[292px] flex-col justify-end rounded-[28px] border border-dashed border-border/90 bg-card/40 p-7">
                <div className="mb-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <ReceiptText size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold tracking-[-.035em]">The answer will land here.</p>
                  <p className="mt-2 max-w-[230px] text-sm leading-6 text-muted-foreground">Enter your bill and the table can stop doing mental math.</p>
                </div>
              </div>
            )}
            <p className="mt-5 flex items-center gap-2 px-1 text-xs leading-5 text-muted-foreground">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/70 text-foreground"><Check size={12} strokeWidth={2.5} /></span>
              Rounded to the nearest cent
            </p>
          </section>
        </div>

        <section className="tablefor-rise-delay mx-auto mt-20 max-w-[1040px] border-t border-border/80 pt-7 pb-12 lg:mt-28" aria-labelledby="history-heading">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-primary" />
                <h2 id="history-heading" className="text-xs font-bold uppercase tracking-[.18em] text-foreground">Recent splits</h2>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{hasHistory ? 'A little record of the math you’ve already settled.' : 'Your recent calculations will stay here on this device.'}</p>
            </div>
          </div>

          {hasHistory ? (
            <div className="tablefor-scrollbar mt-6 grid gap-2.5 md:grid-cols-2">
              {history.map((calculation, index) => (
                <div
                  key={calculation.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 px-4 py-3.5 text-left ${index === 0 ? 'border-primary/25 bg-card' : ''}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${index === 0 ? 'bg-accent' : 'bg-secondary'} text-foreground`}>
                      <UsersRound size={16} strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{money(calculation.totalCents)} <span className="font-normal text-muted-foreground">for {calculation.people}</span></span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatDate(calculation.createdAt)}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-serif text-xl font-semibold tracking-[-.035em]">{money(calculation.perPersonCents)}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div data-testid="empty-history" className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card/35 px-5 py-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/80 text-muted-foreground">
                <Clock3 size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold">No splits yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Your first calculation will be saved here automatically.</p>
              </div>
            </div>
          )}
        </section>

        <footer className="mx-auto flex max-w-[1040px] items-center justify-between border-t border-border/50 py-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground/70">
          <span>TableFor</span>
          <span>just enough math</span>
        </footer>
      </div>
    </main>
  );
}

export default App;