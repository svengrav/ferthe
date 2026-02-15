import { useThemeStore } from "@app/shared/theme";
import * as React from "react-native";

export const LoadingSpinner = () => {
  const theme = useThemeStore();
  return <React.ActivityIndicator size="large" color={theme.colors.primary} />;
};
