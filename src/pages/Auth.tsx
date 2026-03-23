import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

type AuthPageProps = {
  initialMode?: "login" | "register" | "forgot-password";
};

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = "login" }) => {
  const [searchParams] = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">(initialMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-2xl bg-background/60 p-6 rounded-lg shadow-lg z-10 flex gap-6">
        <div className="hidden md:flex flex-col items-center justify-center w-1/3 p-4">
          <img src="/logo.png" alt="Paroisse" className="w-24 h-24 object-contain" />
          <h2 className="mt-4 text-xl font-semibold">Paroisse</h2>
          <p className="text-sm text-muted-foreground mt-2">Bienvenue — connectez-vous ou inscrivez-vous</p>
        </div>

        <div className="w-full md:w-2/3">
          {confirmed && (
            <Alert className="mb-4 border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Email confirmé</AlertTitle>
              <AlertDescription>
                Votre compte est activé. Vous pouvez vous connecter avec votre adresse email et votre mot de passe.
              </AlertDescription>
            </Alert>
          )}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" className="text-xs">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="text-xs">Inscription</TabsTrigger>
              <TabsTrigger value="forgot-password" className="text-xs">Mot de passe</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <LoginForm 
                onSuccess={() => setActiveTab("login")} 
                onForgotPassword={() => setActiveTab("forgot-password")}
              />
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <RegisterForm 
                onSuccess={() => setActiveTab("register")} 
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </TabsContent>

            <TabsContent value="forgot-password" className="mt-4">
              <ForgotPasswordForm 
                onSuccess={() => setActiveTab("login")} 
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
