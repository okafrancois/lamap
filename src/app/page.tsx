import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconCards,
  IconCoin,
  IconSparkles,
  IconChevronRight,
  IconMenu2,
  IconDeviceMobile,
  IconShieldCheck,
  IconTrophy,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CardBack, PlayingCard } from "common/deck";
import { LibButton } from "@/components/library/button";
import { PageContainer } from "@/components/layout/page-container";

export default async function HomePage() {
  return (
    <div className="from-background to-muted/20 relative flex min-h-screen flex-col bg-gradient-to-b">
      {/* Navigation */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex size-10 items-center justify-center rounded-lg">
              <IconCards className="text-primary-foreground size-6" />
            </div>
            <span className="text-xl font-bold">LaMap241</span>
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <IconMenu2 className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <nav className="mt-10 flex flex-col gap-4 px-4">
                <LibButton href="/login">Se connecter</LibButton>
                <LibButton href="/play">Commencer à jouer</LibButton>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop menu */}
          <nav className="hidden items-center gap-4 sm:flex">
            <LibButton href="/play">Commencer à jouer</LibButton>
          </nav>
        </div>
      </header>
      <PageContainer className="flex-1">
        <div className="">
          {/* Hero Section */}
          <section className="container overflow-x-hidden px-4 py-12 lg:overflow-visible lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Content côté gauche */}
              <div className="space-y-6 text-center lg:text-left">
                {/* Badge */}
                <Badge
                  variant="outline"
                  className="mx-auto px-4 py-1.5 lg:mx-0"
                >
                  <IconSparkles className="mr-1 size-3" />
                  Jeu de cartes en ligne
                </Badge>

                {/* Titre principal */}
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                  Le duel de cartes <span className="text-primary">épique</span>{" "}
                  vous attend !
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mx-auto max-w-xl text-lg sm:text-xl lg:mx-0 lg:text-2xl">
                  Devenez maître du Garame ! Affrontez des joueurs, misez de
                  l&apos;argent réel et remportez des gains instantanés dans ce
                  jeu de cartes stratégique.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                  <LibButton
                    href="/play"
                    size="lg"
                    icon={<IconChevronRight className="size-icon" />}
                    className="btn-chip w-full gap-2 sm:w-auto lg:px-8 lg:py-6 lg:text-lg"
                  >
                    Jouer maintenant
                  </LibButton>
                  <LibButton
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto lg:px-8 lg:py-6 lg:text-lg"
                  >
                    Voir les règles
                  </LibButton>
                </div>

                {/* Stats rapides */}
                <div className="flex justify-center gap-6 pt-6 lg:justify-start">
                  <div>
                    <p className="text-primary text-2xl font-bold">10K+</p>
                    <p className="text-muted-foreground text-sm">
                      Joueurs actifs
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-primary text-2xl font-bold">4.8/5</p>
                    <p className="text-muted-foreground text-sm">
                      Note moyenne
                    </p>
                  </div>
                </div>
              </div>

              {/* Cartes preview côté droit - grandes sur tous les appareils */}
              <div className="relative h-[350px] overflow-visible lg:h-[600px]">
                {/* Cartes en éventail */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Carte arrière gauche */}
                  <div className="absolute z-10 -translate-x-24 -rotate-[25deg] transform transition-all duration-300 hover:-translate-y-4 hover:rotate-[-20deg] sm:-translate-x-32">
                    <div className="h-[252px] w-[180px]">
                      <PlayingCard
                        suit="diamonds"
                        rank="Q"
                        width={180}
                        height={252}
                        className="h-full w-full shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Carte gauche */}
                  <div className="absolute z-20 -translate-x-12 -rotate-12 transform transition-all duration-300 hover:-translate-y-4 hover:rotate-[-8deg] sm:-translate-x-16">
                    <div className="h-[252px] w-[180px]">
                      <PlayingCard
                        suit="hearts"
                        rank="K"
                        width={180}
                        height={252}
                        className="h-full w-full shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Carte centrale (dos) */}
                  <div className="absolute z-30 scale-110 rotate-0 transform transition-all duration-300 hover:-translate-y-4 hover:scale-125">
                    <div className="h-[277px] w-[198px]">
                      <CardBack
                        width={198}
                        height={277}
                        className="h-full w-full shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Carte droite */}
                  <div className="absolute z-20 translate-x-12 rotate-12 transform transition-all duration-300 hover:-translate-y-4 hover:rotate-[8deg] sm:translate-x-16">
                    <div className="h-[252px] w-[180px]">
                      <PlayingCard
                        suit="spades"
                        rank="A"
                        width={180}
                        height={252}
                        className="h-full w-full shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Carte arrière droite */}
                  <div className="absolute z-10 translate-x-24 rotate-[25deg] transform transition-all duration-300 hover:-translate-y-4 hover:rotate-[20deg] sm:translate-x-32">
                    <div className="h-[252px] w-[180px]">
                      <PlayingCard
                        suit="clubs"
                        rank="J"
                        width={180}
                        height={252}
                        className="h-full w-full shadow-2xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Effets de brillance animés */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/20 h-48 w-48 animate-pulse rounded-full blur-3xl lg:h-64 lg:w-64" />
                </div>

                {/* Particules flottantes */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="bg-primary animate-float-slow absolute top-1/4 left-1/4 h-2 w-2 rounded-full" />
                  <div className="bg-primary/60 animate-float-medium absolute top-3/4 right-1/4 h-3 w-3 rounded-full" />
                  <div className="bg-primary/40 animate-float-fast absolute bottom-1/4 left-1/3 h-2 w-2 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="container px-4 py-12 lg:py-24">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-4 text-center text-3xl font-bold lg:text-5xl">
                Entrez dans l&apos;arène ultime !
              </h2>
              <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-lg lg:mb-16 lg:text-xl">
                Découvrez tout ce qui fait de LaMap241 l&apos;expérience de jeu
                de cartes ultime
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="card-game-effect group transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <CardContent className="p-6 text-center lg:p-8">
                      <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 inline-flex size-14 items-center justify-center rounded-full transition-colors lg:size-16">
                        <feature.icon className="size-7 lg:size-8" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold lg:text-xl">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm lg:text-base">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Game Preview Section */}
          <section className="bg-muted/30 overflow-hidden border-y py-12 lg:py-24">
            <div className="container px-4">
              <h2 className="mb-4 text-center text-3xl font-bold lg:text-5xl">
                Découvrez nos cartes uniques
              </h2>
              <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-lg lg:mb-16 lg:text-xl">
                Chaque carte est conçue avec soin pour vous offrir une
                expérience de jeu authentique et immersive
              </p>

              {/* Carrousel infini sur desktop et mobile */}
              <div className="relative space-y-6">
                {/* Première ligne */}
                <div className="relative">
                  <div className="flex gap-4 overflow-hidden lg:gap-6">
                    <div className="animate-slide-infinite flex gap-4 lg:gap-6">
                      {/* Pattern: 2 face cards, 1 back card */}
                      <PlayingCard
                        suit="hearts"
                        rank="A"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <PlayingCard
                        suit="diamonds"
                        rank="K"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <CardBack
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />

                      <PlayingCard
                        suit="clubs"
                        rank="Q"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <PlayingCard
                        suit="spades"
                        rank="J"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <CardBack
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />

                      <PlayingCard
                        suit="hearts"
                        rank="10"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <PlayingCard
                        suit="diamonds"
                        rank="9"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <CardBack
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />

                      {/* Duplicate for seamless loop */}
                      <PlayingCard
                        suit="hearts"
                        rank="A"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <PlayingCard
                        suit="diamonds"
                        rank="K"
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                      <CardBack
                        width={120}
                        height={168}
                        className="flex-shrink-0 transition-transform hover:scale-105 lg:h-[196px] lg:w-[140px]"
                      />
                    </div>
                  </div>

                  {/* Gradient de fondu sur les côtés */}
                  <div className="from-muted/30 pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r to-transparent lg:w-32" />
                  <div className="from-muted/30 pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l to-transparent lg:w-32" />
                </div>

                {/* Deuxième ligne sur desktop */}
                <div className="relative hidden lg:block">
                  <div className="flex gap-6 overflow-hidden">
                    <div className="animate-slide-infinite-reverse flex gap-6">
                      {/* Pattern inversé */}
                      <CardBack
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="spades"
                        rank="A"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="clubs"
                        rank="K"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />

                      <CardBack
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="hearts"
                        rank="Q"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="diamonds"
                        rank="J"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />

                      <CardBack
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="clubs"
                        rank="10"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="spades"
                        rank="9"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />

                      {/* Duplicate for seamless loop */}
                      <CardBack
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="spades"
                        rank="A"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                      <PlayingCard
                        suit="clubs"
                        rank="K"
                        width={140}
                        height={196}
                        className="flex-shrink-0 transition-transform hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Gradient de fondu sur les côtés */}
                  <div className="from-muted/30 pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r to-transparent" />
                  <div className="from-muted/30 pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="bg-muted/50 border-y py-12 lg:py-24">
            <div className="container px-4">
              <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 text-center lg:grid-cols-4 lg:gap-16">
                {stats.map((stat, index) => (
                  <div key={index} className="group space-y-2">
                    <p className="text-primary text-3xl font-bold transition-transform group-hover:scale-110 lg:text-5xl">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground text-sm lg:text-base">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="container px-4 py-12 lg:py-24">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-4 text-center text-3xl font-bold lg:text-5xl">
                Comment ça marche ?
              </h2>
              <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-lg lg:mb-16 lg:text-xl">
                Commencez à jouer en quelques minutes seulement
              </p>

              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Étapes à gauche */}
                <div className="space-y-6 lg:space-y-8">
                  {steps.map((step, index) => (
                    <div key={index} className="group flex items-start gap-4">
                      <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-transform group-hover:scale-110 lg:size-14 lg:text-xl">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold lg:text-xl">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-sm lg:text-base">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carte bonus à droite */}
                <div className="h-fit lg:sticky lg:top-24">
                  <Card className="betting-zone relative overflow-hidden">
                    <CardContent className="space-y-6 p-8 text-center lg:p-10">
                      {/* Cartes décoratives en arrière-plan */}
                      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 -rotate-45 opacity-10">
                        <PlayingCard
                          suit="diamonds"
                          rank="A"
                          width={180}
                          height={252}
                        />
                      </div>
                      <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 rotate-45 opacity-10">
                        <PlayingCard
                          suit="hearts"
                          rank="K"
                          width={180}
                          height={252}
                        />
                      </div>

                      <IconCoin className="text-primary relative z-10 mx-auto size-16 lg:size-20" />
                      <h3 className="relative z-10 text-2xl font-bold lg:text-3xl">
                        Bonus de bienvenue
                      </h3>
                      <p className="text-primary relative z-10 text-3xl font-bold lg:text-4xl">
                        500 FCFA
                      </p>
                      <p className="text-muted-foreground relative z-10 text-base lg:text-lg">
                        Créez votre compte et recevez immédiatement 500 FCFA
                        pour tester la plateforme !
                      </p>
                      <Link href="/signup">
                        <Button
                          size="lg"
                          className="gold-shine relative z-10 w-full text-lg"
                        >
                          Récupérer mon bonus
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container px-4 py-12">
            <div className="space-y-mobile mx-auto max-w-3xl">
              <h2 className="text-center text-3xl font-bold">
                Questions fréquentes
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="mb-2 font-semibold">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container px-4 py-16">
            <Card className="card-game-effect overflow-hidden">
              <CardContent className="space-y-6 p-8 text-center sm:p-12">
                <h2 className="text-3xl font-bold">
                  Prêt à commencer l&apos;aventure ?
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                  Rejoignez des milliers de joueurs et montrez vos talents de
                  stratège. L&apos;arène vous attend !
                </p>
                <Link href="/signup">
                  <Button size="lg" className="btn-chip gap-2">
                    Créer mon compte gratuitement
                    <IconChevronRight className="size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="bg-muted/50 border-t">
            <div className="container px-4 py-8">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2">
                  <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
                    <IconCards className="text-primary-foreground size-4" />
                  </div>
                  <span className="font-semibold">LaMap241</span>
                </div>

                <div className="text-muted-foreground flex flex-wrap gap-6 text-sm">
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Règles du jeu
                  </Link>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Conditions
                  </Link>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </div>

                <p className="text-muted-foreground text-sm">
                  © 2024 LaMap241. Tous droits réservés.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </PageContainer>
    </div>
  );
}

// Data
const features = [
  {
    icon: IconTrophy,
    title: "Gains instantanés",
    description: "Remportez vos gains immédiatement après chaque victoire",
  },
  {
    icon: IconDeviceMobile,
    title: "Mobile Money",
    description: "Dépôts et retraits faciles via Airtel Money et Moov Money",
  },
  {
    icon: IconShieldCheck,
    title: "100% Sécurisé",
    description: "Plateforme sécurisée avec anti-triche intégré",
  },
  {
    icon: IconUsersGroup,
    title: "Multijoueur",
    description: "Affrontez des joueurs du monde entier en temps réel",
  },
] as const;

const stats = [
  { value: "10K+", label: "Joueurs actifs" },
  { value: "50K+", label: "Parties jouées" },
  { value: "5M", label: "FCFA distribués" },
  { value: "4.8/5", label: "Note moyenne" },
];

const steps = [
  {
    title: "Créez votre compte",
    description: "Inscription rapide avec votre numéro de téléphone",
  },
  {
    title: "Rechargez votre solde",
    description:
      "Utilisez Mobile Money pour ajouter des fonds en quelques secondes",
  },
  {
    title: "Choisissez votre mise",
    description: "Créez ou rejoignez une partie avec la mise de votre choix",
  },
  {
    title: "Remportez la victoire",
    description: "Gagnez et retirez vos gains instantanément sur votre compte",
  },
];

const faqs = [
  {
    question: "Comment retirer mes gains ?",
    answer:
      "Les retraits sont instantanés via Mobile Money. Allez dans votre portefeuille, cliquez sur 'Retirer' et suivez les instructions.",
  },
  {
    question: "Quel est le montant minimum de mise ?",
    answer: "Vous pouvez commencer à jouer avec une mise minimum de 100 FCFA.",
  },
  {
    question: "Le jeu est-il légal ?",
    answer:
      "Oui, LaMap241 opère dans le respect de la législation en vigueur concernant les jeux d'argent en ligne.",
  },
];
