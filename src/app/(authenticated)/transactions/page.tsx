"use client";

import { useEffect, useState } from "react";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
  IconTrophy,
  IconDice,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/components/providers/auth-provider";

interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number | null;
  koras: number | null;
  korasBefore: number | null;
  korasAfter: number | null;
  description: string | null;
  reference: string | null;
  gameId: string | null;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalWins: number;
  totalStakes: number;
  netProfit: number;
}

const TRANSACTION_TYPES = {
  DEPOSIT: {
    label: "Dépôt",
    icon: IconArrowDownRight,
    color: "text-green-500",
  },
  WITHDRAWAL: {
    label: "Retrait",
    icon: IconArrowUpRight,
    color: "text-red-500",
  },
  GAME_WIN: { label: "Gain", icon: IconTrophy, color: "text-yellow-500" },
  GAME_STAKE: { label: "Mise", icon: IconDice, color: "text-blue-500" },
} as const;

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const type =
    TRANSACTION_TYPES[transaction.type as keyof typeof TRANSACTION_TYPES];
  const Icon = type?.icon || IconCoin;
  const isPositive = ["DEPOSIT", "GAME_WIN"].includes(transaction.type);
  const amount = transaction.koras || 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`bg-muted rounded-full p-2 ${type?.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{type?.label || transaction.type}</p>
              <p className="text-muted-foreground text-sm">
                {transaction.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {isPositive ? "+" : "-"}
              {amount} Koras
            </p>
            <p className="text-muted-foreground text-xs">
              {new Date(transaction.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionStats({ stats }: { stats: TransactionStats }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconArrowDownRight className="h-4 w-4 text-green-500" />
            Total des dépôts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.totalDeposits} Koras</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconTrophy className="h-4 w-4 text-yellow-500" />
            Total des gains
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.totalWins} Koras</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconDice className="h-4 w-4 text-blue-500" />
            Total des mises
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold">{stats.totalStakes} Koras</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconCoin className="h-4 w-4" />
            Profit net
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p
            className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {stats.netProfit} Koras
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<TransactionType | "ALL">(
    "ALL",
  );

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadStats();
    }
  }, [user, selectedType]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const type = selectedType === "ALL" ? undefined : selectedType;
      const userTransactions = [] as any[];
      setTransactions(userTransactions);
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors du chargement des transactions",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const transactionStats = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalWins: 0,
        totalStakes: 0,
        netProfit: 0,
      };
      setStats(transactionStats);
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors du chargement des statistiques",
      );
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Historique des transactions</h1>

      {stats && <TransactionStats stats={stats} />}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Transactions récentes</h2>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as TransactionType | "ALL")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de transaction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes les transactions</SelectItem>
            {Object.entries(TRANSACTION_TYPES).map(([type, { label }]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="mb-2 h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucune transaction trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
}
