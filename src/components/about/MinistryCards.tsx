import React from 'react';
import type { AboutSection } from '@/hooks/useAboutPage';

const MinistryCards: React.FC<{ section: AboutSection }> = ({ section }) => {
  const cards = section.metadata?.cards || [];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {section.title && <h2 className="text-3xl font-semibold mb-6">{section.title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card: any, idx: number) => (
            <div key={idx} className="bg-card rounded-lg overflow-hidden shadow">
              {card.image && <img src={card.image} alt={card.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <h3 className="text-lg font-medium mb-2">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MinistryCards;
