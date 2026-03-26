import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { formatDueDate } from "@/src/lib/format";
import { theme, urgencyCardPalette } from "@/src/theme/tokens";
import type { Task, TaskUrgency } from "@/src/types/api";

type TaskCardProps = {
  task: Task;
  href?: Href;
  listName?: string;
};

function TaskCardBody({ task, listName }: { task: Task; listName?: string }) {
  return (
    <View style={styles.body}>
      <Text numberOfLines={2} style={[styles.title, task.completed && styles.completedTitle]}>
        {task.title}
      </Text>
      {task.attachmentUrl ? (
        <Image source={{ uri: task.attachmentUrl }} style={styles.attachmentPreview} />
      ) : null}
      {task.notes ? (
        <Text numberOfLines={2} style={styles.notes}>
          {task.notes}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
        {listName ? <Text style={styles.metaText}>{listName}</Text> : null}
        <Text style={styles.metaText}>{task.completed ? "Completed" : "Open"}</Text>
      </View>
    </View>
  );
}

export function TaskCard({ task, href, listName }: TaskCardProps) {
  const cardColors = urgencyCardPalette[task.urgency];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColors.background,
          borderColor: cardColors.border
        },
        task.completed && styles.completedCard
      ]}
    >
      {href ? (
        <Link href={href} asChild>
          <Pressable style={styles.linkArea}>
            <TaskCardBody listName={listName} task={task} />
          </Pressable>
        </Link>
      ) : (
        <View style={styles.linkArea}>
          <TaskCardBody listName={listName} task={task} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14
  },
  completedCard: {
    opacity: 0.78
  },
  linkArea: {
    flex: 1
  },
  body: {
    gap: 10
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22
  },
  completedTitle: {
    color: theme.colors.mutedText,
    textDecorationLine: "line-through"
  },
  notes: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  attachmentPreview: {
    borderRadius: 16,
    height: 148,
    width: "100%"
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "600"
  }
});
