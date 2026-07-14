'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiGet } from '@/lib/http';

export default function Encouragement() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<{ line: string }>('/api/encouragement')
      .then((r) => active && setLine(r.line))
      .catch(() => active && setLine('You are doing beautifully today. 💗'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-start gap-3 rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 p-5 text-white shadow-soft">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm leading-relaxed">
        {line ?? <span className="opacity-70">Thinking of something sweet…</span>}
      </p>
    </div>
  );
}
