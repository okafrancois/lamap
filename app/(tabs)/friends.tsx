import { RankBadge } from "@/components/ranking/RankBadge";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getRankFromPR, INITIAL_PR } from "@/convex/ranking";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

export default function FriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkUserId: userId } : "skip"
  );
  const myUserId = user?._id;

  const [index, setIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const layout = Dimensions.get("window");

  // Queries
  const friends = useQuery(
    api.friends.getFriends,
    myUserId ? { userId: myUserId } : "skip"
  );
  const receivedRequests = useQuery(
    api.friends.getReceivedFriendRequests,
    myUserId ? { userId: myUserId } : "skip"
  );
  const sentRequests = useQuery(
    api.friends.getSentFriendRequests,
    myUserId ? { userId: myUserId } : "skip"
  );
  const searchResults = useQuery(
    api.friends.searchUsers,
    myUserId && searchTerm.length >= 2 ?
      { searchTerm, currentUserId: myUserId, limit: 20 }
    : "skip"
  );

  // Mutations
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);
  const cancelRequest = useMutation(api.friends.cancelFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const handleSendRequest = useCallback(
    async (receiverUsername: string) => {
      if (!myUserId) return;

      try {
        await sendRequest({ senderId: myUserId, receiverUsername });
        Alert.alert("Succès", "Demande d'amitié envoyée !");
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible d'envoyer la demande"
        );
      }
    },
    [myUserId, sendRequest]
  );

  const handleAcceptRequest = useCallback(
    async (requestId: Id<"friendRequests">) => {
      if (!myUserId) return;

      try {
        await acceptRequest({ requestId, userId: myUserId });
        Alert.alert("Succès", "Demande acceptée !");
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible d'accepter la demande"
        );
      }
    },
    [myUserId, acceptRequest]
  );

  const handleRejectRequest = useCallback(
    async (requestId: Id<"friendRequests">) => {
      if (!myUserId) return;

      try {
        await rejectRequest({ requestId, userId: myUserId });
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible de rejeter la demande"
        );
      }
    },
    [myUserId, rejectRequest]
  );

  const handleCancelRequest = useCallback(
    async (requestId: Id<"friendRequests">) => {
      if (!myUserId) return;

      try {
        await cancelRequest({ requestId, userId: myUserId });
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible d'annuler la demande"
        );
      }
    },
    [myUserId, cancelRequest]
  );

  const handleRemoveFriend = useCallback(
    async (friendId: Id<"users">) => {
      if (!myUserId) return;

      Alert.alert(
        "Supprimer cet ami ?",
        "Êtes-vous sûr de vouloir retirer cette personne de votre liste d'amis ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                await removeFriend({ userId: myUserId, friendId });
              } catch (error: any) {
                Alert.alert(
                  "Erreur",
                  error.message || "Impossible de supprimer cet ami"
                );
              }
            },
          },
        ]
      );
    },
    [myUserId, removeFriend]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    sceneContainer: {
      flex: 1,
    },
    searchContainer: {
      padding: 16,
    },
    searchInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 16,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.muted,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    badge: {
      marginTop: 4,
    },
  });

  const FriendsScene = React.useMemo(() => {
    const FriendsSceneComponent = () => (
      <ScrollView style={styles.sceneContainer}>
        {!friends || friends.length === 0 ?
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color={colors.mutedForeground}
            />
            <Text style={styles.emptyText}>
              Vous n&apos;avez pas encore d&apos;amis.{"\n"}Recherchez des
              joueurs pour les ajouter !
            </Text>
          </View>
        : friends.map((friend) => (
            <TouchableOpacity
              key={friend._id}
              style={styles.userCard}
              onPress={() => router.push(`/user/${friend._id}`)}
            >
              {friend.avatarUrl ?
                <Image
                  source={{ uri: friend.avatarUrl }}
                  style={styles.avatar}
                />
              : <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={24}
                    color={colors.mutedForeground}
                    style={{ alignSelf: "center", marginTop: 12 }}
                  />
                </View>
              }
              <View style={styles.userInfo}>
                <Text style={styles.username}>{friend.username}</Text>
                <View style={styles.badge}>
                  <RankBadge
                    rank={getRankFromPR(friend.pr || INITIAL_PR)}
                    size="small"
                  />
                </View>
              </View>
              <View style={styles.actions}>
                <Button
                  title="Supprimer"
                  onPress={() => handleRemoveFriend(friend._id)}
                  variant="destructive"
                  size="sm"
                />
              </View>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    );
    FriendsSceneComponent.displayName = "FriendsScene";
    return FriendsSceneComponent;
  }, [friends, router, handleRemoveFriend, colors, styles]);

  const RequestsScene = React.useMemo(() => {
    const RequestsSceneComponent = () => (
      <ScrollView style={styles.sceneContainer}>
        {!receivedRequests || receivedRequests.length === 0 ?
          <View style={styles.emptyContainer}>
            <Ionicons
              name="mail-outline"
              size={64}
              color={colors.mutedForeground}
            />
            <Text style={styles.emptyText}>
              Aucune demande d&apos;amitié en attente.
            </Text>
          </View>
        : <>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.mutedForeground,
                padding: 16,
                paddingBottom: 8,
              }}
            >
              Demandes reçues
            </Text>
            {receivedRequests.map((request) => (
              <View key={request._id} style={styles.userCard}>
                {request.sender.avatarUrl ?
                  <Image
                    source={{ uri: request.sender.avatarUrl }}
                    style={styles.avatar}
                  />
                : <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={24}
                      color={colors.mutedForeground}
                      style={{ alignSelf: "center", marginTop: 12 }}
                    />
                  </View>
                }
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{request.sender.username}</Text>
                  <View style={styles.badge}>
                    <RankBadge
                      rank={getRankFromPR(request.sender.pr || INITIAL_PR)}
                      size="small"
                    />
                  </View>
                </View>
                <View style={styles.actions}>
                  <Button
                    title="Accepter"
                    onPress={() => handleAcceptRequest(request._id)}
                    variant="primary"
                    size="sm"
                  />
                  <Button
                    title="Refuser"
                    onPress={() => handleRejectRequest(request._id)}
                    variant="secondary"
                    size="sm"
                  />
                </View>
              </View>
            ))}

            {sentRequests && sentRequests.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.mutedForeground,
                    padding: 16,
                    paddingBottom: 8,
                    paddingTop: 24,
                  }}
                >
                  Demandes envoyées
                </Text>
                {sentRequests.map((request) => (
                  <View key={request._id} style={styles.userCard}>
                    {request.receiver.avatarUrl ?
                      <Image
                        source={{ uri: request.receiver.avatarUrl }}
                        style={styles.avatar}
                      />
                    : <View style={styles.avatar}>
                        <Ionicons
                          name="person"
                          size={24}
                          color={colors.mutedForeground}
                          style={{ alignSelf: "center", marginTop: 12 }}
                        />
                      </View>
                    }
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>
                        {request.receiver.username}
                      </Text>
                      <View style={styles.badge}>
                        <RankBadge
                          rank={getRankFromPR(
                            request.receiver.pr || INITIAL_PR
                          )}
                          size="small"
                        />
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <Button
                        title="Annuler"
                        onPress={() => handleCancelRequest(request._id)}
                        variant="secondary"
                        size="sm"
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        }
      </ScrollView>
    );
    RequestsSceneComponent.displayName = "RequestsScene";
    return RequestsSceneComponent;
  }, [
    receivedRequests,
    sentRequests,
    handleAcceptRequest,
    handleRejectRequest,
    handleCancelRequest,
    colors,
    styles,
  ]);

  const SearchScene = React.useMemo(() => {
    const SearchSceneComponent = () => (
      <View style={styles.sceneContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur..."
            placeholderTextColor={colors.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <ScrollView style={styles.content}>
          {searchTerm.length < 2 ?
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={64}
                color={colors.mutedForeground}
              />
              <Text style={styles.emptyText}>
                Entrez au moins 2 caractères pour rechercher un joueur.
              </Text>
            </View>
          : !searchResults ?
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          : searchResults.length === 0 ?
            <View style={styles.emptyContainer}>
              <Ionicons
                name="sad-outline"
                size={64}
                color={colors.mutedForeground}
              />
              <Text style={styles.emptyText}>
                Aucun joueur trouvé pour &quot;{searchTerm}&quot;.
              </Text>
            </View>
          : searchResults.map((result) => (
              <View key={result._id} style={styles.userCard}>
                {result.avatarUrl ?
                  <Image
                    source={{ uri: result.avatarUrl }}
                    style={styles.avatar}
                  />
                : <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={24}
                      color={colors.mutedForeground}
                      style={{ alignSelf: "center", marginTop: 12 }}
                    />
                  </View>
                }
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{result.username}</Text>
                  <View style={styles.badge}>
                    <RankBadge
                      rank={getRankFromPR(result.pr || INITIAL_PR)}
                      size="small"
                    />
                  </View>
                </View>
                <View style={styles.actions}>
                  {result.status === "friends" && (
                    <Button
                      title="Ami"
                      onPress={() => {}}
                      variant="secondary"
                      size="sm"
                      disabled
                    />
                  )}
                  {result.status === "request_sent" && (
                    <Button
                      title="En attente"
                      onPress={() => {}}
                      variant="secondary"
                      size="sm"
                      disabled
                    />
                  )}
                  {result.status === "request_received" && (
                    <Button
                      title="Répondre"
                      onPress={() => setIndex(1)}
                      variant="primary"
                      size="sm"
                    />
                  )}
                  {result.status === "none" && (
                    <Button
                      title="Ajouter"
                      onPress={() => handleSendRequest(result.username)}
                      variant="primary"
                      size="sm"
                    />
                  )}
                </View>
              </View>
            ))
          }
        </ScrollView>
      </View>
    );
    SearchSceneComponent.displayName = "SearchScene";
    return SearchSceneComponent;
  }, [searchTerm, searchResults, handleSendRequest, colors, styles, setIndex]);

  const routes = React.useMemo(
    () => [
      {
        key: "friends",
        title: `Amis (${friends?.length || 0})`,
      },
      {
        key: "requests",
        title: `Demandes (${receivedRequests?.length || 0})`,
      },
      {
        key: "search",
        title: "Rechercher",
      },
    ],
    [friends?.length, receivedRequests?.length]
  );

  const renderScene = SceneMap({
    friends: FriendsScene,
    requests: RequestsScene,
    search: SearchScene,
  });

  if (!myUserId) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: colors.primary,
        height: 3,
        borderRadius: 2,
      }}
      style={{
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      activeColor={colors.primary}
      inactiveColor={colors.mutedForeground}
      labelStyle={{
        fontSize: 14,
        fontWeight: "600",
        textTransform: "none",
      }}
      tabStyle={{
        width: "auto",
        paddingHorizontal: 12,
      }}
      scrollEnabled={true}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}
