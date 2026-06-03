import AsyncStorage from "@react-native-async-storage/async-storage";

const SURVEYS_KEY = "surveys_data";

export const getSurveys = async () => {
  try {
    const data = await AsyncStorage.getItem(SURVEYS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting surveys:", error);
    return [];
  }
};

export const saveSurvey = async (survey) => {
  try {
    const surveys = await getSurveys();
    const index = surveys.findIndex((s) => s.id === survey.id);
    if (index > -1) {
      surveys[index] = survey;
    } else {
      surveys.push(survey);
    }
    await AsyncStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
  } catch (error) {
    console.error("Error saving survey:", error);
  }
};

export const deleteSurvey = async (id) => {
  try {
    const surveys = await getSurveys();
    const filtered = surveys.filter((s) => s.id !== id);
    await AsyncStorage.setItem(SURVEYS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting survey:", error);
  }
};
