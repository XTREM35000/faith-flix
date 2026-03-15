import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

