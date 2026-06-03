import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  FileText,
  Trash2,
  ChevronRight,
  User,
  MapPin,
  CalendarDays,
  Hash,
  Building2,
  ClipboardList,
} from "lucide-react-native";
import { getSurveys, deleteSurvey } from "@/utils/storage";
import { router } from "expo-router";

const ACCENT = "#2563EB";

function MetaBadge({ icon: Icon, text }) {
  if (!text) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 99,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Icon size={11} color="#6B7280" />
      <Text
        style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function SurveyCard({ item, onPress, onDelete }) {
  const location = [item.district, item.upazila, item.union, item.village]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#EFF6FF",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ClipboardList size={22} color={ACCENT} />
        </View>

        {/* Title + Date */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#111827",
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {item.title || "অজ্ঞাত সমীক্ষা"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
              gap: 4,
            }}
          >
            <CalendarDays size={11} color="#9CA3AF" />
            <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
              {item.surveyDate ||
                new Date(item.createdAt).toLocaleDateString("bn-BD")}
            </Text>
            <Text style={{ fontSize: 11, color: "#D1D5DB", marginLeft: 4 }}>
              •
            </Text>
            <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
              #{item.id.slice(-6)}
            </Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity onPress={onDelete} style={{ padding: 8 }}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View
        style={{ height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 }}
      />

      {/* Meta badges */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {item.surveyorName ? (
          <MetaBadge icon={User} text={item.surveyorName} />
        ) : null}
        {item.surveyorId ? (
          <MetaBadge icon={Hash} text={item.surveyorId} />
        ) : null}
        {item.organization ? (
          <MetaBadge icon={Building2} text={item.organization} />
        ) : null}
        {location ? <MetaBadge icon={MapPin} text={location} /> : null}
        {!item.surveyorName && !location ? (
          <Text style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
            তথ্য সম্পাদনা করতে সমীক্ষায় প্রবেশ করুন
          </Text>
        ) : null}
      </View>

      {/* Bottom row: open button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: ACCENT,
            marginRight: 4,
          }}
        >
          সমীক্ষা খুলুন
        </Text>
        <ChevronRight size={16} color={ACCENT} />
      </View>
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [surveys, setSurveys] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSurveys = useCallback(async () => {
    const data = await getSurveys();
    setSurveys(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSurveys();
    setRefreshing(false);
  }, [loadSurveys]);

  const handleCreateNew = () => {
    router.push("/survey/create");
  };

  const handleDelete = (id) => {
    Alert.alert(
      "মুছে ফেলুন",
      "আপনি কি নিশ্চিত যে আপনি এই সমীক্ষাটি স্থায়ীভাবে মুছে ফেলতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: async () => {
            await deleteSurvey(id);
            loadSurveys();
          },
        },
      ],
    );
  };

  // Stats
  const totalSurveys = surveys.length;
  const surveyors = new Set(surveys.map((s) => s.surveyorName).filter(Boolean))
    .size;
  const districts = new Set(surveys.map((s) => s.district).filter(Boolean))
    .size;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827" }}>
          সমীক্ষা ড্যাশবোর্ড
        </Text>
        <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          স্বাস্থ্য ও জনমিতি তথ্য সংগ্রহ
        </Text>

        {/* Stats row */}
        {totalSurveys > 0 && (
          <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
            {[
              {
                label: "মোট সমীক্ষা",
                value: totalSurveys,
                color: "#EFF6FF",
                text: ACCENT,
              },
              {
                label: "সমীক্ষক",
                value: surveyors || "—",
                color: "#F0FDF4",
                text: "#16A34A",
              },
              {
                label: "জেলা",
                value: districts || "—",
                color: "#FFF7ED",
                text: "#EA580C",
              },
            ].map((stat, idx) => (
              <View
                key={idx}
                style={{
                  flex: 1,
                  backgroundColor: stat.color,
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: stat.text }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#6B7280",
                    marginTop: 2,
                    textAlign: "center",
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
          />
        }
      >
        {surveys.length === 0 ? (
          <View
            style={{
              marginTop: 60,
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#F9FAFB",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 16,
              }}
            >
              <FileText size={34} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#374151" }}>
              কোনো সমীক্ষা পাওয়া যায়নি
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 22,
              }}
            >
              নতুন একটি সমীক্ষা শুরু করতে নিচের{" "}
              <Text style={{ color: ACCENT, fontWeight: "600" }}>+</Text> বাটনে
              ক্লিক করুন
            </Text>

            <TouchableOpacity
              onPress={handleCreateNew}
              style={{
                marginTop: 28,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: ACCENT,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 14,
              }}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
              >
                নতুন সমীক্ষা তৈরি করুন
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#9CA3AF",
                marginBottom: 12,
                marginLeft: 2,
              }}
            >
              সাম্প্রতিক সমীক্ষাসমূহ ({totalSurveys}টি)
            </Text>
            {surveys.map((item) => (
              <SurveyCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/survey/${item.id}`)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleCreateNew}
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          right: 20,
          backgroundColor: ACCENT,
          width: 58,
          height: 58,
          borderRadius: 29,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: ACCENT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Plus color="#FFFFFF" size={26} />
      </TouchableOpacity>
    </View>
  );
}
