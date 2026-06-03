import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { User, MapPin, FileText, Check } from "lucide-react-native";
import { getSurveys, saveSurvey } from "@/utils/storage";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const FIELD_BORDER = "#E5E7EB";
const FIELD_BG = "#F9FAFB";
const LABEL_COLOR = "#6B7280";
const INPUT_COLOR = "#111827";
const ACCENT = "#2563EB";

function SectionHeader({ icon: Icon, title }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#EFF6FF",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        <Icon size={16} color={ACCENT} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151" }}>
        {title}
      </Text>
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  onFocus,
  onBlur,
  optional = false,
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: LABEL_COLOR,
          marginBottom: 6,
        }}
      >
        {label}
        {optional ? (
          <Text style={{ fontWeight: "400", color: "#9CA3AF" }}> (ঐচ্ছিক)</Text>
        ) : (
          <Text style={{ color: "#EF4444" }}> *</Text>
        )}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          height: 48,
          backgroundColor: FIELD_BG,
          borderWidth: 1,
          borderColor: FIELD_BORDER,
          borderRadius: 10,
          paddingHorizontal: 14,
          fontSize: 15,
          color: INPUT_COLOR,
        }}
      />
    </View>
  );
}

export default function EditSurveyInfo() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [survey, setSurvey] = useState(null);

  const focusedPadding = 12;
  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + focusedPadding),
  ).current;
  const animateTo = (value) =>
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();
  const handleFocus = () => {
    if (Platform.OS !== "web") animateTo(focusedPadding);
  };
  const handleBlur = () => {
    if (Platform.OS !== "web") animateTo(insets.bottom + focusedPadding);
  };

  const [form, setForm] = useState({
    title: "",
    surveyorName: "",
    surveyorId: "",
    organization: "",
    district: "",
    upazila: "",
    union: "",
    village: "",
    surveyDate: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const surveys = await getSurveys();
      const found = surveys.find((s) => s.id === id);
      if (found) {
        setSurvey(found);
        setForm({
          title: found.title || "",
          surveyorName: found.surveyorName || "",
          surveyorId: found.surveyorId || "",
          organization: found.organization || "",
          district: found.district || "",
          upazila: found.upazila || "",
          union: found.union || "",
          village: found.village || "",
          surveyDate: found.surveyDate || "",
          notes: found.notes || "",
        });
      }
    };
    load();
  }, [id]);

  const set = useCallback(
    (key, val) => setForm((prev) => ({ ...prev, [key]: val })),
    [],
  );

  const validate = () => {
    if (!form.title.trim()) return "সমীক্ষার শিরোনাম দিন।";
    if (!form.surveyorName.trim()) return "সমীক্ষকের নাম দিন।";
    if (!form.district.trim()) return "জেলার নাম দিন।";
    if (!form.upazila.trim()) return "উপজেলার নাম দিন।";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert("তথ্য অসম্পূর্ণ", err);
      return;
    }
    if (!survey) return;
    setLoading(true);
    await saveSurvey({ ...survey, ...form });
    setLoading(false);
    setSaved(true);
    setTimeout(() => {
      router.back();
    }, 800);
  };

  if (!survey) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#6B7280" }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior="padding"
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Text style={{ fontSize: 28, color: ACCENT, lineHeight: 32 }}>
              ‹
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
              তথ্য সম্পাদনা
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              সমীক্ষার বিবরণ আপডেট করুন
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || saved}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: saved ? "#10B981" : ACCENT,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {saved && <Check size={14} color="#FFFFFF" />}
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
              {loading ? "সংরক্ষণ..." : saved ? "সংরক্ষিত!" : "সংরক্ষণ"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: paddingAnimation,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Survey Info */}
        <SectionHeader icon={FileText} title="সমীক্ষার তথ্য" />
        <FieldInput
          label="সমীক্ষার শিরোনাম"
          value={form.title}
          onChangeText={(v) => set("title", v)}
          placeholder="সমীক্ষার শিরোনাম"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <FieldInput
          label="সমীক্ষার তারিখ"
          value={form.surveyDate}
          onChangeText={(v) => set("surveyDate", v)}
          placeholder="তারিখ"
          onFocus={handleFocus}
          onBlur={handleBlur}
          optional
        />

        {/* Surveyor Info */}
        <SectionHeader icon={User} title="সমীক্ষকের তথ্য" />
        <FieldInput
          label="সমীক্ষকের নাম"
          value={form.surveyorName}
          onChangeText={(v) => set("surveyorName", v)}
          placeholder="পূর্ণ নাম"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <FieldInput
          label="সমীক্ষক আইডি / কোড"
          value={form.surveyorId}
          onChangeText={(v) => set("surveyorId", v)}
          placeholder="যেমন: SW-001"
          onFocus={handleFocus}
          onBlur={handleBlur}
          optional
        />
        <FieldInput
          label="প্রতিষ্ঠানের নাম"
          value={form.organization}
          onChangeText={(v) => set("organization", v)}
          placeholder="বিভাগ বা প্রতিষ্ঠানের নাম"
          onFocus={handleFocus}
          onBlur={handleBlur}
          optional
        />

        {/* Location Info */}
        <SectionHeader icon={MapPin} title="এলাকার তথ্য" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              label="জেলা"
              value={form.district}
              onChangeText={(v) => set("district", v)}
              placeholder="জেলার নাম"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FieldInput
              label="উপজেলা"
              value={form.upazila}
              onChangeText={(v) => set("upazila", v)}
              placeholder="উপজেলার নাম"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldInput
              label="ইউনিয়ন / ওয়ার্ড"
              value={form.union}
              onChangeText={(v) => set("union", v)}
              placeholder="ইউনিয়ন"
              onFocus={handleFocus}
              onBlur={handleBlur}
              optional
            />
          </View>
          <View style={{ flex: 1 }}>
            <FieldInput
              label="গ্রাম / মহল্লা"
              value={form.village}
              onChangeText={(v) => set("village", v)}
              placeholder="গ্রামের নাম"
              onFocus={handleFocus}
              onBlur={handleBlur}
              optional
            />
          </View>
        </View>

        {/* Notes */}
        <SectionHeader icon={FileText} title="মন্তব্য" />
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: LABEL_COLOR,
              marginBottom: 6,
            }}
          >
            বিশেষ মন্তব্য{" "}
            <Text style={{ fontWeight: "400", color: "#9CA3AF" }}>(ঐচ্ছিক)</Text>
          </Text>
          <TextInput
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
            placeholder="যেকোনো গুরুত্বপূর্ণ তথ্য..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              minHeight: 90,
              backgroundColor: FIELD_BG,
              borderWidth: 1,
              borderColor: FIELD_BORDER,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingTop: 12,
              fontSize: 15,
              color: INPUT_COLOR,
              textAlignVertical: "top",
            }}
          />
        </View>

        <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
          <Text style={{ color: "#EF4444" }}>*</Text> চিহ্নিত ঘরগুলো পূরণ করা আবশ্যক।
        </Text>

        {/* Save Button (bottom) */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || saved}
          style={{
            height: 54,
            backgroundColor: saved ? "#10B981" : loading ? "#93C5FD" : ACCENT,
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 32,
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {saved && <Check size={20} color="#FFFFFF" />}
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF" }}>
            {loading
              ? "সংরক্ষণ হচ্ছে..."
              : saved
                ? "সফলভাবে সংরক্ষিত হয়েছে!"
                : "পরিবর্তন সংরক্ষণ করুন"}
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}
