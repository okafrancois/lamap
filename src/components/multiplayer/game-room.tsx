"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMultiplayerGame } from "@/hooks/use-multiplayer-game";
import { LibButton } from "@/components/library/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  IconCrown,
  IconCheck,
  IconClock,
  IconLogout,
  IconPlayerPlay,
  IconUsers,
  IconCoin,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface GameRoomProps {
  roomId: string;
}

export function GameRoom({ roomId }: GameRoomProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    roomData,
    currentPhase,
    isLoading,
    error,
    isConnected,
    currentPlayer,
    isHost,
    isReady,
    canStartGame,
    allPlayersReady,
    toggleReady,
    leaveRoom,
    startGame,
    pollingStats,
    isTogglingReady,
    isStartingGame,
  } = useMultiplayerGame({ roomId });

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      const success = await leaveRoom();
      if (success) {
        toast.success("Vous avez quitté la salle");
        router.push("/multiplayer");
      }
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleToggleReady = async () => {
    const success = await toggleReady();
    if (success) {
      toast.success(isReady ? "Vous n'êtes plus prêt" : "Vous êtes prêt !");
    }
  };

  const handleStartGame = async () => {
    const result = await startGame();
    if (result) {
      toast.success("Partie démarrée !");
      // TODO: Rediriger vers l'interface de jeu
      router.push(`/multiplayer/game/${result.gameId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Connexion à la salle...</div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6 text-center">
          <h3 className="text-lg font-semibold">Erreur de connexion</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message ?? "Impossible de se connecter à la salle"}
          </p>
          <LibButton onClick={() => router.push("/multiplayer")}>
            Retour au lobby
          </LibButton>
        </CardContent>
      </Card>
    );
  }

  const getPlayerStatusColor = (player: any) => {
    if (player.isReady) return "bg-green-500";
    if (player.isHost) return "bg-blue-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la salle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3">
                {roomData.room.name}
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {isConnected ? (
                    <IconWifi className="h-3 w-3" />
                  ) : (
                    <IconWifiOff className="h-3 w-3" />
                  )}
                  {isConnected ? "Connecté" : "Déconnecté"}
                </Badge>
              </CardTitle>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <IconUsers className="h-4 w-4" />
                  {roomData.players.length}/2 joueurs
                </span>
                <span className="flex items-center gap-1">
                  <IconCoin className="h-4 w-4" />
                  {roomData.room.bet} koras
                </span>
                <span className="flex items-center gap-1">
                  <IconClock className="h-4 w-4" />
                  {roomData.room.maxRounds} rounds
                </span>
              </div>
            </div>

            <LibButton
              variant="outline"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
            >
              <IconLogout className="mr-2 h-4 w-4" />
              {isLeaving ? "Déconnexion..." : "Quitter"}
            </LibButton>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des joueurs */}
      <Card>
        <CardHeader>
          <CardTitle>Joueurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roomData.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {(player.username ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white ${getPlayerStatusColor(player)}`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.username}</span>
                    {player.isHost && (
                      <IconCrown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {player.koras} koras
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {player.isReady ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <IconCheck className="h-3 w-3" />
                    Prêt
                  </Badge>
                ) : (
                  <Badge variant="outline">En attente</Badge>
                )}
              </div>
            </div>
          ))}

          {/* Slot vide pour le deuxième joueur */}
          {roomData.players.length < 2 && (
            <div className="text-muted-foreground flex items-center justify-center rounded-lg border-2 border-dashed p-8">
              <div className="text-center">
                <IconUsers className="mx-auto mb-2 h-8 w-8" />
                <p>En attente d'un adversaire...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          {roomData.room.status === "WAITING" ? (
            <div className="space-y-4">
              {/* Bouton prêt/pas prêt */}
              <LibButton
                onClick={handleToggleReady}
                disabled={isTogglingReady}
                variant={isReady ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                {isTogglingReady ? (
                  "Mise à jour..."
                ) : isReady ? (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Prêt !
                  </>
                ) : (
                  "Je suis prêt"
                )}
              </LibButton>

              {/* Bouton démarrer (hôte uniquement) */}
              {isHost && (
                <LibButton
                  onClick={handleStartGame}
                  disabled={!canStartGame || isStartingGame}
                  className="w-full"
                  size="lg"
                >
                  {isStartingGame ? (
                    "Démarrage..."
                  ) : (
                    <>
                      <IconPlayerPlay className="mr-2 h-4 w-4" />
                      Démarrer la partie
                    </>
                  )}
                </LibButton>
              )}

              {/* Messages d'aide */}
              {isHost && !allPlayersReady && roomData.players.length >= 2 && (
                <p className="text-muted-foreground text-center text-sm">
                  Tous les joueurs doivent être prêts pour commencer
                </p>
              )}

              {isHost && roomData.players.length < 2 && (
                <p className="text-muted-foreground text-center text-sm">
                  En attente d'un deuxième joueur
                </p>
              )}

              {!isHost && (
                <p className="text-muted-foreground text-center text-sm">
                  L'hôte démarrera la partie quand tous seront prêts
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold">Partie en cours...</p>
              <p className="text-muted-foreground">Redirection vers le jeu</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de debug (dev uniquement) */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              <div>Phase: {currentPhase}</div>
              <div>Polling: {pollingStats.currentInterval}ms</div>
              <div>Version: {pollingStats.version}</div>
              <div>
                Dernière activité:{" "}
                {pollingStats.lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
