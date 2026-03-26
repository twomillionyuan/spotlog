import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator
} from "react-native-draggable-flatlist";

import { TaskCard } from "@/src/components/TaskCard";
import { createList, createTask, getLists, reorderLists } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import {
  dueDateFromPreset,
  formatCompletion,
  formatDueDate,
  specificDateToIso,
  type DuePreset
} from "@/src/lib/format";
import { listColorPalette, theme } from "@/src/theme/tokens";
import type { TaskList, TaskUrgency } from "@/src/types/api";

const palette = listColorPalette;
const urgencyOptions: TaskUrgency[] = ["low", "medium", "high", "critical"];
const dueOptions: Array<{ key: DuePreset; label: string }> = [
  { key: "none", label: "No date" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this-week", label: "3 days" },
  { key: "next-week", label: "Next week" },
  { key: "custom", label: "Specific date" }
];

export default function ListsScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(palette[0]);
  const [addingTaskListId, setAddingTaskListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskUrgency, setNewTaskUrgency] = useState<TaskUrgency>("medium");
  const [newTaskDuePreset, setNewTaskDuePreset] = useState<DuePreset>("today");
  const [newTaskSpecificDate, setNewTaskSpecificDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [reordering, setReordering] = useState(false);
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
      const response = await getLists(token);
      setLists(response);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load lists");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateList() {
    if (!token || newListName.trim().length === 0) {
      return;
    }

    setSavingList(true);
    setError(null);

    try {
      await createList(token, {
        name: newListName,
        color: selectedColor
      });

      setNewListName("");
      setShowCreateForm(false);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create list");
    } finally {
      setSavingList(false);
    }
  }

  function openTaskComposer(listId: string) {
    setAddingTaskListId((current) => (current === listId ? null : listId));
    setNewTaskTitle("");
    setNewTaskNotes("");
    setNewTaskUrgency("medium");
    setNewTaskDuePreset("today");
    setNewTaskSpecificDate("");
    setError(null);
  }

  async function handleCreateTask(listId: string) {
    if (!token || newTaskTitle.trim().length === 0) {
      return;
    }

    if (newTaskDuePreset === "custom" && !specificDateToIso(newTaskSpecificDate)) {
      setError("Enter a valid specific date in YYYY-MM-DD format.");
      return;
    }

    setSavingTask(true);
    setError(null);

    try {
      await createTask(token, {
        listId,
        title: newTaskTitle,
        notes: newTaskNotes,
        urgency: newTaskUrgency,
        dueDate: dueDateFromPreset(newTaskDuePreset, newTaskSpecificDate)
      });

      setAddingTaskListId(null);
      setNewTaskTitle("");
      setNewTaskNotes("");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create task");
    } finally {
      setSavingTask(false);
    }
  }

  async function handleReorder(nextLists: TaskList[]) {
    if (!token) {
      return;
    }

    const previousLists = lists;
    setLists(nextLists);
    setReordering(true);
    setError(null);

    try {
      const ordered = await reorderLists(
        token,
        nextLists.map((list) => list.id)
      );
      setLists(ordered);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "Not found") {
        setError(null);
        return;
      }

      setLists(previousLists);
      setError(requestError instanceof Error ? requestError.message : "Could not reorder lists");
    } finally {
      setReordering(false);
    }
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void load();
  }, [token, isFocused]);

  const recentCompletions = lists
    .flatMap((list) =>
      list.tasks
        .filter((task) => task.completed)
        .map((task) => ({ ...task, listName: list.name }))
    )
    .sort(
      (left, right) =>
        new Date(right.completedAt ?? right.updatedAt).getTime() -
        new Date(left.completedAt ?? left.updatedAt).getTime()
    )
    .slice(0, 6);

  function renderListItem({ item, drag, isActive }: RenderItemParams<TaskList>) {
    const isAddingTask = addingTaskListId === item.id;

    return (
      <ScaleDecorator>
        <View style={[styles.listCard, isActive && styles.activeListCard]}>
          <View style={styles.listHeader}>
            <View style={styles.headerLeft}>
              <Pressable
                accessibilityHint="Press and hold, then drag to reorder this list"
                accessibilityLabel={`Reorder ${item.name}`}
                delayLongPress={150}
                disabled={savingTask || reordering}
                hitSlop={8}
                onLongPress={drag}
                style={({ pressed }) => [
                  styles.dragHandle,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.dragHandleIcon}>≡</Text>
              </Pressable>
              <Link
                href={
                  {
                    pathname: "/list/[id]",
                    params: { id: item.id }
                  } as never
                }
                asChild
              >
                <Pressable
                  style={({ pressed }) => [styles.listHeading, pressed && styles.buttonPressed]}
                >
                  <View style={[styles.listSwatch, { backgroundColor: item.color }]} />
                  <Text style={styles.listName}>{item.name}</Text>
                </Pressable>
              </Link>
            </View>
            <View style={styles.headerActions}>
              <Text style={styles.listMeta}>
                {formatCompletion(item.summary.completed, item.summary.total)}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => openTaskComposer(item.id)}
                  style={({ pressed }) => [
                    styles.inlineActionButton,
                    pressed && styles.buttonPressed
                  ]}
                >
                  <Text style={styles.inlineActionLabel}>
                    {isAddingTask ? "Close" : "Add task"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Link
            href={
              {
                pathname: "/list/[id]",
                params: { id: item.id }
              } as never
            }
            asChild
          >
            <Pressable style={({ pressed }) => [styles.listBody, pressed && styles.buttonPressed]}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        8,
                        item.summary.total === 0
                          ? 8
                          : (item.summary.completed / item.summary.total) * 100
                      )}%`,
                      backgroundColor: item.color
                    }
                  ]}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.summary.open} open</Text>
                <Text style={styles.metaText}>{item.summary.completed} completed</Text>
                <Text style={styles.metaText}>{item.summary.overdue} overdue</Text>
              </View>

              <View style={styles.previewColumn}>
                {item.tasks.slice(0, 3).map((task) => (
                  <View key={task.id} style={styles.previewRow}>
                    <Text numberOfLines={1} style={styles.previewTitle}>
                      {task.title}
                    </Text>
                    <Text style={styles.previewMeta}>{formatDueDate(task.dueDate)}</Text>
                  </View>
                ))}
                {item.tasks.length === 0 ? (
                  <Text style={styles.previewEmpty}>This list is empty.</Text>
                ) : null}
              </View>
            </Pressable>
          </Link>

          {isAddingTask ? (
            <View style={styles.taskComposer}>
              <TextInput
                onChangeText={setNewTaskTitle}
                placeholder="Task title"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={newTaskTitle}
              />
              <TextInput
                multiline
                onChangeText={setNewTaskNotes}
                placeholder="Notes"
                placeholderTextColor={theme.colors.mutedText}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={newTaskNotes}
              />
              <View style={styles.compactSection}>
                <Text style={styles.compactLabel}>Urgency</Text>
                <View style={styles.chipRow}>
                  {urgencyOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setNewTaskUrgency(option)}
                      style={[
                        styles.filterChip,
                        newTaskUrgency === option && styles.filterChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          newTaskUrgency === option && styles.filterChipLabelActive
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.compactSection}>
                <Text style={styles.compactLabel}>Due date</Text>
                <View style={styles.chipRow}>
                  {dueOptions.map((option) => (
                    <Pressable
                      key={option.key}
                      onPress={() => setNewTaskDuePreset(option.key)}
                      style={[
                        styles.filterChip,
                        newTaskDuePreset === option.key && styles.filterChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          newTaskDuePreset === option.key && styles.filterChipLabelActive
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {newTaskDuePreset === "custom" ? (
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    onChangeText={setNewTaskSpecificDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.mutedText}
                    style={styles.input}
                    value={newTaskSpecificDate}
                  />
                ) : null}
              </View>
              <Pressable
                disabled={savingTask || newTaskTitle.trim().length === 0}
                onPress={() => handleCreateTask(item.id)}
                style={[
                  styles.primaryButton,
                  (savingTask || newTaskTitle.trim().length === 0) && styles.buttonDisabled
                ]}
              >
                <Text style={styles.primaryButtonLabel}>
                  {savingTask ? "Saving..." : "Save task"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DraggableFlatList
        activationDistance={12}
        contentContainerStyle={styles.content}
        data={lists}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => setShowCreateForm((current) => !current)}
                style={({ pressed }) => [
                  styles.createToggleButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.createToggleLabel}>
                  {showCreateForm ? "Close" : "Create list"}
                </Text>
              </Pressable>
            </View>

            {showCreateForm ? (
              <View style={styles.createCard}>
                <TextInput
                  onChangeText={setNewListName}
                  placeholder="List name"
                  placeholderTextColor={theme.colors.mutedText}
                  style={styles.input}
                  value={newListName}
                />
                <View style={styles.colorRow}>
                  {palette.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorChip,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorChipSelected
                      ]}
                    />
                  ))}
                </View>
                <Pressable
                  disabled={savingList || newListName.trim().length === 0}
                  onPress={handleCreateList}
                  style={[
                    styles.primaryButton,
                    (savingList || newListName.trim().length === 0) && styles.buttonDisabled
                  ]}
                >
                  <Text style={styles.primaryButtonLabel}>
                    {savingList ? "Creating..." : "Save list"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={styles.stateText}>Loading your lists...</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Could not update lists</Text>
                <Text style={styles.stateText}>{error}</Text>
              </View>
            ) : null}

            {!loading && !error && lists.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No lists yet</Text>
                <Text style={styles.stateText}>Tap create list to add your first one.</Text>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          !loading && !error ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent completions</Text>
              {recentCompletions.length === 0 ? (
                <View style={styles.stateCard}>
                  <Text style={styles.stateText}>Complete a task and it will show up here.</Text>
                </View>
              ) : (
                recentCompletions.map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    listName={task.listName}
                    task={task}
                  />
                ))
              )}
            </View>
          ) : null
        }
        onDragEnd={({ data }) => {
          void handleReorder(data);
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        renderItem={renderListItem}
      />
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
  topBar: {
    alignItems: "flex-end",
    marginTop: 8
  },
  createToggleButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  createToggleLabel: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: "700"
  },
  createCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    marginBottom: 18,
    padding: 20
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  notesInput: {
    minHeight: 78
  },
  colorRow: {
    flexDirection: "row",
    gap: 10
  },
  colorChip: {
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    width: 28
  },
  colorChipSelected: {
    borderColor: theme.colors.text,
    transform: [{ scale: 1.08 }]
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 15
  },
  primaryButtonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonPressed: {
    opacity: 0.86
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 22
  },
  stateText: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  section: {
    gap: 12,
    marginTop: 18
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    marginBottom: 18,
    padding: 20
  },
  activeListCard: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10
  },
  listHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  listSwatch: {
    borderRadius: 999,
    height: 16,
    width: 16
  },
  listName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8
  },
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  listMeta: {
    color: theme.colors.subtleText,
    fontSize: 14,
    fontWeight: "700"
  },
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
    height: 26,
    width: 26
  },
  dragHandleIcon: {
    color: theme.colors.mutedText,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20
  },
  inlineActionButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  inlineActionLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700"
  },
  listBody: {
    gap: 14
  },
  progressTrack: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    borderRadius: 999,
    height: 10
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaText: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "600"
  },
  previewColumn: {
    gap: 10
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  previewTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginRight: 12
  },
  previewMeta: {
    color: theme.colors.mutedText,
    fontSize: 12
  },
  previewEmpty: {
    color: theme.colors.subtleText,
    fontSize: 14
  },
  taskComposer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 14
  },
  compactSection: {
    gap: 8
  },
  compactLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterChipActive: {
    backgroundColor: theme.colors.cardAccent
  },
  filterChipLabel: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  filterChipLabelActive: {
    color: theme.colors.background
  }
});
