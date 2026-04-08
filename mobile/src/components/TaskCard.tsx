import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { updateTask, uploadTaskPhoto } from "@/src/lib/api";
import { formatDueDate } from "@/src/lib/format";
import { theme, urgencyCardPalette } from "@/src/theme/tokens";
import type { Task } from "@/src/types/api";

type TaskCardProps = {
  task: Task;
  href?: Href;
  listName?: string;
  onTaskUpdated?: (task: Task) => void;
};

function TaskCardContent({
  task,
  listName
}: {
  task: Task;
  listName?: string;
}) {
  const previewUrl = task.completed ? task.afterPhotoUrl ?? task.beforePhotoUrl : task.beforePhotoUrl;

  return (
    <View style={styles.body}>
      <Text numberOfLines={2} style={[styles.title, task.completed && styles.completedTitle]}>
        {task.title}
      </Text>
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.attachmentPreview} />
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

export function TaskCard({ task, href, listName, onTaskUpdated }: TaskCardProps) {
  const { token } = useAuth();
  const [currentTask, setCurrentTask] = useState(task);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardColors = urgencyCardPalette[currentTask.urgency];
  const isMissingBeforePhoto = !currentTask.beforePhotoUrl;
  const needsAfterPhotoForCompletion = !currentTask.completed && Boolean(currentTask.beforePhotoUrl) && !currentTask.afterPhotoUrl;

  async function handlePickPhoto(kind: "before" | "after", source: "camera" | "library") {
    if (!token || updating) {
      return;
    }

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(source === "camera" ? "Camera permission is required." : "Photo library permission is required.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            mediaTypes: ["images"],
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            mediaTypes: ["images"],
            quality: 0.8
          });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const asset = result.assets[0];
      const withPhoto = await uploadTaskPhoto(token, currentTask.id, kind, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `task-${currentTask.id}.jpg`
      });

      if (kind === "after") {
        const completedTask = await updateTask(token, currentTask.id, {
          completed: true
        });

        setCurrentTask(completedTask ?? withPhoto);
        onTaskUpdated?.(completedTask ?? withPhoto);
        Alert.alert("Task completed", "Your after photo was added and the task is now complete.");
      } else {
        setCurrentTask(withPhoto);
        onTaskUpdated?.(withPhoto);
        Alert.alert("Before photo added", "Now you can add an after photo when the task is finished.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not complete task");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCompletePress() {
    if (!token || updating) {
      return;
    }

    if (isMissingBeforePhoto) {
      Alert.alert(
        "Before photo required",
        "Add a before photo for this task first.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Camera",
            onPress: () => {
              void handlePickPhoto("before", "camera");
            }
          },
          {
            text: "Library",
            onPress: () => {
              void handlePickPhoto("before", "library");
            }
          }
        ]
      );
      return;
    }

    if (needsAfterPhotoForCompletion) {
      Alert.alert(
        "After photo required",
        "Add an after photo now to complete this task.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Camera",
            onPress: () => {
              void handlePickPhoto("after", "camera");
            }
          },
          {
            text: "Library",
            onPress: () => {
              void handlePickPhoto("after", "library");
            }
          }
        ]
      );
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updated = await updateTask(token, currentTask.id, {
        completed: !currentTask.completed
      });

      setCurrentTask(updated);
      onTaskUpdated?.(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update task");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColors.background,
          borderColor: cardColors.border
        },
        currentTask.completed && styles.completedCard
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          {href ? (
            <Link href={href} asChild>
              <Pressable style={styles.linkArea}>
                <TaskCardContent listName={listName} task={currentTask} />
              </Pressable>
            </Link>
          ) : (
            <View style={styles.linkArea}>
              <TaskCardContent listName={listName} task={currentTask} />
            </View>
          )}
        </View>
        <View style={styles.actionColumn}>
          {href ? (
            <Link href={href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.attachmentButton,
                  currentTask.beforePhotoUrl && styles.attachmentButtonFilled,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text
                  style={[
                    styles.attachmentButtonLabel,
                    currentTask.beforePhotoUrl && styles.attachmentButtonLabelFilled
                  ]}
                >
                  {currentTask.beforePhotoUrl ? "Edit before" : "Add before"}
                </Text>
              </Pressable>
            </Link>
          ) : null}
          <Pressable
            disabled={updating}
            onPress={handleCompletePress}
            style={({ pressed }) => [
              styles.completeButton,
              currentTask.completed && styles.completedButton,
              pressed && styles.buttonPressed,
              updating && styles.buttonDisabled
            ]}
          >
            <Text
              style={[
                styles.completeButtonLabel,
                currentTask.completed && styles.completedButtonLabel
              ]}
            >
              {updating ? "..." : currentTask.completed ? "Completed" : "Complete"}
            </Text>
          </Pressable>
        </View>
      </View>
      {isMissingBeforePhoto ? (
        <Text style={styles.helperText}>Add a before photo when you create this task.</Text>
      ) : null}
      {needsAfterPhotoForCompletion ? (
        <Text style={styles.helperText}>Add an after photo from the complete button when the task is finished.</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1
  },
  actionColumn: {
    alignItems: "flex-end",
    gap: 8
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 17,
    lineHeight: 22
  },
  completedTitle: {
    color: theme.colors.mutedText,
    textDecorationLine: "line-through"
  },
  notes: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  attachmentPreview: {
    borderRadius: 16,
    height: 148,
    width: "100%"
  },
  completeButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  completeButtonDisabled: {
    backgroundColor: theme.colors.surfaceMuted
  },
  attachmentButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  attachmentButtonFilled: {
    backgroundColor: theme.colors.cardAccent
  },
  completedButton: {
    backgroundColor: theme.colors.surfaceMuted
  },
  attachmentButtonLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.bold,
    fontSize: 12
  },
  attachmentButtonLabelFilled: {
    color: theme.colors.background
  },
  completeButtonLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 12
  },
  completedButtonLabel: {
    color: theme.colors.subtleText
  },
  buttonPressed: {
    opacity: 0.86
  },
  buttonDisabled: {
    opacity: 0.6
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaText: {
    color: theme.colors.mutedText,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
  helperText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 8
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 8
  }
});
