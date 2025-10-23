import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Picker } from "@react-native-picker/picker";

export default function ChaptersScreen() {
  const router = useRouter();
  const { name, mobile, studentId } = useLocalSearchParams();

  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch chapters only when standard AND subject are selected
  useEffect(() => {
    const fetchChapters = async () => {
      if (!standard || !subject) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, "questions"),
          where("standard", "==", standard),
          where("subject", "==", subject)
        );

        const snapshot = await getDocs(q);
        const uniqueChapters = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.chapter) uniqueChapters.add(data.chapter);
        });

        setChapters(Array.from(uniqueChapters));
      } catch (err) {
        console.error("Error fetching chapters:", err);
        Alert.alert("Error", "Could not load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [standard, subject]);

  const handleChapterSelect = (chapter: string) => {
    router.push({
      pathname: "/quiz",
      params: { chapter, subject, standard, name, mobile, studentId },
    });

  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Standard & Subject</Text>

      {/* Standard Picker */}
      <Text style={styles.label}>Select Standard</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={standard} onValueChange={setStandard}>
          <Picker.Item label="Select Standard" value="" />
          <Picker.Item label="11" value="11" />
          <Picker.Item label="12" value="12" />
        </Picker>
      </View>

      {/* Subject Picker */}
      <Text style={styles.label}>Select Subject</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={subject} onValueChange={setSubject}>
          <Picker.Item label="Select Subject" value="" />
          <Picker.Item label="Math" value="Math" />
          <Picker.Item label="Physics" value="Physics" />
          <Picker.Item label="Chemistry" value="Chemistry" />
          <Picker.Item label="Biology" value="Biology" />
        </Picker>
      </View>

      {/* Chapters */}
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : chapters.length === 0 ? (
        standard && subject && <Text style={styles.noData}>No chapters found</Text>
      ) : (
        <>
          <Text style={styles.label}>Select Chapter</Text>
          <FlatList
            data={chapters}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chapterButton}
                onPress={() => handleChapterSelect(item)}
              >
                <Text style={styles.chapterText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, marginVertical: 5 },
  pickerContainer: { borderWidth: 1, borderColor: "#aaa", borderRadius: 8, marginBottom: 15 },
  chapterButton: { padding: 15, borderWidth: 1, borderColor: "#2196F3", borderRadius: 10, marginBottom: 10 },
  chapterText: { fontSize: 18, color: "#2196F3", textAlign: "center" },
  noData: { textAlign: "center", fontSize: 16, color: "gray", marginTop: 10 },
});
