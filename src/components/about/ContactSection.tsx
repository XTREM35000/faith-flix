import React from 'react';
import type { AboutSection } from '@/hooks/useAboutPage';

const ContactSection: React.FC<{ section: AboutSection }> = ({ section }) => {
  const contact = section.metadata?.contact || {};

  return (
    <section className="py-16 bg-muted/5">
      <div className="container mx-auto px-4 text-center">
        {section.title && <h2 className="text-3xl font-semibold mb-4">{section.title}</h2>}
        {contact.phone && <p className="mb-2">Téléphone: {contact.phone}</p>}
        {contact.email && <p className="mb-2">Email: {contact.email}</p>}
        {contact.address && <p className="mb-2">{contact.address}</p>}
      </div>
    </section>
  );
};

export default ContactSection;
