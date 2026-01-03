import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Donation {
  id: string;
  user_id: string | null;
  is_anonymous: boolean;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  type: "especes" | "alimentaire" | "vestimentaire" | "materiel" | "services" | "autre";
  amount_currency?: string;
  amount_value?: number;
  description?: string;
  quantity?: string;
  donation_date: string;
  location: string;
  notes?: string;
  is_verified: boolean;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDonations = async (filters?: { userId?: string; type?: string }) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase;
      let query = sb
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.userId) {
        query = query.eq("donor_id", filters.userId);
      }

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data || []).map((r: any) => ({ ...(r as any), user_id: r.user_id ?? r.donor_id })) as Donation[];
      setDonations(mapped);
      return mapped;
    } catch (error) {
      console.error("Erreur lors du chargement des donations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les donations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDonation = async (donation: Omit<Donation, "id" | "created_at" | "updated_at">) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...(donation as any) };
      if (payload.user_id && !payload.donor_id) {
        payload.donor_id = payload.user_id;
        delete payload.user_id;
      }
      const { error } = await sb.from("donations").insert([payload]);
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre don a été enregistré. Merci !",
      });

      // Refresh list
      await fetchDonations();
      return true;
    } catch (error) {
      console.error("Erreur lors de la création du don:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer votre don.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateDonation = async (id: string, updates: Partial<Donation>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...(updates as any) };
      if (payload.user_id && !payload.donor_id) {
        payload.donor_id = payload.user_id;
        delete payload.user_id;
      }
      const { error } = await sb.from("donations").update(payload).eq("id", id);
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Don mis à jour.",
      });

      await fetchDonations();
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du don:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le don.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDonation = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase;
      const { error } = await sb.from("donations").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Don supprimé.",
      });

      setDonations(donations.filter((d) => d.id !== id));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du don:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le don.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    donations,
    loading,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  };
};
