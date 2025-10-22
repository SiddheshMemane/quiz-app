import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

(async () => {
  try {
    const snapshot = await getDocs(collection(db, "students"));
    console.log("Fetched students:", snapshot.size);
  } catch (err) {
    console.error("Firestore connection error:", err);
  }
})();

export default function Index() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");

  const handleStart = () => {
    if (!name || !mobile || !standard || !subject) {
      Alert.alert("Please fill all fields");
      return;
    }

    router.push(
      `/chapters?subject=${encodeURIComponent(subject)}&name=${encodeURIComponent(
        name
      )}&mobile=${encodeURIComponent(mobile)}&standard=${encodeURIComponent(standard)}`
    );
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

      {/* Dropdown for Standard */}
      <Text style={styles.label}>Select Standard</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={standard}
          onValueChange={(value) => setStandard(value)}
          mode="dropdown"
        >
          <Picker.Item label="Select Standard" value="" />
          <Picker.Item label="11" value="11" />
          <Picker.Item label="12" value="12" />
        </Picker>
      </View>

      {/* Dropdown for Subject */}
      <Text style={styles.label}>Select Subject</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={subject}
          onValueChange={(value) => setSubject(value)}
          mode="dropdown"
        >
          <Picker.Item label="Select Subject" value="" />
          <Picker.Item label="Math" value="Math" />
          <Picker.Item label="Physics" value="Physics" />
          <Picker.Item label="Chemistry" value="Chemistry" />
          <Picker.Item label="Biology" value="Biology" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Next</Text>
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
