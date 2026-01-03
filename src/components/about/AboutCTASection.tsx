import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { AboutSection } from '@/hooks/useAboutPage';

const AboutCTASection: React.FC<{ section: AboutSection }> = ({ section }) => {
  const cta = section.metadata?.cta || {};

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        {section.title && <h2 className="text-3xl font-semibold mb-4">{section.title}</h2>}
        {cta.text && (
          <div className="mt-6">
            <Button asChild>
              <Link to={cta.link || '/contact'}>{cta.text}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutCTASection;
