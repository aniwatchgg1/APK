import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Minus,
  Plus,
  FileText,
  ChevronLeft,
  Download,
  Info,
  User,
  MapPin,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getSurveys, saveSurvey } from "@/utils/storage";

const AGE_GROUPS = [
  "০-১৪",
  "১৫-১৯",
  "২০-২৪",
  "২৫-২৯",
  "৩০-৩৪",
  "৩৫-৩৯",
  "৪০-৪৪",
  "৪৫-৪৯",
  "৫০+",
];

const COLUMN_GROUPS = [
  {
    title: "নারীর সংখ্যা",
    sub: ["বিবাহিত", "অবিবাহিত", "বিধবা/অন্যান্য"],
    hasTotal: true,
  },
  { title: "জীবিত সন্তান সংখ্যা", sub: ["ছেলে", "মেয়ে"], hasTotal: true },
  { title: "স্বাস্থ্য ও প্রজনন", sub: ["গর্ভবতী", "সক্ষম দম্পতি"], hasTotal: true },
  { title: "মৃত্যু", sub: ["নবজাতক", "শিশু", "মাতৃমৃত্যু", "অন্যান্য"], hasTotal: true },
  { title: "স্থানান্তর", sub: ["এসেছে", "চলে গেছে"], hasTotal: true },
  { title: "বাল্যবিবাহ", sub: ["ছেলে", "মেয়ে"], hasTotal: true },
  { title: "জনসংখ্যা", sub: ["পুরুষ", "মহিলা"], hasTotal: true },
];

const CELL_WIDTH = 120;
const AGE_COL_WIDTH = 80;
const HEADER_HEIGHT = 100;
const ROW_HEIGHT = 60;

export default function SurveyGrid() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [survey, setSurvey] = useState(null);
  const [gridData, setGridData] = useState(null);

  // Memoize column structure to calculate indices
  const colInfo = useMemo(() => {
    let currentIdx = 0;
    const structure = [];
    const inputIndices = [];

    COLUMN_GROUPS.forEach((group, groupIdx) => {
      const groupStart = currentIdx;
      group.sub.forEach((label) => {
        structure.push({
          label,
          groupIdx,
          type: "input",
          inputIdx: currentIdx,
        });
        inputIndices.push(currentIdx);
        currentIdx++;
      });
      if (group.hasTotal) {
        structure.push({
          label: "মোট",
          groupIdx,
          type: "groupTotal",
          inputs: Array.from(
            { length: group.sub.length },
            (_, i) => groupStart + i,
          ),
        });
        currentIdx++;
      }
    });

    structure.push({
      label: "সর্বমোট (বয়স ভিত্তিক)",
      type: "rowTotal",
      inputs: [...inputIndices],
    });

    return { structure, inputIndices, totalCols: structure.length };
  }, []);

  useEffect(() => {
    const load = async () => {
      const surveys = await getSurveys();
      const found = surveys.find((s) => s.id === id);
      if (found) {
        setSurvey(found);
        setGridData(found.data);
      }
    };
    load();
  }, [id]);

  const updateCell = useCallback(
    (rowIdx, colIdx, delta) => {
      if (!gridData) return;

      const newData = [...gridData];
      const currentRow = [...newData[rowIdx]];
      const newVal = Math.max(0, (currentRow[colIdx] || 0) + delta);

      if (newVal === currentRow[colIdx]) return;

      currentRow[colIdx] = newVal;
      newData[rowIdx] = currentRow;

      setGridData(newData);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Auto-save
      saveSurvey({ ...survey, data: newData });
    },
    [gridData, survey],
  );

  // Calculations
  const calculatedData = useMemo(() => {
    if (!gridData) return null;

    const rows = gridData.map((row) => {
      const newRow = [...row];
      let rowTotal = 0;

      // Calculate group totals and row total
      colInfo.structure.forEach((col, idx) => {
        if (col.type === "groupTotal") {
          const sum = col.inputs.reduce(
            (acc, inputIdx) => acc + (row[inputIdx] || 0),
            0,
          );
          newRow[idx] = sum;
        } else if (col.type === "rowTotal") {
          const sum = col.inputs.reduce(
            (acc, inputIdx) => acc + (row[inputIdx] || 0),
            0,
          );
          newRow[idx] = sum;
        }
      });
      return newRow;
    });

    // Calculate column totals (bottom row)
    const colTotals = Array(colInfo.totalCols).fill(0);
    rows.forEach((row) => {
      row.forEach((val, idx) => {
        colTotals[idx] += val || 0;
      });
    });

    return { rows, colTotals };
  }, [gridData, colInfo]);

  if (!gridData || !calculatedData) return null;

  // Build compact location string
  const locationStr = [
    survey?.district,
    survey?.upazila,
    survey?.union,
    survey?.village,
  ]
    .filter(Boolean)
    .join(" › ");

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* ── Metadata Banner ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#F9FAFB",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          gap: 10,
        }}
      >
        {/* Surveyor */}
        <View style={{ flex: 1 }}>
          {survey?.surveyorName ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 3,
              }}
            >
              <User size={12} color="#6B7280" />
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}
                numberOfLines={1}
              >
                {survey.surveyorName}
                {survey.surveyorId ? (
                  <Text style={{ fontWeight: "400", color: "#9CA3AF" }}>
                    {" "}
                    ({survey.surveyorId})
                  </Text>
                ) : null}
              </Text>
            </View>
          ) : null}
          {locationStr ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <MapPin size={11} color="#9CA3AF" />
              <Text
                style={{ fontSize: 11, color: "#6B7280" }}
                numberOfLines={1}
              >
                {locationStr}
              </Text>
            </View>
          ) : null}
          {!survey?.surveyorName && !locationStr ? (
            <Text
              style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}
            >
              তথ্য যোগ করতে "তথ্য সম্পাদনা" বাটনে ক্লিক করুন
            </Text>
          ) : null}
        </View>

        {/* Edit Info Button */}
        <TouchableOpacity
          onPress={() => router.push(`/survey/edit-info?id=${id}`)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: "#EFF6FF",
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
          }}
        >
          <Info size={13} color="#2563EB" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563EB" }}>
            তথ্য সম্পাদনা
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2D Grid with Sticky Elements */}
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={true}
        style={{ flexGrow: 0 }}
      >
        <View>
          {/* Header Row 1: Groups */}
          <View
            style={{
              flexDirection: "row",
              height: HEADER_HEIGHT / 2,
              backgroundColor: "#F9FAFB",
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                width: AGE_COL_WIDTH,
                borderRightWidth: 1,
                borderRightColor: "#E5E7EB",
              }}
            />
            {COLUMN_GROUPS.map((group, idx) => {
              const width =
                (group.sub.length + (group.hasTotal ? 1 : 0)) * CELL_WIDTH;
              return (
                <View
                  key={idx}
                  style={{
                    width,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRightWidth: 1,
                    borderRightColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {group.title}
                  </Text>
                </View>
              );
            })}
            <View
              style={{
                width: CELL_WIDTH,
                borderRightWidth: 1,
                borderRightColor: "#E5E7EB",
              }}
            />
          </View>

          {/* Header Row 2: Sub-labels */}
          <View
            style={{
              flexDirection: "row",
              height: HEADER_HEIGHT / 2,
              backgroundColor: "#F9FAFB",
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                width: AGE_COL_WIDTH,
                alignItems: "center",
                justifyContent: "center",
                borderRightWidth: 1,
                borderRightColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#6B7280" }}
              >
                বয়স সীমা
              </Text>
            </View>
            {colInfo.structure.map((col, idx) => (
              <View
                key={idx}
                style={{
                  width: CELL_WIDTH,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRightWidth: 1,
                  borderRightColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: col.type === "input" ? "#6B7280" : "#2563EB",
                    textAlign: "center",
                  }}
                >
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          <ScrollView bounces={false}>
            {calculatedData.rows.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: "row",
                  height: ROW_HEIGHT,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                {/* Fixed Age Group Column */}
                <View
                  style={{
                    width: AGE_COL_WIDTH,
                    backgroundColor: "#F9FAFB",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRightWidth: 1,
                    borderRightColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {AGE_GROUPS[rowIdx]}
                  </Text>
                </View>

                {row.map((val, colIdx) => {
                  const col = colInfo.structure[colIdx];
                  const isTotal = col.type !== "input";

                  return (
                    <View
                      key={colIdx}
                      style={{
                        width: CELL_WIDTH,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRightWidth: 1,
                        borderRightColor: "#F3F4F6",
                        backgroundColor: isTotal ? "#EFF6FF" : "#FFFFFF",
                      }}
                    >
                      {!isTotal ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => updateCell(rowIdx, colIdx, -1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: "#F9FAFB",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                            }}
                          >
                            <Minus size={14} color="#6B7280" />
                          </TouchableOpacity>

                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#111827",
                              minWidth: 20,
                              textAlign: "center",
                            }}
                          >
                            {val}
                          </Text>

                          <TouchableOpacity
                            onPress={() => updateCell(rowIdx, colIdx, 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: "#2563EB",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#1D4ED8",
                          }}
                        >
                          {val}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Bottom Total Row */}
            <View
              style={{
                flexDirection: "row",
                height: ROW_HEIGHT,
                backgroundColor: "#F3F4F6",
                borderTopWidth: 2,
                borderTopColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  width: AGE_COL_WIDTH,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRightWidth: 1,
                  borderRightColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}
                >
                  সর্বমোট
                </Text>
              </View>
              {calculatedData.colTotals.map((total, idx) => (
                <View
                  key={idx}
                  style={{
                    width: CELL_WIDTH,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRightWidth: 1,
                    borderRightColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: "#111827",
                    }}
                  >
                    {total}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          left: 24,
          right: 24,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "PDF তৈরী হচ্ছে",
              "এই ফিচারের জন্য প্রিন্টিং মডিউল প্রয়োজন যা বর্তমানে সীমাবদ্ধ। আপনি ড্যাশবোর্ডে গিয়ে আপনার ডাটা সেভড দেখতে পাবেন।",
            )
          }
          style={{
            flex: 1,
            height: 50,
            backgroundColor: "#FFFFFF",
            borderRadius: 25,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <FileText size={20} color="#6B7280" />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>
            📄 PDF Generate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
