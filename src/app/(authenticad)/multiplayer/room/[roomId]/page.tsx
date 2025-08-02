"use client";

import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { GameRoom } from "@/components/multiplayer/game-room";
import { LibButton } from "@/components/library/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = React.use(params);

  return (
    <PageContainer>
      {/* Navigation de retour */}
      <div className="mb-6">
        <Link href="/multiplayer">
          <LibButton variant="ghost" size="sm">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Retour au lobby
          </LibButton>
        </Link>
      </div>

      {/* Interface de la salle */}
      <GameRoom roomId={roomId} />
    </PageContainer>
  );
}
