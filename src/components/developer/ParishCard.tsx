import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Eye, EyeOff, FileText, MoreVertical, Trash2, Users } from 'lucide-react';
import type { Parish } from '@/hooks/useDeveloperAdmin';

interface ParishCardProps {
  parish: Parish;
  onToggleStatus: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function ParishCard({ parish, onToggleStatus, onDelete }: ParishCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete(parish.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{parish.nom}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onToggleStatus(parish.id, !parish.is_active)}
                className="cursor-pointer"
              >
                {parish.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Desactiver
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            {parish.is_active ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Desactivee
              </Badge>
            )}
          </div>
          {parish.description && <p className="mb-4 line-clamp-2 text-sm text-gray-600">{parish.description}</p>}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="h-3 w-3" />
              <span>{parish.members_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <FileText className="h-3 w-3" />
              <span>{parish.content_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(parish.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">slug: {parish.slug}</div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la paroisse</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer "{parish.nom}" ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer definitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
