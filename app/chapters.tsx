import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Picker } from "@react-native-picker/picker";

export default function TestSelectionScreen() {
  const router = useRouter();
  const { name, mobile, studentId } = useLocalSearchParams();

  const [testType, setTestType] = useState<"practice" | "competitive" | "">("");
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examType, setExamType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [chapter, setChapter] = useState("");


  // 🔹 Fetch chapters based on standard + subject(s)
  useEffect(() => {
    const fetchChapters = async () => {
      // Guard against missing inputs
      console.log(standard)
      if (!standard || (testType === "competitive" && (!subjects || subjects.length === 0)) || (testType !== "competitive" && !subject)) {
        setChapters([]);
        console.log("empty return")
        return;
      }

      try {
        setLoading(true);

        // Decide which subjects to use
        const subjArray = testType === "competitive" ? subjects : [subject];

        // Fetch all questions for the selected standard
        const q = query(collection(db, "questions"), where("standard", "==", standard));
        const snapshot = await getDocs(q);

        const allChapters = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subject && subjArray.includes(data.subject) && data.chapter) {
            allChapters.add(data.chapter);
          }
        });

        setChapters(Array.from(allChapters));
        // console.log("Fetched chapters:", Array.from(allChapters));
      } catch (err) {
        console.error("Error fetching chapters:", err);
        Alert.alert("Error", "Could not load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [standard, subject, subjects, testType]);


  // 🔹 Fetch topics for selected chapter (for Practice mode)
 useEffect(() => {
  const fetchTopics = async () => {
    if (!standard || !subject || !chapter) {
      setTopics([]); // clear topics if inputs are incomplete
      return;
    }

    try {
      setLoading(true);
      const q = query(
        collection(db, "questions"),
        where("standard", "==", standard),
        where("subject", "==", subject),
        where("chapter", "==", chapter)
      );

      const snapshot = await getDocs(q);
      const allTopics = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.topic) allTopics.add(data.topic);
      });

      setTopics(Array.from(allTopics));
    } catch (err) {
      console.error("Error fetching topics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (testType === "practice" && chapter) fetchTopics();
}, [standard, subject, chapter, testType]); // ✅ add standard & subject too

useEffect(() => {
  if (!examType) return;

  // Clear all selections related to competitive setup
  setSubjects([]);
  setSelectedChapters([]);
  setDifficulty("");
  setChapters([]);
}, [examType]);

useEffect(() => {
  // Reset all dependent selections when test type changes
  setStandard("");
  setSubject("");
  setSubjects([]);
  setSelectedChapters([]);
  setDifficulty("");
  setChapters([]);
  setChapter("");
  setTopic("");
  setTopics([]);
}, [testType]);


  const toggleChapterSelection = (chapter: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter]
    );
  };

  const handleStart = () => {
    if (testType === "practice") {
      if (!standard || !subject || !chapter || !topic)
        return Alert.alert("Select all fields for Practice Test");

      router.push({
        pathname: "/quiz",
        params: { name, mobile, studentId, testType, standard, subject, chapter, topic },
      });
    } else {
      if (!examType || !difficulty || !selectedChapters.length || !subjects.length)
        return Alert.alert("Select all fields for Competitive Test");

      router.push({
        pathname: "/quiz",
        params: {
          name,
          mobile,
          studentId,
          testType,
          standard,
          examType,
          difficulty,
          subjects: JSON.stringify(subjects),
          chapters: JSON.stringify(selectedChapters),
        },
      });
    }
  };

  return (
    <View style={styles.container}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <Text style={styles.title}>Select Test Type</Text>

      {/* Test Type Selection */}
      <View style={styles.testTypeRow}>
        <TouchableOpacity
          style={[
            styles.testTypeButton,
            testType === "practice" && styles.selectedTestType,
          ]}
          onPress={() => setTestType("practice")}
        >
          <Text style={styles.testTypeText}>Practice Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.testTypeButton,
            testType === "competitive" && styles.selectedTestType,
          ]}
          onPress={() => setTestType("competitive")}
        >
          <Text style={styles.testTypeText}>Competitive Test</Text>
        </TouchableOpacity>
      </View>

      {/* PRACTICE TEST */}
      {testType === "practice" && (
        <>
          <Text style={styles.label}>Select Standard</Text>
          <Picker selectedValue={standard} onValueChange={setStandard}>
            <Picker.Item label="Select Standard" value="" />
            <Picker.Item label="11" value="11" />
            <Picker.Item label="12" value="12" />
          </Picker>

          <Text style={styles.label}>Select Subject</Text>
          <Picker selectedValue={subject} onValueChange={setSubject}>
            <Picker.Item label="Select Subject" value="" />
            <Picker.Item label="Mathematics" value="Mathematics" />
            <Picker.Item label="Physics" value="Physics" />
            <Picker.Item label="Chemistry" value="Chemistry" />
            <Picker.Item label="Biology" value="Biology" />
          </Picker>

          {testType === "practice" && standard && subject && chapters.length > 0 && (
              <>
                <Text style={styles.label}>Select Chapter</Text>
                <Picker selectedValue={chapter} onValueChange={setChapter}>
                  <Picker.Item label="Select Chapter" value="" />
                  {chapters.map((ch) => (
                    <Picker.Item key={ch} label={ch} value={ch} />
                  ))}
                </Picker>
              </>
            )}

          {topics.length > 0 && (
            <>
              <Text style={styles.label}>Select Topic</Text>
              <Picker selectedValue={topic} onValueChange={setTopic}>
                <Picker.Item label="Select Topic" value="" />
                {topics.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            </>
          )}

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startText}>Start Practice Test</Text>
          </TouchableOpacity>
        </>
      )}

      {/* COMPETITIVE TEST */}
      {testType === "competitive" && (
        <>
          <Text style={styles.label}>Select Standard</Text>
          <Picker selectedValue={standard} onValueChange={setStandard}>
            <Picker.Item label="Select Standard" value="" />
            <Picker.Item label="11" value="11" />
            <Picker.Item label="12" value="12" />
          </Picker>
          <Text style={styles.label}>Select Exam Type</Text>
          <Picker selectedValue={examType} onValueChange={setExamType}>
            <Picker.Item label="Select Exam" value="" />
            <Picker.Item label="jee" value="jee" />
            <Picker.Item label="mhtcet" value="mhtcet" />
            <Picker.Item label="neet" value="neet" />
          </Picker>

          <Text style={styles.label}>Select Subjects</Text>
          {["Mathematics", "Physics", "Chemistry", "Biology"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.multiSelectItem,
                subjects.includes(s) && styles.multiSelectSelected,
              ]}
              onPress={() =>
                setSubjects((prev) =>
                  prev.includes(s)
                    ? prev.filter((x) => x !== s)
                    : [...prev, s]
                )
              }
            >
              <Text style={styles.chapterText}>{s}</Text>
            </TouchableOpacity>
          ))}

          {
            examType &&
            subjects.length > 0 &&
            chapters.length > 0 && (
              <>
                <Text style={styles.label}>Select Chapters</Text>
                {chapters.map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.multiSelectItem,
                      selectedChapters.includes(ch) && styles.multiSelectSelected,
                    ]}
                    onPress={() => toggleChapterSelection(ch)}
                  >
                    <Text style={styles.chapterText}>{ch}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

          <Text style={styles.label}>Select Difficulty</Text>
          <View style={styles.testTypeRow}>
            {["easy", "medium", "hard"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.testTypeButton,
                  difficulty === lvl && styles.selectedTestType,
                ]}
                onPress={() => setDifficulty(lvl)}
              >
                <Text style={styles.testTypeText}>{lvl.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startText}>Start Competitive Test</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && <ActivityIndicator size="large" color="#2196F3" />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, marginVertical: 5 },
  testTypeRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  testTypeButton: {
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  selectedTestType: { backgroundColor: "#2196F3" },
  testTypeText: { textAlign: "center", color: "#000", fontWeight: "500" },
  multiSelectItem: {
    borderWidth: 1,
    borderColor: "#2196F3",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  multiSelectSelected: { backgroundColor: "#2196F3" },
  chapterText: { fontSize: 16, textAlign: "center" },
  startButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  startText: { color: "#fff", textAlign: "center", fontSize: 18 },
});
