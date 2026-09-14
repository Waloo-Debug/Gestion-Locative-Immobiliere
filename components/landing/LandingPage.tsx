"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  Receipt,
  Shield,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
    alt: "Immeuble résidentiel moderne",
  },
  {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    alt: "Skyline immobilier",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    alt: "Maison contemporaine",
  },
  {
    src: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1600&q=80",
    alt: "Appartement lumineux",
  },
];

const features = [
  {
    icon: Building2,
    title: "Tous tes biens, un seul tableau",
    text: "Suis occupation, loyers et locataires sans tableur ni paperasse éparpillée.",
  },
  {
    icon: Receipt,
    title: "Quittances en un clic",
    text: "Génère et consulte les quittances mensuelles, prêtes à imprimer ou envoyer.",
  },
  {
    icon: FileText,
    title: "Baux clairs et à jour",
    text: "Produis des contrats avec les infos bailleur et locataire déjà renseignées.",
  },
  {
    icon: Calculator,
    title: "Calculateur de rentabilité",
    text: "Visualise coûts, cash-flow et loyer d’équilibre avant de décider.",
  },
];

export function LandingPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/accueil" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Locagest</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/connexion" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Connexion
            </Link>
            <Link href="/inscription" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate min-h-[min(92vh,56rem)] overflow-hidden">
        <div className="absolute inset-0">
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                slideIndex === index ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={slideIndex === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        </div>

        <div className="relative mx-auto flex min-h-[min(92vh,56rem)] max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-primary uppercase">Gestion locative</p>
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Locagest
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground text-pretty md:text-xl">
            Pilote ton patrimoine locatif comme un pro : biens, locataires, baux, quittances et rentabilité — dans une
            interface claire, sécurisée et liée à ton compte.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/inscription" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Commencer maintenant
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/connexion" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              J&apos;ai déjà un compte
            </Link>
          </div>
          <ul className="mt-10 grid max-w-2xl gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "Données isolées par compte",
              "Quittances & baux prêts à l’emploi",
              "Calculateur de rentabilité",
              "Suivi d’occupation en direct",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Slide ${slideIndex + 1}`}
                onClick={() => setIndex(slideIndex)}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  slideIndex === index ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Tout ce qu’il faut pour louer sereinement</h2>
          <p className="mt-3 text-muted-foreground">
            Locagest centralise l’opérationnel du propriétaire bailleur pour que tu passes moins de temps à administrer
            et plus à décider.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="border-t border-border pt-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-primary/5">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:px-6">
          <div>
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-5" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Tes données, ton compte, point final</h2>
            <p className="mt-3 text-muted-foreground">
              Une fois connecté, Locagest n’affiche que tes biens et documents. Sans session, aucun accès aux
              informations Supabase. Idéal si tu gères ton patrimoine en toute confidentialité.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">En 3 minutes</p>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>1. Crée ton compte par e-mail</li>
              <li>2. Ajoute ton premier bien et ton locataire</li>
              <li>3. Génère bail, quittances et suis ta rentabilité</li>
            </ol>
            <Link href="/inscription" className={cn(buttonVariants(), "mt-6 inline-flex")}>
              Créer mon espace Locagest
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-2 text-foreground">
          <Building2 className="size-4 text-primary" />
          <span className="font-medium">Locagest</span>
        </div>
        <p>Gestion locative simple, visuelle et sécurisée.</p>
      </footer>
    </div>
  );
}
