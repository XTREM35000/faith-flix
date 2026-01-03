import React from 'react';
import { useAboutPage, organizeAboutSections } from '@/hooks/useAboutPage';
import AboutHero from '@/components/about/AboutHero';
import ValueList from '@/components/about/ValueList';
import MinistryCards from '@/components/about/MinistryCards';
import ContactSection from '@/components/about/ContactSection';
import AboutCTASection from '@/components/about/AboutCTASection';

const AboutPage: React.FC = () => {
  const { data } = useAboutPage();
  const sections = organizeAboutSections(data || []);

  return (
    <main className="min-h-screen bg-background">
      {sections.hero && <AboutHero section={sections.hero} />}
      {sections.values && <ValueList section={sections.values} />}
      {sections.ministries && <MinistryCards section={sections.ministries} />}
      {sections.contact && <ContactSection section={sections.contact} />}
      {sections.cta && <AboutCTASection section={sections.cta} />}
    </main>
  );
};

export default AboutPage;
