"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconCrown,
  IconRobot,
  IconCopy,
  IconUsers,
  IconCoin,
  IconLoader2,
  IconArrowLeft,
  IconDeviceGamepad2,
  IconSettings,
  IconShare2,
  IconLink,
  IconUser,
  IconUserX,
  IconClock,
  IconLogout,
  IconMessageCircle,
  IconCircleCheck,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/components/providers/auth-provider";
import { useGameRoom } from "@/hooks/use-game-room";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RoomChat } from "@/components/game/room-chat";
import { WebSocketStatusIndicator } from "@/components/game/websocket-status";
import { routes } from "@/lib/routes";

// Enhanced CountdownTimer with animations
function CountdownTimer({
  seconds,
  onComplete,
  message,
}: {
  seconds: number;
  onComplete: () => void;
  message: string;
}) {
  const [currentSeconds, setCurrentSeconds] = useState(seconds);

  useEffect(() => {
    if (currentSeconds <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCurrentSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentSeconds, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.p
        className="mb-4 text-2xl text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {message}
      </motion.p>
      <motion.p
        className="text-chart-4 text-6xl font-bold"
        key={currentSeconds}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        {currentSeconds}
      </motion.p>
    </motion.div>
  );
}

// Component pour invitation par nom d'utilisateur
function InviteByUsername({
  onInvite,
}: {
  onInvite: (username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!username.trim()) return;

    setLoading(true);
    try {
      await onInvite(username);
      setUsername("");
      toast.success(`Invitation envoyée à ${username}`);
    } catch (error) {
      toast.error("Erreur lors de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Nom d'utilisateur..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        />
        <Button
          onClick={handleInvite}
          disabled={!username.trim() || loading}
          size="sm"
        >
          {loading ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Inviter"
          )}
        </Button>
      </div>
    </div>
  );
}

// Les interfaces sont maintenant dans use-game-room.ts

export default function RoomPage() {
  const params = useParams<{ gameType: string; roomId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Utilisation du hook WebSocket pour la salle
  const {
    room,
    loading,
    error,
    messages,
    toggleReady,
    startGame,
    sendMessage,
    invitePlayer,
    kickPlayer,
    isHost,
    currentPlayer,
    canStartGame,
  } = useGameRoom(params.roomId);

  // Gestion des erreurs WebSocket
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Redirection si la partie démarre
  useEffect(() => {
    if (room?.status === "in_progress") {
      router.push(routes.gamePlay(room.id));
    }
  }, [room?.status, router]);

  const handleLeaveRoom = () => {
    router.push(routes.games);
  };

  const handleInvitePlayer = async (username: string) => {
    try {
      await invitePlayer(username);
    } catch (error) {
      console.error("Error inviting player:", error);
    }
  };

  // Les fonctions de gestion sont maintenant dans le hook useGameRoom

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center p-6">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="bg-background min-h-screen">
      {room?.countdown && (
        <CountdownTimer
          seconds={room.countdown}
          onComplete={() => {}}
          message="La partie commence dans"
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header avec navigation */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLeaveRoom}>
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-foreground text-3xl font-bold">
                Salle de {room.hostName}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <IconUsers className="h-4 w-4" />
                {room.players?.length || 0}/{room.maxPlayers} joueurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WebSocketStatusIndicator showText={true} size="sm" />
            <Badge
              variant="outline"
              className="bg-chart-5/10 text-chart-5 border-chart-5/20 flex items-center gap-1"
            >
              <IconCoin className="h-4 w-4" />
              {room.betAmount} Koras
            </Badge>
            {room.isPrivate && room.code && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(room.code);
                  toast.success("Code copié !");
                }}
              >
                <IconCopy className="mr-1 h-4 w-4" />
                {room.code}
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Zone principale des joueurs */}
          <motion.div
            className="space-y-6 lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Liste des joueurs avec statuts visuels */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <IconUsers className="text-primary h-5 w-5" />
                  Joueurs dans la salle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className="bg-muted/20 border-border/50 flex items-center justify-between rounded-lg border p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {room.hostId === player.userId && (
                          <IconCrown className="text-chart-5 absolute -top-2 -right-2 h-4 w-4" />
                        )}
                        {player.isAI && (
                          <IconRobot className="text-chart-3 absolute -top-2 -left-2 h-4 w-4" />
                        )}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {player.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Indicateur de statut en ligne */}
                        <div
                          className={cn(
                            "border-background absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2",
                            player.status === "online" && player.isReady
                              ? "bg-chart-4"
                              : player.status === "online"
                                ? "bg-chart-5"
                                : "bg-muted-foreground",
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-card-foreground font-semibold">
                            {player.name}
                          </span>
                          {room.hostId === player.userId && (
                            <Badge
                              variant="secondary"
                              className="bg-chart-5/20 text-chart-5 text-xs"
                            >
                              Host
                            </Badge>
                          )}
                          {player.isAI && (
                            <Badge
                              variant="secondary"
                              className="bg-chart-3/20 text-chart-3 text-xs"
                            >
                              IA {player.aiDifficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Rejoint{" "}
                          {new Date(player.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.isReady ? (
                        <Badge className="bg-chart-4 flex items-center gap-1 text-white">
                          <IconCircleCheck className="h-3 w-3" />
                          Prêt
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <IconClock className="h-3 w-3" />
                          En attente
                        </Badge>
                      )}

                      {/* Actions host */}
                      {isHost && player.userId !== user?.id && !player.isAI && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => kickPlayer(player.id)}
                        >
                          <IconUserX className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Emplacements vides avec animation */}
                {Array.from({
                  length: room.maxPlayers - room.players.length,
                }).map((_, i) => (
                  <motion.div
                    key={`empty-${i}`}
                    className="bg-muted/10 border-muted-foreground/30 flex items-center gap-4 rounded-lg border-2 border-dashed p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (room.players.length + i) * 0.1 }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <IconUser className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        En attente d'un joueur...
                      </span>
                      <p className="text-muted-foreground text-xs">
                        Emplacement {room.players.length + i + 1}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Actions principales */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {isHost ? (
                    <Button
                      className="bg-primary hover:bg-primary/90 flex-1"
                      onClick={startGame}
                      disabled={!canStartGame}
                      size="lg"
                    >
                      <IconDeviceGamepad2 className="mr-2 h-5 w-5" />
                      {canStartGame
                        ? "Démarrer la partie"
                        : "En attente des joueurs"}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={toggleReady}
                      variant={currentPlayer?.isReady ? "outline" : "default"}
                      size="lg"
                    >
                      {currentPlayer?.isReady ? (
                        <>
                          <IconUserX className="mr-2 h-5 w-5" />
                          Annuler
                        </>
                      ) : (
                        <>
                          <IconCircleCheck className="mr-2 h-5 w-5" />
                          Je suis prêt
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" onClick={handleLeaveRoom} size="lg">
                    <IconLogout className="mr-2 h-5 w-5" />
                    Quitter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panneau latéral - Invitations et configuration */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Section invitations */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <IconShare2 className="text-secondary h-4 w-4" />
                  Inviter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InviteByUsername onInvite={handleInvitePlayer} />

                {room.isPrivate && room.code && (
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">
                      Code de la salle
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={room.code}
                        readOnly
                        className="text-center font-mono text-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(room.code);
                          toast.success("Code copié !");
                        }}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success("Lien copié !");
                  }}
                >
                  <IconLink className="mr-2 h-4 w-4" />
                  Copier le lien
                </Button>
              </CardContent>
            </Card>

            {/* Configuration de la partie */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <IconSettings className="text-primary h-4 w-4" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jeu:</span>
                    <span className="text-card-foreground font-medium">
                      {room.gameType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Mise par joueur:
                    </span>
                    <span className="text-card-foreground flex items-center gap-1 font-medium">
                      <IconCoin className="text-chart-5 h-3 w-3" />
                      {room.betAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joueurs max:</span>
                    <span className="text-card-foreground font-medium">
                      {room.maxPlayers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée/tour:</span>
                    <span className="text-card-foreground font-medium">
                      {room.settings.turnDuration || 60}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-card-foreground font-medium">
                      {room.isPrivate ? "Privée" : "Publique"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pot:</span>
                    <span className="text-card-foreground flex items-center gap-1 font-bold">
                      <IconCoin className="text-chart-5 h-3 w-3" />
                      {room.betAmount * room.maxPlayers}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Commission (10%):
                    </span>
                    <span className="text-muted-foreground">
                      -{Math.round(room.betAmount * room.maxPlayers * 0.1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat en temps réel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RoomChat
                messages={messages}
                onSendMessage={sendMessage}
                maxHeight="h-64"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
