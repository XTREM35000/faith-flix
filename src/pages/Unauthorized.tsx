import React from 'react';
import Layout from '@/components/Layout';

const Unauthorized: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-24">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Accès refusé</h1>
          <p className="mt-4 text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Unauthorized;
