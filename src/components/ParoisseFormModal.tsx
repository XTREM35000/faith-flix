import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
import DraggableResizableModal from '@/components/ui/draggable-resizable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { ParoisseAdminRow } from '@/lib/supabase/paroisseAdminQueries';
import { upsertParoisse, formatParoisseSaveError } from '@/lib/supabase/paroisseAdminQueries';
import { uploadParoisseLogo } from '@/lib/supabase/storage';

export function slugifyFromNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

const formSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(255),
  slug: z
    .string()
    .min(1, 'Le slug est obligatoire')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Lettres minuscules, chiffres et tirets uniquement',
    }),
  couleur_principale: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex à 6 caractères'),
  description: z.string().optional(),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z
    .string()
    .max(255)
    .refine((s) => s.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), { message: 'Email invalide' }),
  site_web: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export interface ParoisseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = création */
  paroisse: ParoisseAdminRow | null;
  onSaved: () => void;
}

export const ParoisseFormModal: React.FC<ParoisseFormModalProps> = ({
  open,
  onOpenChange,
  paroisse,
  onSaved,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  const isEdit = !!paroisse?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      slug: '',
      couleur_principale: '#3b82f6',
      description: '',
      adresse: '',
      telephone: '',
      email: '',
      site_web: '',
      is_active: true,
    },
  });

  const nomValue = form.watch('nom');

  useEffect(() => {
    if (!open) return;
    setLogoFile(null);
    setLogoPreview(null);
    if (paroisse) {
      form.reset({
        nom: paroisse.nom,
        slug: paroisse.slug,
        couleur_principale: paroisse.couleur_principale || '#3b82f6',
        description: paroisse.description || '',
        adresse: paroisse.adresse || '',
        telephone: paroisse.telephone || '',
        email: paroisse.email || '',
        site_web: paroisse.site_web || '',
        is_active: paroisse.is_active,
      });
      setSlugManual(true);
      if (paroisse.logo_url) setLogoPreview(paroisse.logo_url);
    } else {
      form.reset({
        nom: '',
        slug: '',
        couleur_principale: '#3b82f6',
        description: '',
        adresse: '',
        telephone: '',
        email: '',
        site_web: '',
        is_active: true,
      });
      setSlugManual(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset quand on ouvre / change de ligne éditée
  }, [open, paroisse]);

  useEffect(() => {
    if (!open || slugManual || isEdit) return;
    const s = slugifyFromNom(nomValue || '');
    form.setValue('slug', s, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setValue stable via RHF
  }, [nomValue, slugManual, isEdit, open]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fichier invalide', description: 'Choisissez une image.', variant: 'destructive' });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      let logoUrl: string | null = paroisse?.logo_url ?? null;
      if (logoFile) {
        const uploaded = await uploadParoisseLogo(logoFile, values.slug);
        logoUrl = uploaded.publicUrl;
      }

      const { data, error } = await upsertParoisse({
        id: paroisse?.id,
        nom: values.nom,
        slug: values.slug,
        logo_url: logoUrl,
        couleur_principale: values.couleur_principale,
        description: values.description || null,
        adresse: values.adresse || null,
        telephone: values.telephone || null,
        email: values.email || null,
        site_web: values.site_web || null,
        is_active: values.is_active,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: formatParoisseSaveError(error),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: isEdit ? 'Paroisse mise à jour' : 'Paroisse créée',
        description: data?.nom ? `« ${data.nom} »` : undefined,
      });
      onOpenChange(false);
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Erreur',
        description: msg.includes('Bucket') ? 'Vérifiez le bucket Storage « paroisses ».' : msg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DraggableResizableModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEdit ? 'Modifier la paroisse' : 'Créer une paroisse'}
      maxWidthClass="max-w-2xl"
      headerClassName="bg-primary"
      dragHandleOnly={true}
      minWidth="500px"
      minHeight="400px"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de la paroisse. Le slug doit être unique (URL).
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Paroisse Saint-Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="saint-jean"
                        {...field}
                        onChange={(e) => {
                          setSlugManual(true);
                          field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        }}
                      />
                    </FormControl>
                    <FormDescription>Généré depuis le nom ; modifiable (minuscules, tirets).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="sm:col-span-2">
                <FormLabel>Logo</FormLabel>
                <div className="flex flex-wrap items-center gap-4">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Aperçu"
                      className="h-16 w-16 rounded-md border object-contain"
                    />
                  )}
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      Choisir une image
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                  </label>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="couleur_principale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur principale</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          aria-label="Sélecteur de couleur"
                        />
                        <Input {...field} className="font-mono" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel>Actif</FormLabel>
                      <FormDescription>Paroisse visible dans les listes publiques.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Présentation courte…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="12 rue …" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 …" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site_web"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Site web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : isEdit ? (
                  'Enregistrer'
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DraggableResizableModal>
  );
};
