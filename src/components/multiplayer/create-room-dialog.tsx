"use client";

import { useState } from "react";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { LibButton } from "@/components/library/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CreateRoomInput } from "@/types/multiplayer";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  const { createRoom, isCreatingRoom, createRoomError } = useMatchmaking();

  const [formData, setFormData] = useState<CreateRoomInput>({
    name: "",
    bet: 10,
    maxRounds: 5,
    isPrivate: false,
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateRoomInput, string>>
  >({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la salle est requis";
    } else if (formData.name.length > 50) {
      newErrors.name = "Le nom ne peut pas dépasser 50 caractères";
    }

    if (formData.bet < 1 || formData.bet > 1000) {
      newErrors.bet = "La mise doit être entre 1 et 1000 koras";
    }

    if (formData.maxRounds < 1 || formData.maxRounds > 10) {
      newErrors.maxRounds = "Le nombre de rounds doit être entre 1 et 10";
    }

    if (formData.isPrivate && !formData.password?.trim()) {
      newErrors.password = "Un mot de passe est requis pour les salles privées";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createRoom({
        ...formData,
        name: formData.name.trim(),
        password: formData.isPrivate ? formData.password?.trim() : undefined,
      });

      toast.success("Salle créée avec succès !");
      onOpenChange(false);

      // Reset du formulaire
      setFormData({
        name: "",
        bet: 10,
        maxRounds: 5,
        isPrivate: false,
        password: "",
      });
      setErrors({});
    } catch (error) {
      toast.error(createRoomError?.message ?? "Erreur lors de la création");
    }
  };

  const updateFormData = (key: keyof CreateRoomInput, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Nettoyer l'erreur de ce champ
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-h-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Créer une nouvelle salle</SheetTitle>
          <SheetDescription>
            Configurez votre salle de jeu multi-joueur
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Nom de la salle */}
          <div className="space-y-2">
            <Label htmlFor="roomName">Nom de la salle *</Label>
            <Input
              id="roomName"
              placeholder="Ex: Bataille épique"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Mise */}
          <div className="space-y-2">
            <Label htmlFor="bet">Mise (koras) *</Label>
            <Input
              id="bet"
              type="number"
              min={1}
              max={1000}
              value={formData.bet}
              onChange={(e) => updateFormData("bet", Number(e.target.value))}
            />
            {errors.bet && <p className="text-sm text-red-500">{errors.bet}</p>}
          </div>

          {/* Nombre de rounds */}
          <div className="space-y-2">
            <Label htmlFor="maxRounds">Nombre de rounds *</Label>
            <Select
              value={formData.maxRounds.toString()}
              onValueChange={(value) =>
                updateFormData("maxRounds", Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 7, 10].map((rounds) => (
                  <SelectItem key={rounds} value={rounds.toString()}>
                    {rounds} round{rounds > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.maxRounds && (
              <p className="text-sm text-red-500">{errors.maxRounds}</p>
            )}
          </div>

          {/* Salle privée */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) =>
                  updateFormData("isPrivate", !!checked)
                }
              />
              <Label htmlFor="isPrivate">
                Salle privée (avec mot de passe)
              </Label>
            </div>

            {formData.isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mot de passe de la salle"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <LibButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </LibButton>
            <LibButton
              type="submit"
              disabled={isCreatingRoom}
              className="flex-1"
            >
              {isCreatingRoom ? "Création..." : "Créer"}
            </LibButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
