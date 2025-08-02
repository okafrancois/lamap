"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useMultiplayerEngine } from "@/hooks/use-multiplayer-engine";
import { LibButton } from "@/components/library/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconArrowLeft, IconWifi, IconWifiOff } from "@tabler/icons-react";

// Import des composants de jeu existants (on va les réutiliser)
import { GameBoard } from "common/game-board";
import { VictoryModal } from "common/victory-modal";
import { useUserDataContext } from "@/components/layout/user-provider";

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default function MultiplayerGamePage({ params }: GamePageProps) {
  const { gameId } = React.use(params);
  const router = useRouter();
  const userData = useUserDataContext();
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Pour l'instant, on simule roomId et isHost
  // En production, ces infos viendraient de la base de données
  const [gameConfig, setGameConfig] = useState<{
    roomId: string;
    isHost: boolean;
  } | null>(null);

  const {
    gameState,
    isEngineReady,
    localPlayer,
    isMyTurn,
    canPlay,
    playCard,
    canPlayCard,
    getVictoryType,
    getVictoryMessage,
    engine,
    isSendingEvent,
    eventError,
    eventsProcessedCount,
  } = useMultiplayerEngine({
    roomId: gameConfig?.roomId ?? "",
    gameId,
    isHost: gameConfig?.isHost ?? false,
  });

  // Simuler la récupération des infos de la partie depuis la DB
  useEffect(() => {
    // TODO: Récupérer les vraies infos depuis tRPC
    // Pour l'instant, simulation
    setGameConfig({
      roomId: `room-${gameId.split("-")[1]}`, // Simulé
      isHost: true, // Simulé
    });
  }, [gameId]);

  // Gérer la fin de partie
  useEffect(() => {
    if (gameState?.status === "ended" && !showVictoryModal) {
      setTimeout(() => setShowVictoryModal(true), 1000);
    }
  }, [gameState?.status, showVictoryModal]);

  const handleCardPlay = (cardIndex: number) => {
    if (!canPlay || !localPlayer?.hand) {
      console.warn("Ce n'est pas votre tour ou le jeu n'est pas en cours");
      return;
    }

    // Convertir l'index en cardId
    const card = localPlayer.hand[cardIndex];
    if (!card) {
      console.warn("Carte introuvable à l'index:", cardIndex);
      return;
    }

    const success = playCard(card.id);
    if (!success) {
      console.warn("Impossible de jouer cette carte");
    }
  };

  const handleVictoryModalClose = () => {
    setShowVictoryModal(false);
    // Rediriger vers le lobby après 2 secondes
    setTimeout(() => {
      router.push("/multiplayer");
    }, 2000);
  };

  if (!gameConfig || !isEngineReady) {
    return (
      <PageContainer>
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground text-center">
            <div className="mb-2">Chargement de la partie...</div>
            <div className="text-sm">Connexion au serveur de jeu</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!gameState) {
    return (
      <PageContainer>
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold">Partie introuvable</h3>
            <p className="text-muted-foreground mb-4">
              Impossible de charger les données de la partie
            </p>
            <LibButton onClick={() => router.push("/multiplayer")}>
              Retour au lobby
            </LibButton>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const isGameEnded = gameState.status === "ended";
  const currentPlayerUsername = userData?.user.username ?? "";

  return (
    <PageContainer>
      {/* En-tête avec infos de connexion */}
      <div className="mb-6 flex items-center justify-between">
        <LibButton
          variant="ghost"
          size="sm"
          onClick={() => router.push("/multiplayer")}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Retour au lobby
        </LibButton>

        <div className="flex items-center gap-4">
          {/* Statut de connexion */}
          <Badge variant="outline" className="flex items-center gap-2">
            {isSendingEvent ? (
              <IconWifiOff className="h-3 w-3" />
            ) : (
              <IconWifi className="h-3 w-3" />
            )}
            {isSendingEvent ? "Envoi..." : "Connecté"}
          </Badge>

          {/* Tour du joueur */}
          <Badge variant={isMyTurn ? "default" : "outline"}>
            {isMyTurn ? "Votre tour" : "Tour adversaire"}
          </Badge>

          {/* Statut du jeu */}
          <Badge
            variant={
              gameState.status === "playing"
                ? "default"
                : gameState.status === "ended"
                  ? "destructive"
                  : "outline"
            }
          >
            {gameState.status === "playing"
              ? "En cours"
              : gameState.status === "ended"
                ? "Terminée"
                : "En attente"}
          </Badge>
        </div>
      </div>

      {/* Interface de jeu principal */}
      <GameBoard
        gameState={gameState}
        onCardClick={handleCardPlay}
        currentUserId={currentPlayerUsername}
        connectionStatus={isSendingEvent ? "reconnecting" : "connected"}
        gameId={gameId}
      />

      {/* Informations de debug (développement) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h4 className="mb-2 text-sm font-semibold">Debug Multi-joueur</h4>
            <div className="space-y-1 text-xs">
              <div>Game ID: {gameId}</div>
              <div>Room ID: {gameConfig.roomId}</div>
              <div>Is Host: {gameConfig.isHost ? "Oui" : "Non"}</div>
              <div>Events processed: {eventsProcessedCount}</div>
              <div>Is my turn: {isMyTurn ? "Oui" : "Non"}</div>
              <div>Can play: {canPlay ? "Oui" : "Non"}</div>
              {eventError && (
                <div className="text-red-500">Error: {eventError.message}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de victoire */}
      {showVictoryModal && gameState && (
        <VictoryModal
          isVisible={showVictoryModal}
          isVictory={gameState.winnerUsername === currentPlayerUsername}
          playerKoras={localPlayer?.koras ?? 0}
          opponentKoras={
            gameState.players.find((p) => p.username !== currentPlayerUsername)
              ?.koras ?? 0
          }
          betAmount={gameState.currentBet}
          korasWon={
            gameState.currentBet *
            (gameState.winnerUsername === currentPlayerUsername ? 1 : -1)
          }
          victoryType={{
            ...getVictoryType(currentPlayerUsername),
            title: getVictoryType(currentPlayerUsername).description,
            multiplier: `x${getVictoryType(currentPlayerUsername).multiplier}`,
            special: getVictoryType(currentPlayerUsername).type !== "normal",
          }}
          victoryMessage={getVictoryMessage(
            gameState.winnerUsername === currentPlayerUsername,
          )}
          onClose={handleVictoryModalClose}
          onPlayAgain={() => {
            // TODO: Implémenter "rejouer" en multi-joueur
            router.push("/multiplayer");
          }}
        />
      )}
    </PageContainer>
  );
}
