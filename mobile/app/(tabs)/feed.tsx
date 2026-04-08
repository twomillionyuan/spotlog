import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskCard } from "@/src/components/TaskCard";
import { useAuth } from "@/src/context/AuthContext";
import { getDashboard, getLists } from "@/src/lib/api";
import { formatCompletion } from "@/src/lib/format";
import { statCardPalette, theme } from "@/src/theme/tokens";
import type { Dashboard, TaskList } from "@/src/types/api";

export default function FeedScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextRefreshing = false) {
    if (!token) {
      return;
    }

    if (nextRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [nextDashboard, nextLists] = await Promise.all([
        getDashboard(token),
        getLists(token)
      ]);

      setDashboard(nextDashboard);
      setLists(nextLists);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not load your overview"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void load();
  }, [token, isFocused]);

  const listNameById = new Map(lists.map((list) => [list.id, list.name]));
  const metricCards = dashboard
    ? [
        { label: "Open", value: dashboard.summary.openTasks, hint: "tasks" },
        { label: "Overdue", value: dashboard.summary.overdueTasks, hint: "late" },
        { label: "Due today", value: dashboard.summary.dueTodayTasks, hint: "today" },
        { label: "Lists", value: dashboard.summary.listCount, hint: "active" }
      ]
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading your task overview...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load overview</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryButtonLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && dashboard ? (
          <>
            <View style={styles.metricGrid}>
              {metricCards.map((card, index) => {
                const cardTheme = statCardPalette[index];

                return (
                  <Link href={"/(tabs)/lists" as never} key={card.label} asChild>
                    <Pressable
                      style={({ pressed }) => [
                        styles.metricCard,
                        cardTheme,
                        pressed && styles.cardPressed
                      ]}
                    >
                      <View style={styles.metricCardHeader}>
                        <View
                          style={[
                            styles.metricDot,
                            {
                              backgroundColor: cardTheme.accentColor
                            }
                          ]}
                        />
                        <Text style={styles.metricLabel}>{card.label}</Text>
                      </View>
                      <Text style={styles.metricValue}>{card.value}</Text>
                      <Text style={styles.metricHint}>{card.hint}</Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Urgent queue</Text>
                <Link href={"/(tabs)/lists" as never} asChild>
                  <Pressable>
                    <Text style={styles.sectionLink}>See all in lists</Text>
                  </Pressable>
                </Link>
              </View>
              {dashboard.urgentTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nothing urgent right now.</Text>
                </View>
              ) : (
                dashboard.urgentTasks.slice(0, 3).map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    listName={listNameById.get(task.listId)}
                    onTaskUpdated={() => {
                      void load();
                    }}
                    task={task}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>List health</Text>
              <View style={styles.healthRow}>
                {lists.map((list) => (
                  <Link
                    href={
                      {
                        pathname: "/list/[id]",
                        params: { id: list.id }
                      } as never
                    }
                    key={list.id}
                    asChild
                  >
                    <Pressable style={styles.healthCard}>
                      <View style={[styles.healthSwatch, { backgroundColor: list.color }]} />
                      <Text style={styles.healthName}>{list.name}</Text>
                      <Text style={styles.healthMeta}>
                        {list.summary.completed}/{list.summary.total} done
                      </Text>
                      <Text style={styles.healthMeta}>
                        {formatCompletion(list.summary.completed, list.summary.total)}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 20
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: "47%",
    gap: 10,
    minHeight: 126,
    padding: 16
  },
  metricCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  metricDot: {
    borderRadius: 999,
    height: 10,
    width: 10
  },
  metricLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 34,
    lineHeight: 40
  },
  metricHint: {
    color: theme.colors.mutedText,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textTransform: "uppercase"
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 28
  },
  sectionLink: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18
  },
  emptyText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  healthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  healthCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    gap: 8,
    padding: 16
  },
  healthSwatch: {
    borderRadius: 999,
    height: 10,
    width: 40
  },
  healthName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 16,
  },
  healthMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 13
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 22
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 22
  },
  stateText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  retryButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  retryButtonLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
  cardPressed: {
    opacity: 0.86
  }
});
