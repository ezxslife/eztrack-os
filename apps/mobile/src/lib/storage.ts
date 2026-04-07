import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const secureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const webStorage = {
  async getItem(key: string) {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

const nativeStorage = {
  getItem(key: string) {
    return SecureStore.getItemAsync(key, secureStoreOptions);
  },
  setItem(key: string, value: string) {
    return SecureStore.setItemAsync(key, value, secureStoreOptions);
  },
  removeItem(key: string) {
    return SecureStore.deleteItemAsync(key, secureStoreOptions);
  },
};

export const authStorage = Platform.OS === "web" ? webStorage : nativeStorage;
export const persistStorage = Platform.OS === "web" ? webStorage : nativeStorage;
