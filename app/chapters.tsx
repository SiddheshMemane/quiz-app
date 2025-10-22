import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Chapters() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subject = (params.subject as string) || "";

  console.log("params", params, "subject:", subject);

  const chapters = {
    Math: ["Algebra", "Calculus", "Geometry"],
    Physics: ["Mechanics", "Optics", "Electromagnetism"],
    Chemistry: ["Organic", "Inorganic", "Physical"],
  };

  const subjectChapters = chapters[subject as keyof typeof chapters] || [];

  const handleSelectChapter = (chapter: string) => {
    router.push(`/quiz?subject=${subject}&chapter=${chapter}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Chapter ({subject || "?"})</Text>
      <FlatList
        data={subjectChapters}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chapterButton} onPress={() => handleSelectChapter(item)}>
            <Text style={styles.chapterText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No chapters found!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  chapterButton: { backgroundColor: "#4CAF50", padding: 15, marginVertical: 8, borderRadius: 8 },
  chapterText: { color: "#fff", fontSize: 18, textAlign: "center" },
});
