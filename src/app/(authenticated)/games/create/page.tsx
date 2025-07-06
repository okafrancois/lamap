"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconCoin,
  IconUsers,
  IconSettings,
  IconDeviceGamepad2,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GameType } from "@prisma/client";
import { motion } from "framer-motion";

import { getConfigGameById } from "@/lib/games";
import { routes } from "@/lib/routes";
import { useAuth } from "@/components/providers/auth-provider";

export default function CreateRoomPage() {
  const searchParams = useSearchParams();
  const gameType = (searchParams.get("gameType") as GameType) ?? "garame";
  const router = useRouter();
  const { user } = useAuth();
  const config = getConfigGameById(gameType);
  const invitePlayerInputRef = useRef<HTMLInputElement>(null);

  if (!config) {
    return (
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">Ce jeu n&apos;est pas disponible</h1>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    betAmount: config.bettingConfig.minBet * 10, // Default bet
    maxPlayers: 4,
    isPrivate: false,
    turnDuration: config.turnConfig.defaultDuration,
    // Invitations will be handled separately
    invitedPlayers: [] as string[],
  });

  const handleInvitePlayer = (username: string) => {
    if (!settings.invitedPlayers.includes(username)) {
      setSettings({
        ...settings,
        invitedPlayers: [...settings.invitedPlayers, username],
      });
    }
  };

  const handleRemoveInvite = (username: string) => {
    setSettings({
      ...settings,
      invitedPlayers: settings.invitedPlayers.filter((u) => u !== username),
    });
  };

  const createRoomMutation = trpc.room.create.useMutation();

  const handleCreateRoom = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    // Vérifier le solde
    const userBalance = user.koras || 0;
    if (settings.betAmount > userBalance) {
      toast.error("Solde insuffisant pour cette mise");
      return;
    }

    setLoading(true);
    try {
      const result = await createRoomMutation.mutateAsync({
        gameType: gameType as GameType,
        betAmount: settings.betAmount,
        maxPlayers: settings.maxPlayers,
        isPrivate: settings.isPrivate,
        turnDuration: settings.turnDuration,
        invitedPlayers: settings.invitedPlayers,
      });

      toast.success(`Salle créée avec succès ! Code: ${result.code}`);
      router.push(routes.gameRoom(result.id));
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <motion.h1
        className="text-foreground mb-8 text-center text-3xl font-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Créer une salle - {config.name}
      </motion.h1>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Configuration - utilise la palette existante */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <IconSettings className="text-primary size-5" />
                Configuration de la partie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mise */}
              <div>
                <Label className="text-card-foreground">
                  Mise par joueur (Koras)
                </Label>
                <div className="mt-2 flex items-center space-x-4">
                  <Slider
                    value={[settings.betAmount]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, betAmount: value })
                    }
                    min={config.bettingConfig.minBet}
                    max={Math.min(
                      (user?.koras || 0) / 4,
                      config.bettingConfig.maxBet,
                    )}
                    step={10}
                    className="flex-1"
                  />
                  <div className="flex min-w-[80px] items-center gap-1">
                    <IconCoin className="text-chart-5 h-4 w-4" />
                    <span className="text-card-foreground text-lg font-bold">
                      {settings.betAmount}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>{config.bettingConfig.minBet}</span>
                  <span>Votre solde: {user?.koras ?? 0}</span>
                </div>
              </div>

              {/* Nombre de joueurs */}
              <div>
                <Label className="text-card-foreground">
                  Nombre de joueurs
                </Label>
                <Select
                  value={settings.maxPlayers.toString()}
                  onValueChange={(v) =>
                    setSettings({ ...settings, maxPlayers: +v })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: config.maxPlayers - config.minPlayers + 1 },
                      (_, i) => (
                        <SelectItem
                          key={i}
                          value={(config.minPlayers + i).toString()}
                        >
                          {config.minPlayers + i} joueurs
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Durée par tour */}
              <div>
                <Label className="text-card-foreground">
                  Durée par tour: {settings.turnDuration}s
                </Label>
                <Slider
                  value={[settings.turnDuration]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, turnDuration: value })
                  }
                  min={config.turnConfig.minDuration}
                  max={config.turnConfig.maxDuration}
                  step={15}
                  className="mt-2"
                />
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>{config.turnConfig.minDuration}s</span>
                  <span>{config.turnConfig.maxDuration}s</span>
                </div>
              </div>

              {/* Type de salle */}
              <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                <div>
                  <Label className="text-card-foreground">Salle privée</Label>
                  <p className="text-muted-foreground text-xs">
                    Seuls les joueurs invités peuvent rejoindre
                  </p>
                </div>
                <Switch
                  checked={settings.isPrivate}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, isPrivate: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invitations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <IconUsers className="text-secondary size-5" />
                Inviter des joueurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Invitation par nom d'utilisateur */}
                <div>
                  <Label className="text-card-foreground mb-2 block">
                    Inviter par nom d'utilisateur
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Pseudo..."
                      ref={invitePlayerInputRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.target as HTMLInputElement;
                          handleInvitePlayer(target.value);
                          target.value = "";
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (invitePlayerInputRef.current) {
                          handleInvitePlayer(
                            invitePlayerInputRef.current.value,
                          );
                          invitePlayerInputRef.current.value = "";
                        }
                      }}
                    >
                      Inviter
                    </Button>
                  </div>
                </div>

                {/* Liste des joueurs invités */}
                {settings.invitedPlayers.length > 0 && (
                  <div>
                    <Label className="text-card-foreground mb-2 block">
                      Joueurs invités ({settings.invitedPlayers.length}/
                      {settings.maxPlayers - 1})
                    </Label>
                    <div className="space-y-2">
                      {settings.invitedPlayers.map((username) => (
                        <div
                          key={username}
                          className="bg-muted/20 flex items-center justify-between rounded p-2"
                        >
                          <span className="font-medium">{username}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInvite(username)}
                          >
                            Retirer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Résumé de la configuration */}
                <div className="bg-secondary/10 mt-6 rounded-lg p-4">
                  <h4 className="text-card-foreground mb-3 font-semibold">
                    Résumé de la partie
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jeu:</span>
                      <span className="text-card-foreground font-medium">
                        {config.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Mise/joueur:
                      </span>
                      <span className="text-card-foreground flex items-center gap-1 font-medium">
                        <IconCoin className="text-chart-5 h-3 w-3" />
                        {settings.betAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joueurs:</span>
                      <span className="text-card-foreground font-medium">
                        {settings.maxPlayers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée/tour:</span>
                      <span className="text-card-foreground font-medium">
                        {settings.turnDuration}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission:</span>
                      <span className="text-card-foreground font-medium">
                        {config.bettingConfig.commissionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total pot:</span>
                      <span className="text-card-foreground flex items-center gap-1 font-medium">
                        <IconCoin className="text-chart-5 h-3 w-3" />
                        {settings.betAmount * settings.maxPlayers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleCreateRoom}
          size="lg"
          className="bg-primary hover:bg-primary/90 min-w-[200px]"
          disabled={
            loading ||
            settings.betAmount > (user?.koras || 0) ||
            createRoomMutation.isPending
          }
        >
          <IconDeviceGamepad2 className="mr-2 size-5" />
          {loading ? "Création..." : "Créer la salle"}
        </Button>
      </motion.div>
    </div>
  );
}
