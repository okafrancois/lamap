"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import type { CreateRoomInput, JoinRoomInput } from "@/types/multiplayer";

export function useMatchmaking() {
  const router = useRouter();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // ========== QUERIES ==========

  const availableRoomsQuery = api.multiplayer.getAvailableRooms.useQuery(
    undefined,
    {
      refetchInterval: 5000, // Actualiser toutes les 5 secondes
      retry: 3,
    },
  );

  // ========== MUTATIONS ==========

  const createRoomMutation = api.multiplayer.createRoom.useMutation();
  const joinRoomMutation = api.multiplayer.joinRoom.useMutation();

  // ========== ACTIONS ==========

  const createRoom = useCallback(
    async (input: CreateRoomInput) => {
      setIsCreatingRoom(true);
      try {
        const result = await createRoomMutation.mutateAsync(input);

        console.log(`✅ Salle créée: ${result.name} (${result.roomId})`);

        // Rediriger vers la salle
        router.push(`/multiplayer/room/${result.roomId}`);

        return result;
      } catch (error) {
        console.error("❌ Erreur création salle:", error);
        throw error;
      } finally {
        setIsCreatingRoom(false);
      }
    },
    [createRoomMutation, router],
  );

  const joinRoom = useCallback(
    async (input: JoinRoomInput) => {
      setIsJoiningRoom(true);
      try {
        await joinRoomMutation.mutateAsync(input);

        console.log(`✅ Salle rejointe: ${input.roomId}`);

        // Rediriger vers la salle
        router.push(`/multiplayer/room/${input.roomId}`);

        return true;
      } catch (error) {
        console.error("❌ Erreur join room:", error);
        throw error;
      } finally {
        setIsJoiningRoom(false);
      }
    },
    [joinRoomMutation, router],
  );

  const refreshRooms = useCallback(() => {
    void availableRoomsQuery.refetch();
  }, [availableRoomsQuery]);

  // ========== HELPER FUNCTIONS ==========

  const getRoomById = useCallback(
    (roomId: string) => {
      return availableRoomsQuery.data?.find((room) => room.id === roomId);
    },
    [availableRoomsQuery.data],
  );

  const getFilteredRooms = useCallback(
    (filter?: {
      maxBet?: number;
      minBet?: number;
      maxRounds?: number;
      searchTerm?: string;
    }) => {
      const rooms = availableRoomsQuery.data ?? [];

      if (!filter) return rooms;

      return rooms.filter((room) => {
        // Filtre par mise
        if (filter.minBet && room.bet < filter.minBet) return false;
        if (filter.maxBet && room.bet > filter.maxBet) return false;

        // Filtre par rounds
        if (filter.maxRounds && room.maxRounds > filter.maxRounds) return false;

        // Filtre par nom
        if (filter.searchTerm) {
          const term = filter.searchTerm.toLowerCase();
          const nameMatch = room.name.toLowerCase().includes(term);
          const hostMatch = room.hostUsername?.toLowerCase().includes(term);
          if (!nameMatch && !hostMatch) return false;
        }

        return true;
      });
    },
    [availableRoomsQuery.data],
  );

  // ========== ÉTAT DÉRIVÉ ==========

  const roomCount = availableRoomsQuery.data?.length ?? 0;
  const isLoading = availableRoomsQuery.isLoading;
  const error = availableRoomsQuery.error;

  return {
    // Données
    availableRooms: availableRoomsQuery.data ?? [],
    roomCount,
    isLoading,
    error,

    // Actions
    createRoom,
    joinRoom,
    refreshRooms,

    // Helpers
    getRoomById,
    getFilteredRooms,

    // États des mutations
    isCreatingRoom,
    isJoiningRoom,
    createRoomError: createRoomMutation.error,
    joinRoomError: joinRoomMutation.error,
  };
}
