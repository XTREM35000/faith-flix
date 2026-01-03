import React from 'react';
import type { AboutSection } from '@/hooks/useAboutPage';

const ValueList: React.FC<{ section: AboutSection }> = ({ section }) => {
  const items = section.metadata?.items || [];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {section.title && <h2 className="text-3xl font-semibold mb-6">{section.title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it: any, idx: number) => (
            <div key={idx} className="p-6 bg-card rounded-lg shadow-sm">
              {it.icon && <img src={it.icon} alt={it.title} className="w-12 h-12 mb-3" />}
              <h3 className="text-xl font-medium">{it.title}</h3>
              <p className="text-muted-foreground">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueList;
