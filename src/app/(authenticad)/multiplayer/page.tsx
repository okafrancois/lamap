"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { LibTitle } from "@/components/library/title";
import { RoomBrowser } from "@/components/multiplayer/room-browser";
import { CreateRoomDialog } from "@/components/multiplayer/create-room-dialog";
import { IconSwords } from "@tabler/icons-react";

export default function MultiplayerPage() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  return (
    <PageContainer>
      {/* En-tête */}
      <div className="mb-8">
        <LibTitle
          as="h1"
          className="flex items-center gap-3 text-3xl font-bold"
        >
          <div className="rounded-lg bg-gradient-to-br from-red-500 to-orange-600 p-2">
            <IconSwords className="h-8 w-8 text-white" />
          </div>
          Multi-joueur
        </LibTitle>
        <p className="text-muted-foreground mt-2">
          Affrontez d&apos;autres joueurs en temps réel
        </p>
      </div>

      {/* Navigateur de salles */}
      <RoomBrowser onCreateRoom={() => setShowCreateRoom(true)} />

      {/* Dialog de création de salle */}
      <CreateRoomDialog
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
      />
    </PageContainer>
  );
}
