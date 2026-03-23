import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Facebook, Youtube, Instagram, MessageCircle } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useParoisse } from "@/contexts/ParoisseContext";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { useMemo } from "react";

const Footer = () => {
  const { paroisse } = useParoisse();
  const { data: headerConfig } = useHeaderConfig();
  const { massTimes, contact, footer } = useHomepageContent();

  const quickLinks = [
    { name: "Accueil", path: "/" },
    { name: "Vidéos", path: "/videos" },
    { name: "Galerie", path: "/galerie" },
    { name: "Événements", path: "/evenements" },
    { name: "Annuaire", path: "/directory" },
    { name: "À propos", path: "/a-propos" },
  ];

  const defaultMassSchedule = [
    { day: "Dimanche", time: "9h00, 11h00, 18h30" },
    { day: "Lundi - Vendredi", time: "8h00, 18h30" },
    { day: "Samedi", time: "9h00, 18h00 (anticipée)" },
  ];

  const massSchedule = massTimes
    ? [
        {
          day: "Dimanche",
          time: Array.isArray(massTimes.sunday)
            ? massTimes.sunday.join(", ")
            : massTimes.sunday || defaultMassSchedule[0].time,
        },
        {
          day: "Lundi - Vendredi",
          time: Array.isArray(massTimes.weekdays)
            ? massTimes.weekdays.join(", ")
            : massTimes.weekdays || defaultMassSchedule[1].time,
        },
        {
          day: "Samedi",
          time: Array.isArray(massTimes.saturday)
            ? massTimes.saturday.join(", ")
            : massTimes.saturday || defaultMassSchedule[2].time,
        },
      ]
    : defaultMassSchedule;

  const contactInfo = useMemo(() => {
    const f = footer;
    const c = contact;
    return {
      address: (f?.address?.trim() || c?.address?.trim() || "").trim(),
      email: (f?.email?.trim() || c?.email?.trim() || "").trim(),
      moderator_phone: (f?.moderator_phone?.trim() || c?.moderator_phone?.trim() || "").trim(),
      super_admin_email: (f?.super_admin_email?.trim() || c?.super_admin_email?.trim() || "").trim(),
      super_admin_phone: (f?.super_admin_phone?.trim() || c?.super_admin_phone?.trim() || "").trim(),
    };
  }, [footer, contact]);

  const displayTitle = headerConfig?.main_title?.trim() || paroisse?.nom || "Paroisse";
  const displaySubtitle = headerConfig?.subtitle?.trim() || "";

  const year = new Date().getFullYear();
  const copyrightLine =
    footer?.copyright_text?.trim() ||
    `© ${year} ${displayTitle}. Tous droits réservés.`;

  const socialEntries = [
    { href: footer?.facebook_url, Icon: Facebook, label: "Facebook" },
    { href: footer?.youtube_url, Icon: Youtube, label: "YouTube" },
    { href: footer?.instagram_url, Icon: Instagram, label: "Instagram" },
    { href: footer?.whatsapp_url, Icon: MessageCircle, label: "WhatsApp" },
  ].filter((e) => typeof e.href === "string" && e.href.trim().length > 0);

  return (
    <footer className="bg-card border-t border-border cross-pattern">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <AnimatedLogo size="md" />
              <div>
                <h3 className="font-display text-lg font-semibold leading-tight">{displayTitle}</h3>
                {displaySubtitle ? (
                  <p className="text-xs text-muted-foreground">{displaySubtitle}</p>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displaySubtitle ||
                "Une communauté accueillante au service de la foi, de l’espérance et de la charité."}
            </p>
            {socialEntries.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialEntries.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold">Liens rapides</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" />
              Horaires des messes
            </h4>
            <ul className="space-y-3">
              {massSchedule.map((schedule) => (
                <li key={schedule.day} className="text-sm">
                  <span className="font-medium text-foreground">{schedule.day}</span>
                  <p className="text-muted-foreground">{schedule.time}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <span className="text-muted-foreground whitespace-pre-line">
                  {contactInfo.address || "Adresse à renseigner"}
                </span>
              </li>
              {contactInfo.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gold shrink-0" />
                  <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground hover:text-primary">
                    {contactInfo.email}
                  </a>
                </li>
              ) : null}
              {contactInfo.moderator_phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gold shrink-0" />
                  <span className="text-xs text-muted-foreground">Modérateur : {contactInfo.moderator_phone}</span>
                </li>
              ) : null}
              {contactInfo.super_admin_email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gold shrink-0" />
                  <a
                    href={`mailto:${contactInfo.super_admin_email}`}
                    className="text-muted-foreground hover:text-primary text-xs"
                  >
                    Super admin : {contactInfo.super_admin_email}
                  </a>
                </li>
              ) : null}
              {contactInfo.super_admin_phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gold shrink-0" />
                  <span className="text-xs text-muted-foreground">Super admin : {contactInfo.super_admin_phone}</span>
                </li>
              ) : null}
            </ul>
          </motion.div>
        </div>

        <div className="liturgical-divider mt-10 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{copyrightLine}</p>
          <div className="flex gap-6">
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="hover:text-primary transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
