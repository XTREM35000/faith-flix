import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminSettings: React.FC = () => (
  <div>
    <h1 className="text-2xl font-bold">Paramètres</h1>
    <p className="text-muted-foreground">Configuration de l'application</p>

    <div className="mt-6">
      <h2 className="text-lg font-medium mb-2">Pages dynamiques</h2>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/admin/about">Éditeur: Page À propos</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default AdminSettings;
