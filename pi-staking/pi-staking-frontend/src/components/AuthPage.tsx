import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ParticleBackground } from './ParticleBackground';

interface AuthPageProps {
  onBack?: () => void;
}

export function AuthPage({ onBack }: AuthPageProps) {
  const { login, register, sendEmailVerification, state, clearError } = useAuth();
  const { isLoading, error } = state;
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    referral_code: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    login: false,
    register: false,
    confirm: false
  });
  
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && !registerForm.referral_code) {
      setRegisterForm(prev => ({ ...prev, referral_code: ref }));
    }
  }, [activeTab, registerForm.referral_code]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login({
      email: loginForm.email,
      password: loginForm.password
    });
    // La redirection se fait automatiquement via AppContent
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (registerForm.password !== registerForm.password_confirmation) {
      return;
    }
    const success = await register(registerForm);
    
    if (success) {
      // Envoyer automatiquement l'email de vérification
      const emailResult = await sendEmailVerification(registerForm.email);
      // La redirection vers EmailVerificationPage se fait automatiquement via AppContent
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative">
      <ParticleBackground />
      
      {/* Bouton de retour */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 backdrop-blur-sm bg-card/80 hover:bg-card/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      )}
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full pi-gradient animate-pi-pulse mb-4">
            <span className="text-2xl font-bold text-white">Pi</span>
          </div>
          <h1 className="text-3xl font-bold pi-purple">Pi Staking</h1>
          <p className="text-muted-foreground mt-2">Plateforme de staking Pi Network</p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            {error && (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Connexion
                  </CardTitle>
                  <CardDescription>
                    Connectez-vous pour accéder à vos investissements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords.login ? 'text' : 'password'}
                        placeholder="Votre mot de passe"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, login: !prev.login }))}
                      >
                        {showPasswords.login ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full pi-gradient text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Connexion...
                      </div>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Inscription
                  </CardTitle>
                  <CardDescription>
                    Créez votre compte et commencez à gagner des Pi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Your first name"
                      value={registerForm.first_name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Your last name"
                      value={registerForm.last_name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Votre nom d'utilisateur"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Adresse email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPasswords.register ? 'text' : 'password'}
                        placeholder="Minimum 8 caractères"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, register: !prev.register }))}
                      >
                        {showPasswords.register ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        placeholder="Confirmer votre mot de passe"
                        value={registerForm.password_confirmation}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {registerForm.password && registerForm.password_confirmation && 
                     registerForm.password !== registerForm.password_confirmation && (
                      <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="referral">Code de parrainage (optionnel)</Label>
                    <Input
                      id="referral"
                      type="text"
                      placeholder="PI-ABC123DEF"
                      value={registerForm.referral_code}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, referral_code: e.target.value }))}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full pi-gradient text-white"
                    disabled={isLoading || registerForm.password !== registerForm.password_confirmation}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Création...
                      </div>
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>En vous inscrivant, vous acceptez nos conditions d'utilisation</p>
        </div>
      </div>
    </div>
  );
}