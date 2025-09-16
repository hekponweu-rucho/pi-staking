import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ParticleBackground } from "@/components/ParticleBackground";
import { 
  ArrowRight, 
  Sparkles, 
  Coins, 
  TrendingUp, 
  Shield, 
  Users, 
  Gift, 
  Star,
  Zap,
  Target,
  Award,
  Clock,
  DollarSign,
  CheckCircle,
  PlayCircle,
  LogIn,
  UserPlus
} from "lucide-react";
import { useStaking } from "../contexts/StakingContext";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onGetStarted: () => void;
}

export const LandingPageEnhanced: React.FC<LandingPageProps> = ({
  onLogin,
  onRegister,
  onGetStarted
}) => {
  const { state: stakingState } = useStaking();
  const { state: authState } = useAuth();
  const { state: dashboardState } = useDashboard();
  
  // États locaux pour les animations
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Utiliser les vraies données des packages si disponibles
  const packages = stakingState.packages.length > 0 
    ? stakingState.packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        minAmount: `${pkg.min_amount} Pi`,
        maxAmount: pkg.max_amount ? `${pkg.max_amount} Pi` : "Illimité",
        dailyRate: `${(pkg.daily_rate * 100).toFixed(1)}%`,
        duration: `${pkg.max_duration_days} jours`,
        totalReturn: `${((pkg.daily_rate * pkg.max_duration_days) * 100).toFixed(0)}%`,
        popular: pkg.level === 'bronze'
      }))
    : [
      {
        id: '1',
        name: "Discovery",
        description: "Pour débuter dans l'écosystème Pi",
        minAmount: "10 Pi",
        maxAmount: "100 Pi",
        dailyRate: "2.0%",
        duration: "30 jours",
        totalReturn: "60%",
        popular: false
      },
      {
        id: '2',
        name: "Bronze",
        description: "Le choix idéal pour les investisseurs réguliers",
        minAmount: "100 Pi",
        maxAmount: "500 Pi",
        dailyRate: "2.2%",
        duration: "60 jours",
        totalReturn: "132%",
        popular: true
      },
      {
        id: '3',
        name: "Silver",
        description: "Rendements optimisés pour investisseurs sérieux",
        minAmount: "500 Pi",
        maxAmount: "2000 Pi",
        dailyRate: "2.5%",
        duration: "90 jours",
        totalReturn: "225%",
        popular: false
      },
      {
        id: '4',
        name: "Gold",
        description: "Package premium avec bonus exclusifs",
        minAmount: "2000 Pi",
        maxAmount: "10000 Pi",
        dailyRate: "2.8%",
        duration: "120 jours",
        totalReturn: "336%",
        popular: false
      }
    ];

  const features = [
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Authentification 2FA, chiffrement avancé, et protection anti-fraude pour vos investissements."
    },
    {
      icon: TrendingUp,
      title: "Rendements Quotidiens",
      description: "Gagnez jusqu'à 2.8% par jour avec nos packages de staking optimisés et transparents."
    },
    {
      icon: Users,
      title: "Programme de Parrainage",
      description: "Gagnez 5% de commission sur les investissements de vos filleuls + bonus de niveau."
    },
    {
      icon: Zap,
      title: "Claims Instantanés",
      description: "Récupérez vos gains quotidiens en un clic, 24h/24 avec notre système optimisé."
    },
    {
      icon: Award,
      title: "Système de Niveaux",
      description: "Progressez et débloquez des avantages exclusifs selon votre activité et ancienneté."
    },
    {
      icon: Target,
      title: "Transparence Totale",
      description: "Tous les calculs, frais et rendements sont clairement affichés sans frais cachés."
    }
  ];

  // Utiliser les vraies statistiques si disponibles
  const stats = [
    { 
      label: "Utilisateurs Actifs", 
      value: dashboardState.dashboardData?.statistics.total_users 
        ? `${(dashboardState.dashboardData.statistics.total_users / 1000).toFixed(0)}K+`
        : "15,000+", 
      icon: Users 
    },
    { 
      label: "Volume Total Verrouillé", 
      value: dashboardState.dashboardData?.statistics.platform_tvl 
        ? `${(dashboardState.dashboardData.statistics.platform_tvl / 1000000).toFixed(1)}M  Pi`
        : "2.5M  Pi", 
      icon: Coins 
    },
    { 
      label: "Gains Distribués", 
      value: stakingState.totalClaimed > 0 
        ? `${(stakingState.totalClaimed / 1000).toFixed(0)}K  Pi`
        : "500K  Pi", 
      icon: TrendingUp 
    },
    { 
      label: "Taux de Satisfaction", 
      value: "98.5%", 
      icon: Star 
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    if (authState.isAuthenticated) {
      // Rediriger vers le dashboard avec le package sélectionné
      onGetStarted();
    } else {
      // Rediriger vers l'inscription avec le package pré-sélectionné
      onRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-x-hidden">
      <ParticleBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full pi-gradient animate-pi-pulse">
              <span className="text-lg font-bold text-white"> Pi</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-pi-gradient">Pi Staking</h1>
              <p className="text-xs text-muted-foreground">Powered by Pi Network</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {authState.isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Bienvenue, {authState.user?.username}
                </span>
                <Button onClick={onGetStarted} size="sm" className="pi-gradient text-white hover:pi-gradient-hover">
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onLogin}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Button>
                <Button size="sm" className="pi-gradient text-white hover:pi-gradient-hover" onClick={onRegister}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className={`mx-auto max-w-4xl space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              {/* Bonus Banner */}
              {!authState.welcomeBonusClaimed && (
                <div className="inline-flex items-center gap-2 rounded-full border border-pi-gold/30 bg-pi-gold/10 px-6 py-2 text-sm font-medium text-pi-gold backdrop-blur-sm animate-pi-shimmer">
                  <Gift className="h-4 w-4" />
                  <span>🎉 BONUS DE BIENVENUE : 100 Pi OFFERTS + 20% de bonus sur votre premier dépôt !</span>
                </div>
              )}

              <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
                Gagnez des{" "}
                <span className="text-pi-gradient animate-pi-shimmer">
                  Récompenses
                </span>
                {" "}quotidiennes avec{" "}
                <span className="text-pi-gradient">
                  Pi Network
                </span>
              </h1>
              
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground md:text-2xl">
                La plateforme de staking #1 pour Pi Network. Investissez vos  Pi et gagnez jusqu'à{" "}
                <span className="font-bold text-pi-gold">2.8% par jour</span> avec nos packages sécurisés.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                {authState.isAuthenticated ? (
                  <Button size="lg" className="pi-gradient text-white hover:pi-gradient-hover glow-pi group text-lg px-8 py-6" onClick={onGetStarted}>
                    <span>Accéder au Dashboard</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="pi-gradient text-white hover:pi-gradient-hover glow-pi group text-lg px-8 py-6" onClick={onRegister}>
                      <span>Commencer Maintenant</span>
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-pi-purple/30 hover:bg-pi-purple/10">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Voir la Démo
                    </Button>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className={`text-center transition-all duration-500 delay-${index * 100}`}>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-pi-purple/10">
                      <stat.icon className="h-6 w-6 text-pi-purple" />
                    </div>
                    <div className="text-2xl font-bold md:text-3xl">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold md:text-5xl mb-6">
                Pourquoi choisir{" "}
                <span className="text-pi-gradient">Pi Staking</span> ?
              </h2>
              <p className="text-xl text-muted-foreground">
                Découvrez les avantages uniques de notre plateforme de staking nouvelle génération.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="group border-border/50 bg-card/80 backdrop-blur-sm hover:glow-pi transition-all duration-300 animate-pi-float" style={{animationDelay: `${index * 200}ms`}}>
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full pi-gradient group-hover:animate-pi-pulse">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold md:text-5xl mb-6">
                Nos{" "}
                <span className="text-pi-gradient">Packages de Staking</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Choisissez le package qui correspond à vos objectifs d'investissement.
              </p>
              {stakingState.packagesLoading && (
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-pi-purple border-t-transparent rounded-full"></div>
                    Chargement des packages en temps réel...
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, index) => (
                <Card key={pkg.id} className={`relative group border-border/50 bg-card/80 backdrop-blur-sm hover:glow-pi transition-all duration-300 ${
                  pkg.popular ? 'ring-2 ring-pi-gold ring-opacity-50 glow-pi-strong' : ''
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-pi-gold text-black font-bold px-4 py-1">
                        ⭐ POPULAIRE
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-pi-gradient">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm">{pkg.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pi-gold">{pkg.dailyRate}</div>
                      <div className="text-sm text-muted-foreground">par jour</div>
                    </div>
                    
                    <Separator className="opacity-50" />
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Montant min:</span>
                        <span className="font-semibold">{pkg.minAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Montant max:</span>
                        <span className="font-semibold">{pkg.maxAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durée:</span>
                        <span className="font-semibold">{pkg.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rendement total:</span>
                        <span className="font-bold text-pi-gold">+{pkg.totalReturn}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full ${
                        pkg.popular 
                          ? 'pi-gradient text-white hover:pi-gradient-hover' 
                          : 'border-pi-purple/30 hover:bg-pi-purple/10'
                      }`}
                      variant={pkg.popular ? 'default' : 'outline'}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      {authState.isAuthenticated ? 'Investir Maintenant' : 'Choisir ce Package'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Real-time data notice */}
            {stakingState.packages.length > 0 && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  Données mises à jour en temps réel depuis notre backend
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold md:text-5xl mb-6">
                Ce que disent nos{" "}
                <span className="text-pi-gradient">Investisseurs</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Découvrez pourquoi plus de 15,000 personnes nous font confiance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:glow-pi transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-pi-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Interface incroyable et gains réguliers ! J'ai déjà gagné plus de 500 Pi en seulement 2 mois."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full pi-gradient flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div>
                      <p className="font-semibold">Marie L.</p>
                      <p className="text-sm text-muted-foreground">Investisseuse depuis 8 mois</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:glow-pi transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-pi-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "La sécurité est au top ! Jamais eu de problème et les retraits sont toujours instantanés."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full pi-gradient flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <p className="font-semibold">Ahmed K.</p>
                      <p className="text-sm text-muted-foreground">Investisseur Gold depuis 1 an</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:glow-pi transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-pi-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Le programme de parrainage m'a permis de gagner un revenu passif supplémentaire. Parfait !"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full pi-gradient flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div>
                      <p className="font-semibold">Sophie R.</p>
                      <p className="text-sm text-muted-foreground">Ambassadrice Diamond</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-pi-purple/10 via-transparent to-pi-gold/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              {!authState.isAuthenticated && (
                <div className="inline-flex items-center gap-2 rounded-full border border-pi-gold/30 bg-pi-gold/10 px-6 py-2 text-sm font-medium text-pi-gold backdrop-blur-sm animate-pi-bounce">
                  <Gift className="h-4 w-4" />
                  <span>🔥 OFFRE LIMITÉE : Bonus de 100 Pi + 20% sur votre premier dépôt !</span>
                </div>
              )}
              
              <h2 className="text-3xl font-bold md:text-5xl">
                {authState.isAuthenticated ? (
                  <>
                    Prêt à investir vos{" "}
                    <span className="text-pi-gradient"> Pi aujourd'hui</span> ?
                  </>
                ) : (
                  <>
                    Prêt à commencer votre{" "}
                    <span className="text-pi-gradient">aventure Pi Staking</span> ?
                  </>
                )}
              </h2>
              
              <p className="text-xl text-muted-foreground">
                {authState.isAuthenticated ? (
                  `Accédez à votre dashboard pour gérer vos investissements et réclamez vos gains quotidiens.`
                ) : (
                  "Rejoignez plus de 15,000 investisseurs qui font confiance à Pi Staking pour faire fructifier leurs  Pi."
                )}
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                {authState.isAuthenticated ? (
                  <Button size="lg" className="pi-gradient text-white hover:pi-gradient-hover glow-pi-strong group text-lg px-12 py-6" onClick={onGetStarted}>
                    <TrendingUp className="mr-2 h-6 w-6" />
                    <span>Accéder au Dashboard</span>
                    <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button size="lg" className="pi-gradient text-white hover:pi-gradient-hover glow-pi-strong group text-lg px-12 py-6" onClick={onRegister}>
                    <Gift className="mr-2 h-6 w-6" />
                    <span>Réclamez vos 100 Pi Gratuits</span>
                    <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Inscription gratuite en 2 minutes</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{authState.isAuthenticated ? 'Investissement instantané' : 'Bonus de bienvenue immédiat'}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Claims disponibles 24h/24</span>
                </div>
              </div>
              
              {!authState.isAuthenticated && (
                <div className="text-xs text-muted-foreground/70">
                  * Offre valable pour les nouveaux membres uniquement. Conditions d'utilisation applicables.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/80 backdrop-blur-md py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full pi-gradient">
                  <span className="text-lg font-bold text-white"> Pi</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-pi-gradient">Pi Staking</h3>
                  <p className="text-xs text-muted-foreground">Powered by Pi Network</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                La plateforme de staking la plus sécurisée et rentable pour Pi Network.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-pi-gold transition-colors">Packages de Staking</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Programme de Parrainage</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Dashboard</button></li>
                <li><button className="hover:text-pi-gold transition-colors">API</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-pi-gold transition-colors">Centre d'Aide</button></li>
                <li><button className="hover:text-pi-gold transition-colors">FAQ</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Contact</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Status</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-pi-gold transition-colors">Conditions d'Utilisation</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Politique de Confidentialité</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Mentions Légales</button></li>
                <li><button className="hover:text-pi-gold transition-colors">Sécurité</button></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 opacity-50" />
          
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© 2024 Pi Staking. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span>Fait avec</span>
              <span className="text-red-500">❤️</span>
              <span>pour la communauté Pi Network</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};