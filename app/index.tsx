import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function Index() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [standard, setStandard] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!name || !mobile || !standard) {
      Alert.alert("Please fill all mandatory fields (Name, Mobile, Standard)");
      return;
    }

    try {
      setLoading(true);
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("mobile", "==", Number(mobile)));
      const snapshot = await getDocs(q);

      let studentId = null;

      if (!snapshot.empty) {
        // Student already exists
        studentId = snapshot.docs[0].id;
        console.log("Existing student found:", studentId);
      } else {
        // Create new student record
        const docRef = await addDoc(studentsRef, {
          name,
          email: email || "",
          mobile: Number(mobile),
          standard,
        });
        studentId = docRef.id;
        console.log("New student added:", studentId);
      }

      setLoading(false);

      // Navigate to subject/chapters screen
      router.push(
        `/chapters?studentId=${studentId}&name=${encodeURIComponent(name)}&mobile=${encodeURIComponent(
          mobile
        )}&standard=${encodeURIComponent(standard)}`
      );
    } catch (error) {
      console.error("Error checking/adding student:", error);
      Alert.alert("Error", "Could not connect to Firestore.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Quiz App</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number"
        keyboardType="numeric"
        value={mobile}
        onChangeText={setMobile}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Email (Optional)"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Select Standard</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={standard} onValueChange={setStandard}>
          <Picker.Item label="Select Standard" value="" />
          <Picker.Item label="11" value="11" />
          <Picker.Item label="12" value="12" />
        </Picker>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#aaa" }]}
        onPress={handleStart}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Please Wait..." : "Next"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center" },
});
