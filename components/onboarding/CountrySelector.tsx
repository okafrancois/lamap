import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { COUNTRY_TO_CURRENCY } from "@/convex/currencies";

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

const COUNTRIES: Country[] = [
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XAF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XAF" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XAF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XAF" },
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XAF" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XAF" },
  { code: "NE", name: "Niger", flag: "🇳🇪", currency: "XAF" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", currency: "XAF" },
  { code: "CG", name: "Congo", flag: "🇨🇬", currency: "XAF" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", currency: "XAF" },
  { code: "CF", name: "République Centrafricaine", flag: "🇨🇫", currency: "XAF" },
  { code: "GQ", name: "Guinée Équatoriale", flag: "🇬🇶", currency: "XAF" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", currency: "XAF" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", currency: "EUR" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", currency: "EUR" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", currency: "EUR" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", currency: "EUR" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", currency: "EUR" },
  { code: "IT", name: "Italie", flag: "🇮🇹", currency: "EUR" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", currency: "EUR" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", currency: "USD" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "USD" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", currency: "USD" },
];

interface CountrySelectorProps {
  selectedCountry?: string;
  onSelect: (countryCode: string) => void;
}

export function CountrySelector({
  selectedCountry,
  onSelect,
}: CountrySelectorProps) {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderCountry = ({ item }: { item: Country }) => {
    const isSelected = item.code === selectedCountry;
    
    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          {
            backgroundColor: isSelected ? colors.accent : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => onSelect(item.code)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.countryInfo}>
          <Text style={[styles.countryName, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.currency, { color: colors.mutedForeground }]}>
            {item.currency}
          </Text>
        </View>
        {isSelected && (
          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchWrapper,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un pays..."
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
      
      <FlatList
        data={filteredCountries}
        renderItem={renderCountry}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  flag: {
    fontSize: 32,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  currency: {
    fontSize: 14,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

