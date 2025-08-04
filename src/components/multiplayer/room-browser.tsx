"use client";

import { useState } from "react";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { LibButton } from "@/components/library/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  IconRefresh,
  IconUsers,
  IconCoin,
  IconClock,
  IconLock,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface RoomBrowserProps {
  onCreateRoom: () => void;
}

export function RoomBrowser({ onCreateRoom }: RoomBrowserProps) {
  const {
    availableRooms,
    roomCount,
    isLoading,
    joinRoom,
    refreshRooms,
    getFilteredRooms,
    isJoiningRoom,
    joinRoomError,
  } = useMatchmaking();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxBet, setMaxBet] = useState<number>();
  const [showFilters, setShowFilters] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  // Filtrer les salles
  const filteredRooms = getFilteredRooms({
    searchTerm: searchTerm.trim() || undefined,
    maxBet,
  });

  const handleJoinRoom = async (roomId: string, requiresPassword = false) => {
    setJoiningRoomId(roomId);

    try {
      if (requiresPassword) {
        const password = prompt("Mot de passe de la salle :");
        if (!password) {
          setJoiningRoomId(null);
          return;
        }
        await joinRoom({ roomId, password });
      } else {
        await joinRoom({ roomId });
      }

      toast.success("Salle rejointe avec succès !");
    } catch (error) {
      toast.error(joinRoomError?.message ?? "Erreur lors de la connexion");
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Salles disponibles</h2>
          <p className="text-muted-foreground">
            {roomCount} salle{roomCount !== 1 ? "s" : ""} en attente de joueurs
          </p>
        </div>

        <div className="flex gap-2">
          <LibButton
            onClick={refreshRooms}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <IconRefresh className="mr-2 h-4 w-4" />
            Actualiser
          </LibButton>

          <LibButton onClick={onCreateRoom} size="sm">
            Créer une salle
          </LibButton>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Recherche */}
            <div className="relative flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Rechercher par nom ou hôte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bouton filtres */}
            <LibButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <IconFilter className="mr-2 h-4 w-4" />
              Filtres
            </LibButton>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Mise maximale</label>
                  <Input
                    type="number"
                    placeholder="Ex: 100"
                    value={maxBet ?? ""}
                    onChange={(e) =>
                      setMaxBet(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des salles */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Chargement des salles...
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <IconUsers className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">Aucune salle disponible</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {roomCount === 0
                  ? "Soyez le premier à créer une salle !"
                  : "Aucune salle ne correspond à vos critères."}
              </p>
              <LibButton onClick={onCreateRoom}>Créer une salle</LibButton>
            </CardContent>
          </Card>
        ) : (
          filteredRooms.map((room: any) => (
            <Card key={room.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {room.name}
                      {/* TODO: Ajouter icône si salle privée */}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Hôte: {room.hostUsername}
                    </p>
                  </div>

                  <LibButton
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={isJoiningRoom && joiningRoomId === room.id}
                    size="sm"
                  >
                    {joiningRoomId === room.id ? "Connexion..." : "Rejoindre"}
                  </LibButton>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconUsers className="h-3 w-3" />
                    {room.currentPlayers}/{room.maxPlayers}
                  </Badge>

                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconCoin className="h-3 w-3" />
                    {room.bet} koras
                  </Badge>

                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconClock className="h-3 w-3" />
                    {room.maxRounds} rounds
                  </Badge>

                  <span className="text-muted-foreground">
                    Créée {new Date(room.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
