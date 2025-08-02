"use client";

import { useState, useEffect } from "react";
import { LibButton } from "@/components/library/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameBoard } from "./game-board";
import { type Card as CardType } from "./deck";
import type { PlayedCard } from "@/engine/kora-game-engine";

interface GameReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameReviewSheet({ open, onOpenChange }: GameReviewSheetProps) {
  // Désactivé temporairement - TODO: Adapter à la nouvelle API du game engine
  return null;
}
